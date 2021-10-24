import { useEffect, useRef, useState } from 'react';
import { Row, Col, Space, message, Tooltip, Typography, Popconfirm } from 'antd';
import io from 'socket.io-client';
import randomstring from 'randomstring';
import { Button, Input, Card, CardBody, CardHeader } from '../../components';
import { Text, Heading } from '@pancakeswap-libs/uikit';
const { Link } = Typography;

const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
    transports: ['websocket'],
    jsonp: false,
    forceNew: true,
    extraHeaders: {
        'Bypass-Tunnel-Reminder': 'true',
    },
    pingInterval: 60000,
    pingTimeout: 60000,
    upgradeTimeout: 30000,
});

export const Home = (props) => {
    const [channel, setChannel] = useState('');
    const [total, setTotal] = useState(0);
    // const [channelSize, setChannelSize] = useState(1);
    const fileRef = useRef(null);

    useEffect(() => {
        generateChannel();
        socket.on('threw', (data) => {
            message.success(data);
        });
    }, []);

    useEffect(() => {
        socket.on('total', setTotal);
    }, [total]);

    useEffect(() => {
        socket.on(channel, (data) => {
            message.success('You received a file.');
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
            message.info('Receiving file...');
        });

        socket.on(`join-${channel}`, (room) => {
            window.navigator.vibrate(200);
            message.info('A user joined the channel.');
        });
    }, [channel]);

    const generateChannel = () => {
        setChannel(
            randomstring.generate({
                length: 6,
                charset: 'numeric',
            })
        );
    };

    const throwFile = (file) => {
        console.log(file.target.files[0].size);
        if (file.target.files[0].size > 73400320) return message.error('File size must below 70MB.');
        getBase64(file.target.files[0]);
    };

    function getBase64(file) {
        message.success('Throwing file....');
        socket.emit('throw-file', { file: file, name: file.name, type: file.type, channel });
        fileRef.current.value = null;
    }

    const handleChange = (event) => {
        setChannel(event.target.value);
    };

    const handleConnectChannel = () => {
        if (!channel) return message.error('Empty channel');
        socket.emit('channel-join', channel);
    };

    return (
        <Row justify='center' style={{ margin: '20px' }}>
            <Col>
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
                                Transfer Channel: <Text>{channel}</Text> <Link onClick={generateChannel}>refresh</Link>
                            </Space>
                            {/* <Space>
                                Connected Users: <Text>{channelSize}</Text>
                            </Space> */}
                            <Space>
                                <Input onChange={handleChange} placeholder='Connect Channel' value={channel} />
                                <Button onClick={handleConnectChannel}>CONNECT</Button>
                            </Space>
                            <input type='file' onChange={throwFile} ref={fileRef} hidden />
                            <hr />
                            <div>Limit 70MB per throw</div>
                            <Space>
                                <Popconfirm
                                    title='Your file will be shared across channel.'
                                    onConfirm={() => fileRef.current.click()}
                                    // onCancel={cancel}
                                    okText='Agree'
                                    cancelText='Discard'
                                >
                                    <Button>THROW A FILE!</Button>
                                </Popconfirm>
                                <Tooltip title='We are not saving your files into our end, your file is running through socket to the destination devices.'>
                                    <Link>Where my file go?</Link>
                                </Tooltip>
                            </Space>
                            <small style={{ float: 'right', fontSize: '0.5rem' }}>
                                created by{' '}
                                <a href='https://fb.me/jammmg' target='_blank' rel='noreferrer'>
                                    jamg
                                </a>
                                <div>Total throws: {total}</div>
                            </small>
                        </Space>
                    </CardBody>
                </Card>
            </Col>
        </Row>
    );
};
