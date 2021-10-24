import { memo, useEffect, useRef, useState } from 'react';
import { Row, Col, Space, Tooltip, Popconfirm } from 'antd';
import io from 'socket.io-client';
import randomstring from 'randomstring';
import { Button, Input, Card, CardBody, CardHeader } from '../../components';
import { Text, Heading, ToastContainer, Link } from '@pancakeswap-libs/uikit';

const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
    transports: ['websocket'],
    jsonp: false,
    forceNew: true,
    extraHeaders: {
        'Bypass-Tunnel-Reminder': 'true',
    },
    // pingInterval: 60000,
    // pingTimeout: 60000,
    // upgradeTimeout: 30000,
});

export const Home = memo((props) => {
    const [channel, setChannel] = useState('');
    const [total, setTotal] = useState(0);
    const [throwing, setThrowing] = useState(false);
    const [toasts, setToasts] = useState([]);
    const fileRef = useRef(null);

    useEffect(() => {
        generateChannel();
        socket.on('threw', (data) => {
            addToast('Great!', data, 'success');
            // message.success(data);
            setThrowing(false);
        });
    }, []);

    useEffect(() => {
        socket.on('total', setTotal);
    }, [total]);

    useEffect(() => {
        socket.on(channel, (data) => {
            addToast('Great!', 'You received a file.', 'success');
            // message.success('You received a file.');
            var blob = new Blob([data.file], { type: data.type });
            var objectUrl = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = objectUrl;
            a.download = data.name;
            a.click();
            window.navigator.vibrate(200);
        });

        socket.on(`receiving-${channel}`, (data) => {
            window.navigator.vibrate(200);
            // message.info('Receiving file...');
            addToast('Please Wait', 'Receiving file...', 'info');
        });

        socket.on(`join-${channel}`, (room) => {
            window.navigator.vibrate(200);
            // message.info('A user joined the channel.');
            addToast('Great!', 'A user connected with the channel.', 'info');
        });
    }, [channel]);

    const generateChannel = () => {
        setChannel(
            randomstring.generate({
                length: 6,
                charset: 'numeric',
            })
        );
        socket.removeAllListeners();
    };

    const throwFile = (file) => {
        if (file.target.files[0].size > 73400320) return addToast('Oops!', 'File size must below 70MB.', 'danger');
        getBase64(file.target.files[0]);
    };

    function getBase64(file) {
        setThrowing(true);
        // message.success('Throwing file....');
        addToast('Please wait!', 'Throwing file....', 'info');
        socket.emit('throw-file', { file: file, name: file.name, type: file.type, channel });
        fileRef.current.value = null;
    }

    const handleChange = (event) => {
        setChannel(event.target.value);
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

        setToasts((prevToasts) => [randomToast, ...prevToasts]);
    };

    const handleRemoveToast = (id) => {
        setToasts((prevToasts) => prevToasts.filter((prevToast) => prevToast.id !== id));
    };

    return (
        <Row justify='center' style={{ margin: '20px' }}>
            <Col>
                <ToastContainer toasts={toasts} onRemove={handleRemoveToast} />
                <Card isActive style={{ marginTop: '100px' }}>
                    <CardHeader>
                        <Heading>
                            Transfer files realtime across devices! <br />
                            Wherever you are.
                        </Heading>
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
                            <input type='file' onChange={throwFile} ref={fileRef} hidden />
                            <hr />
                            <div>Limit 100MB per throw</div>
                            <Space>
                                <Popconfirm
                                    title='Your file will be shared across channel.'
                                    onConfirm={() => fileRef.current.click()}
                                    // onCancel={cancel}
                                    okText='Agree'
                                    cancelText='Discard'
                                >
                                    <Button variant='danger' isLoading={throwing}>
                                        {!throwing ? 'THROW A FILE!' : 'PLEASE WAIT!'}
                                    </Button>
                                </Popconfirm>
                                <Tooltip title='We are not saving your files into our end, your file is running through socket to the destination devices.'>
                                    <Link small color='secondary'>
                                        Where my file go?
                                    </Link>
                                </Tooltip>
                            </Space>
                            <small style={{ float: 'right', fontSize: '0.5rem' }}>
                                <div>Total throws: {total}</div>Need help?{' '}
                                <a href='https://fb.me/jammmg' target='_blank' rel='noreferrer'>
                                    jamg
                                </a>
                            </small>
                        </Space>
                    </CardBody>
                </Card>
            </Col>
        </Row>
    );
});
