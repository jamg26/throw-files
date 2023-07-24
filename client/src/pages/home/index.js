import { memo, useEffect, useRef, useState } from 'react';
import { Row, Col, Space, Tooltip, Popconfirm } from 'antd';
import io from 'socket.io-client';
import randomstring from 'randomstring';
import { Button, Input, Card, CardBody, CardHeader } from '../../components';
import { Text, Heading, Link, RefreshIcon, CopyIcon, ShareIcon } from '@pancakeswap/uikit';
import { ToastContainer } from '@pancakeswap-libs/uikit';
import { useSpring, animated, config } from 'react-spring';
import styled from 'styled-components';

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
    let buffer = [];
    let uploading = false;

    const chunkPicker = (fileSize) => {
        const MB = 1024 * 1024;
        if (fileSize < MB) return 64 * 1024; // 64KB for files < 1MB
        if (fileSize < 10 * MB) return 256 * 1024; // 256KB for files < 10MB
        if (fileSize < 100 * MB) return MB; // 1MB for files < 100MB
        if (fileSize < 500 * MB) return 4 * MB; // 4MB for files < 500MB
        return 16 * MB; // 16MB for larger files
    };

    const springProps = useSpring({
        position: 'relative',
        width: '100%',
        height: 20,
        fontSize: '1em',
        color: '#ED4B9E',
        overflow: 'hidden',
        fontWeight: 'bold',
    });


    const words = ['Bluetooth', 'Infrared', 'Tether', 'Magic', 'WiFi', '5G', 'Fiber', 'Satellite'];


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
        // get query "channel" and set to state if exists
        const urlParams = new URLSearchParams(window.location.search);
        const channel = urlParams.get('channel');
        if (channel) setChannel(channel);
    }, []);

    useEffect(() => {
        instance.listenOnInput(document.getElementById('file_input'));
        // instance.chunkSize = 1024 * 100 // 1024 * 1024 * 64 // 64MB
        instance.maxFileSize = 1024 * 1024 * 1024 * 2; // 2GB
        instance.addEventListener('progress', (p) => {
            const percentage = ((p.bytesLoaded / p.file.size) * 100).toFixed(2);
            setProgress(percentage);
            setThrowing(true);
            setSize({ received: p.bytesLoaded, original: p.file.size });
        });

        instance.addEventListener('complete', function (event) {
            uploading = false;
            addToast('Upload File', `Success`, 'success');
            setProgress(null);
            setThrowing(false);
            fileRef.current.value = null;
        });

        instance.addEventListener('start', function (event) {
            addToast('Please wait!', 'Throwing file....', 'info');
            uploading = true;
            event.file.meta.channel = channel;
            event.file.meta.type = event.file.type;
            event.file.meta.size = event.file.size;
            const chunkSize = chunkPicker(event.file.size);
            instance.chunkSize = chunkSize;
            console.log('chunkSize:', instance.chunkSize);
        });

        instance.addEventListener('error', function (data) {
            uploading = false;
            if (data.code === 1) {
                addToast('Oops!', 'File size exceed.', 'danger');
                setProgress(null);
                setThrowing(false);
                fileRef.current.value = null;
            }
        });

        return () => {
            instance.destroy();
            instance = null;
        };
    }, [channel]);

    useEffect(() => {
        socket.on('total', setTotal);
    }, [total]);

    useEffect(() => {
        let bytes = 0;
        socket.on(channel, (data) => {
            buffer.push(data.file);
            bytes += data.file.byteLength;
            const percentage = ((bytes / data.size) * 100).toFixed(2);
            setProgress(percentage);
            setThrowing(true);
            setSize({ received: bytes, original: data.size });
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
            buffer = [];
            bytes = 0;
            setProgress(null);
            setThrowing(false);
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
            console.log(dT.files);
            if (uploading) return addToast('Oops!', 'Your files are currently uploading.', 'danger');
            instance.submitFiles(dT.files);
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

    const copyToClipboard = () => {
        navigator.clipboard.writeText(channel);
        addToast('Copied!', 'Channel copied to clipboard.', 'success');
    };

    const shareChannel = () => {
        const url = `${process.env.REACT_APP_FRONTEND_URL}/?channel=${channel}`;
        if (navigator.share) {
            navigator
                .share({
                    title: 'Throw My File',
                    text: 'Share your files with anyone, anywhere.',
                    url: url,
                })
                .then(() => console.log('Successful share'))
                .catch((error) => console.log('Error sharing', error));
        } else {
            addToast('Oops!', 'Your browser does not support Web Share API.', 'danger');
        }
    };

    return (
        <HomeComponent>
            <Row justify='center' style={{ margin: '20px' }}>
                <Col>
                    <ToastContainer toasts={toasts} onRemove={handleRemoveToast} />
                    <Card isWarning style={{ marginTop: '100px' }}>
                        <CardHeader>
                            <Heading>
                                Unleash the Power of Connectivity! <br />
                                Anytime, Anywhere.
                            </Heading>
                            <Space>
                                Transcending boundaries with
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
                                <Space style={{ display: 'flex', alignItems: 'flex-start' }}>
                                    Transfer Via: <Text style={{ display: 'flex', flexDirection: 'row', gap: 2 }}>{channel} 
                                    <div title='Copy to clipboard'><CopyIcon width={20} onClick={copyToClipboard} color='secondary' /></div>
                                    <div title='Share link'><ShareIcon style={{ marginBottom: 5 }} width={20} onClick={shareChannel} color="warning" /></div></Text>
                                </Space>
                                <Space>
                                    <Input
                                        scale='sm'
                                        onChange={handleChange}
                                        placeholder='Join an Existing Channel'
                                        value={channel}
                                    />
                                    <Button onClick={generateChannel} scale='sm' variant="success">
                                        <RefreshIcon />
                                    </Button>
                                    <Button onClick={handleConnectChannel} scale='sm'>
                                        JOIN
                                    </Button>
                                </Space>
                                <input type='file' ref={fileRef} id='file_input' hidden />
                                <hr />
                                {size ? (
                                    <div>
                                        Transferred: {((size?.received || 0) / 1048576).toFixed(2)} / Total Size:{' '}
                                        {((size?.original || 0) / 1048576).toFixed(2)} MB
                                    </div>
                                ) : null}
                                <Space>
                                    <Popconfirm
                                        title='Your file will be shared across the channel.'
                                        onConfirm={() => fileRef.current.click()}
                                        okText='Confirm'
                                        cancelText='Cancel'
                                    >
                                        <Space direction='vertical'>
                                            <Button variant='danger' isLoading={throwing}>
                                                {!throwing
                                                    ? 'SEND A FILE!'
                                                    : progress
                                                    ? `${progress}%`
                                                    : 'UPLOADING...'}
                                            </Button>
                                            <Text>Or paste directly from Clipboard!</Text>
                                        </Space>
                                    </Popconfirm>

                                </Space>
                                <small style={{ fontSize: '0.5rem' }}>
                                    <div>Total files shared: {total}</div>
                                    <p>throwmyfile.com @{new Date().getFullYear()}</p>
                                    <p>
                                        <a href='mailto:jammmg26@gmail.com' target='_blank' rel='noreferrer'>
                                            jammmg26@gmail.com
                                        </a>
                                    </p>
                                </small>
                                    <Tooltip title='Rest easy! Your files travel securely, moving straight from your device to the recipient. We don’t store any data on our servers.'>
                                        <Link small color='secondary'>
                                            Curious about your file's journey?
                                        </Link>
                                    </Tooltip>
                            </Space>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </HomeComponent>
    );
});

const HomeComponent = styled.div``;
