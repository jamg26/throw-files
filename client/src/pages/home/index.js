import { useEffect, useRef, useState } from 'react';
import { Row, Col, Space, message, Tooltip, Typography } from 'antd';
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
    // const [file, setFile] = useState(null);
    const [connectChannel, setConnectChannel] = useState(null);
    const [channel, setChannel] = useState();
    const fileRef = useRef(null);

    useEffect(() => {
        generateChannel();
    }, []);

    useEffect(() => {
        socket.on(channel, (data) => {
            message.success('a user sent a file.');
            var blob = new Blob([data.file], { type: data.type });
            var objectUrl = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = objectUrl;
            a.download = data.name;
            a.click();
        });

        socket.on(`join-${channel}`, (data) => {
            message.info(data);
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
        getBase64(file.target.files[0]);
    };

    function getBase64(file) {
        message.success('Throwing file....');
        socket.emit('throw-file', { file: file, name: file.name, type: file.type, channel });
        fileRef.current.value = null;
    }

    const handleChange = (event) => {
        setConnectChannel(event.target.value);
    };

    const handleConnectChannel = () => {
        socket.emit('channel-join', channel);
        setChannel(connectChannel);
    };

    return (
        <Row justify='center' style={{ margin: '20px' }}>
            <Col>
                <Card isActive style={{ marginTop: '100px' }}>
                    <CardHeader>
                        <Heading>Transfer files realtime across devices!</Heading>
                    </CardHeader>
                    <CardBody>
                        <Space direction='vertical'>
                            <Space>
                                Transfer Channel: <Text>{channel}</Text> <Link onClick={generateChannel}>refresh</Link>
                            </Space>
                            <Space>
                                <Input onChange={handleChange} placeholder='Connect Channel' />
                                <Button onClick={handleConnectChannel}>CONNECT</Button>
                            </Space>
                            <input type='file' onChange={throwFile} ref={fileRef} hidden />
                            <hr />
                            <div>Limit 50MB per throw</div>
                            <Space>
                                <Button onClick={() => fileRef.current.click()}>THROW A FILE!</Button>{' '}
                                <Tooltip title='We are not saving your files into our end, we actually doing magic to teleport to your destination devices.'>
                                    <Link>?</Link>
                                </Tooltip>
                            </Space>
                            <small style={{ float: 'right', fontSize: '0.5rem' }}>
                                created by{' '}
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
};
