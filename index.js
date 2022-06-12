require('dotenv').config();
const express = require('express');
const http = require('https');
const morgan = require('morgan');
const app = express();
const mongoose = require('mongoose');
const siofu = require("socketio-file-upload");
const fs = require("fs");
require('./models/user');
require('./models/throw');
const router = require('./router');
const path = require('path');

mongoose.connect(process.env.MONGO_URI);

// App Setup
app.use(morgan('tiny'));
app.use(express.json({ limit: '50mb' }));
app.use(siofu.router)
router(app);

if (['production'].includes(process.env.NODE_ENV)) {
    app.use(express.static(path.join(__dirname, 'build')));
    app.get("/service-worker.js", (req, res) => {
      res.sendFile(path.resolve('client', 'build', 'worker.js'));
    });
    app.get('*', (req, res) => {
        res.sendFile(path.resolve('client', 'build', 'index.html'));
    });
}

const httpsOptions = {
              key: fs.readFileSync(`./config/localhost.decrypted.key`),
              cert: fs.readFileSync(`./config/localhost.crt`),
          }

// Server Setup
const port = process.env.PORT || 5000;
const server = http.createServer(httpsOptions, app);
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
    let file_name = ""
    let channel = ""
    let type = ""
    let size = ""

    var instance = new siofu();
    instance.listen(socket);


    socket.on('siofu_start', async (data) => {
        file_name = data.name
        channel = data.meta.channel
        type = data.meta.type
        size = data.size
        socket.broadcast.emit(`receiving-${channel}`, { type, file_name, size });
    })
    
    socket.on('siofu_progress', async (data) => {
        socket.broadcast.emit(channel, { file: data.content, type, file_name, size });
    })
    
    socket.on('siofu_done', async (data) => {
        socket.broadcast.emit(`done-${channel}`, { type, file_name });
        await new Throws({ handshake: socket.handshake }).save();
        const totalThrows = await Throws.countDocuments();
        io.sockets.emit('total', totalThrows);
    })
    

    socket.on('channel-join', (channel) => {
        console.log(socket.id, 'joining channel', channel);
        socket.broadcast.emit(`join-${channel}`, 'true');
        io.to(socket.id).emit(`channel-join-${channel}`, 'Successfully connected.');
    });


    const totalThrows = await Throws.countDocuments();
    io.sockets.emit('total', totalThrows);
});
