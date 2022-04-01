require('dotenv').config();
const express = require('express');
const http = require('http');
const morgan = require('morgan');
const app = express();
const mongoose = require('mongoose');
const siofu = require("socketio-file-upload");

require('./models/user');
require('./models/throw');
const router = require('./router');

mongoose.connect(process.env.MONGO_URI);

// App Setup
app.use(morgan('tiny'));
app.use(express.json({ limit: '50mb' }));
app.use(siofu.router)
router(app);

if (['production'].includes(process.env.NODE_ENV)) {
    app.use(express.static('client/build'));

    const path = require('path');

    app.get('*', (req, res) => {
        res.sendFile(path.resolve('client', 'build', 'index.html'));
    });
}

// Server Setup
const port = process.env.PORT || 5000;
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
    cors: {
        origin: true,
        credentials: true,
    },
    maxHttpBufferSize: 73400320,
    allowRequest: (req, callback) => {
        const backend = process.env.BACKEND_JAMG || 'http://localhost:3000';
        if (req.headers.origin !== backend) {
            return callback(null, false);
        }
        callback(null, true);
    },
});

server.listen(port);
console.log('Server is Listening on: ', port);

const Throws = mongoose.model('throws');

io.on('connection', async (socket) => {
    let buffers = []
    let file_name = ""
    let channel = ""
    let type = ""
    const totalThrows = await Throws.find();
    io.sockets.emit('total', totalThrows.length);

    var instance = new siofu();
    instance.listen(socket);


    socket.on('siofu_start', async (data) => {
        buffers = []
        file_name = data.name
        channel = data.meta.channel
        type = data.meta.type
    })
    
    socket.on('siofu_progress', async (data) => {
        buffers.push(data.content)
    })
    
    socket.on('siofu_done', async (data) => {
        const resultBuffer = Buffer.concat(buffers);
        io.to(socket.id).emit('threw', 'File has been threw.');
        socket.broadcast.emit(`receiving-${channel}`, { type: type });
        socket.broadcast.emit(channel, { file: resultBuffer, type, file_name });
        new Throws({ handshake: socket.handshake }).save();
        const totalThrows = await Throws.find();
        io.sockets.emit('total', totalThrows.length);
    })
    

    // socket.on('throw-file', async (data) => {
    //     console.log('file received, sending to channel#:', data.channel);
    //     io.to(socket.id).emit('threw', 'File has been threw.');
    //     socket.broadcast.emit(`receiving-${data.channel}`, { ...data, type: data.type });
    //     socket.broadcast.emit(data.channel, { ...data, type: data.type, });
    //     new Throws({ handshake: socket.handshake }).save();
    //     const totalThrows = await Throws.find();
    //     io.sockets.emit('total', totalThrows.length);
    // });

    socket.on('channel-join', (channel) => {
        console.log(socket.id, 'joining channel', channel);
        socket.broadcast.emit(`join-${channel}`, 'true');
        io.to(socket.id).emit(`channel-join-${channel}`, 'Successfully connected.');
    });
});
