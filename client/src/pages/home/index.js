import { memo, useEffect, useRef, useState } from 'react';
import { Row, Col, Space, Tooltip, Popconfirm } from 'antd';
import io from 'socket.io-client';
import randomstring from 'randomstring';
import { Button, Input, Card, CardBody, CardHeader } from '../../components';
import { Text, Heading, Link } from '@pancakeswap/uikit';
import { ToastContainer } from '@pancakeswap-libs/uikit';
import { useSpring, animated, config } from 'react-spring';
import BuyMeACoffee from '../../media/buymeacoffee.png'
import styled from 'styled-components'

var SocketIOFileUpload = require('socketio-file-upload');

const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
    transports: ['websocket'],
    jsonp: false,
    forceNew: true,
    extraHeaders: {
        'Bypass-Tunnel-Reminder': 'true',
    },
});

export const Home = memo((props) => {
    var instance = new SocketIOFileUpload(socket);
    const [channel, setChannel] = useState('');
    const [total, setTotal] = useState(0);
    const [throwing, setThrowing] = useState(false);
    const [toasts, setToasts] = useState([]);
    const fileRef = useRef(null);
    const [flip, set] = useState(false);
    const [progress, setProgress] = useState(null);
    const [size, setSize] = useState(null);
    let buffer = []
    let uploading = false
    
    const springProps = useSpring({
        position: 'relative',
        width: '100%',
        height: 20,
        fontSize: '1em',
        color: '#ED4B9E',
        overflow: 'hidden',
        fontWeight: 'bold',
    });

    const words = ['Bluetooth', 'Infrared', 'Tether', 'Magic'];

    const { scroll } = useSpring({
        scroll: (words.length - 1) * 50,
        from: { scroll: 0 },
        reset: true,
        reverse: flip,
        delay: 200,
        config: config.molasses,
        onRest: () => set(!flip),
    });

    useEffect(() => {
        generateChannel();
    }, []);
    
    
    useEffect(() => {
        instance.listenOnInput(document.getElementById("file_input"));
        instance.chunkSize = 1024 * 2000;
        instance.maxFileSize = 1024000000 //209715200 // 100mb
        instance.addEventListener("progress", p => {
            const percentage = (p.bytesLoaded / p.file.size * 100).toFixed(2)
            setProgress(percentage)
            setThrowing(true)
            setSize({ received: p.bytesLoaded, original: p.file.size })
        })
        
        instance.addEventListener("complete", function(event){
            uploading = false
            addToast('Upload File', `Success`, 'success')
            setProgress(null)
            setThrowing(false)
            fileRef.current.value = null;
        });
        
        instance.addEventListener("start", function(event){
            addToast('Please wait!', 'Throwing file....', 'info');
            uploading = true
            event.file.meta.channel = channel;
            event.file.meta.type = event.file.type;
            event.file.meta.size = event.file.size;
        });

        instance.addEventListener("error", function(data){
            uploading = false
            if (data.code === 1) {
                addToast('Oops!', 'File size exceed.', 'danger');
                setProgress(null)
                setThrowing(false)
                fileRef.current.value = null;
            }
        });
        
        return () => {
            instance.destroy();
            instance = null;
        }
    }, [channel]);
    
    

    useEffect(() => {
        socket.on('total', setTotal);
    }, [total]);

    useEffect(() => {
        let bytes = 0
        socket.on(channel, (data) => {
            buffer.push(data.file)
            bytes += data.file.byteLength
            const percentage = (bytes / data.size * 100).toFixed(2)
            setProgress(percentage)
            setThrowing(true)
            setSize({ received: bytes , original: data.size })
        });

        socket.on(`done-${channel}`, (data) => {
            addToast('Great!', 'You received a file.', 'success');
            var blob = new Blob(buffer, { type: data.type });
            var objectUrl = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = objectUrl;
            a.download = data.file_name;
            a.click();
            window.navigator.vibrate(200);
            buffer = []
            bytes = 0
            setProgress(null)
            setThrowing(false)
        });

        socket.on(`join-${channel}`, (room) => {
            window.navigator.vibrate(200);
            addToast('Great!', 'A user connected with the channel.', 'info');
        });

        socket.on(`receiving-${channel}`, (data) => {
            window.navigator.vibrate(200);
            addToast('Please Wait', 'Receiving file...', 'info');
        });

        socket.on(`channel-join-${channel}`, (data) => {
            addToast('Great!', data, 'success');
        });

        document.onpaste = (evt) => {
            const dT = evt.clipboardData || window.clipboardData;
            const file = dT.files[0];
            if (!file) return;
            console.log(dT.files)
            if(uploading) return addToast('Oops!', 'Your files are currently uploading.', 'danger');
            instance.submitFiles(dT.files)
        };
        
    }, [channel]);

    const generateChannel = () => {
        setChannel(
            randomstring.generate({
                length: 6,
                charset: 'alphanumeric',
                capitalization: 'uppercase',
            })
        );
        socket.removeAllListeners();
    };

    // const throwFile = (file) => {
        // if (file.size > 73400320) return addToast('Oops!', 'File size must below 70MB.', 'danger');
        // getBase64(file);
    // };

    // function getBase64(file) {
    //     setThrowing(true);
    //     addToast('Please wait!', 'Throwing file....', 'info');
    //     socket.emit('throw-file', { file: file, name: file.name, type: file.type, channel });
    //     fileRef.current.value = null;
    // }

    const handleChange = (event) => {
        setChannel(event.target.value.toUpperCase().slice(0, 6));
    };

    const handleConnectChannel = () => {
        if (!channel) return addToast('Oops!', 'Empty channel.', 'danger');
        socket.emit('channel-join', channel);
    };

    const addToast = (title, description, variant) => {
        const now = Date.now();
        const randomToast = {
            id: `id-${now}`,
            title: title,
            description,
            type: variant,
        };

        setToasts([randomToast]);
    };

    const handleRemoveToast = (id) => {
        setToasts((prevToasts) => prevToasts.filter((prevToast) => prevToast.id !== id));
    };

    return (
        <HomeComponent>
            <Row justify='center' style={{ margin: '20px' }}>
                <Col>
                    <ToastContainer toasts={toasts} onRemove={handleRemoveToast} />
                    <Card isWarning style={{ marginTop: '100px' }}>
                        <CardHeader>
                            <Heading>
                                Transfer files realtime across devices! <br />
                                Wherever you are.
                            </Heading>
                            <Space>
                                We are not using
                                <animated.div style={springProps} scrollTop={scroll}>
                                    {words.map((word, i) => (
                                        <div
                                            key={`${word}_${i}`}
                                            style={{ width: '100%', height: 50, textAlign: 'center' }}
                                        >
                                            {word}
                                        </div>
                                    ))}
                                </animated.div>
                            </Space>
                        </CardHeader>
                        <CardBody>
                            <Space direction='vertical'>
                                <Space>
                                    Transfer Channel: <Text>{channel}</Text>
                                    <Link onClick={generateChannel} small color='secondary'>
                                        New Channel
                                    </Link>
                                </Space>
                                {/* <Space>
                                Connected Users: <Text>{channelSize}</Text>
                            </Space> */}
                                <Space>
                                    <Input
                                        scale='sm'
                                        onChange={handleChange}
                                        placeholder='Connect Channel'
                                        value={channel}
                                    />
                                    <Button onClick={handleConnectChannel} scale='sm'>
                                        CONNECT
                                    </Button>
                                </Space>
                                <input
                                    type='file'
                                    // onChange={(e) => throwFile(e.target.files[0])}
                                    ref={fileRef}
                                    id='file_input'
                                    hidden
                                />
                                <hr />
                                {size ? 
                                <div>{((size?.received || 0) / 1048576).toFixed(2)} / {((size?.original || 0) / 1048576).toFixed(2)} MB</div> : null}
                                <Space>
                                    <Popconfirm
                                        title='Your file will be shared across channel.'
                                        onConfirm={() => fileRef.current.click()}
                                        // onCancel={cancel}
                                        okText='Agree'
                                        cancelText='Discard'
                                    >
                                        <Space direction='vertical'>
                                            <Button variant='danger' isLoading={throwing}>
                                                {!throwing ? 'THROW A FILE!' : progress ? `${progress}%` : "PLEASE WAIT!"}
                                            </Button>
                                            <Text>Or paste from Clipboard!</Text>
                                        </Space>
                                    </Popconfirm>
                                    <Tooltip title='We are not saving your files into our end, your file is running through socket to the destination devices.'>
                                        <Link small color='secondary'>
                                            Where does my file will go?
                                        </Link>
                                    </Tooltip>
                                </Space>
                                <small style={{ float: 'right', fontSize: '0.5rem' }}>
                                    <div>
                                        <a href='https://fb.me/jammmg' target='_blank' rel='noreferrer'>
                                            Need Help?
                                        </a>
                                    </div>
                                    <div>Total throws: {total}</div>
                                    <p>throwmyfile.com @{new Date().getFullYear()}</p>
                                    <a href="https://buymeacoffee.com/jamg" target="_blank" rel="noreferrer"><img src={BuyMeACoffee} height={50} style={{margin: "-10px"}} /></a>
                                </small>
                            </Space>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </HomeComponent>
    );
});

const HomeComponent = styled.div`
    
`
