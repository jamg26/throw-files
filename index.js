require('dotenv').config();
const express = require('express');
const http = require('http');
const morgan = require('morgan');
const mongoose = require('mongoose');
const siofu = require("socketio-file-upload");
const { Server } = require('socket.io');
const { join, resolve } = require('path');
const router = require('./router');

const app = express();
const port = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, getServerOptions());
const backend = process.env.BACKEND_JAMG || 'http://localhost:3000';

require('./models/user');
require('./models/throw');
const Throws = mongoose.model('throws');

// DB Setup
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// App Setup
app.use(morgan('tiny'));
app.use(express.json({ limit: '50mb' }));
app.use(siofu.router);
router(app);
setupProductionEnv(app);

server.listen(port, () => console.log(`HTTPS Server is Listening on: ${port}`));

io.on('connection', handleSocketConnection);

function handleSocketConnection(socket) {
    const fileUploadInstance = new siofu();
    let fileMetadata = {};

    fileUploadInstance.listen(socket);
    fileUploadInstance.on('error', handleUploadError);
    socket.on('siofu_start', data => handleUploadStart(socket, data, fileMetadata));
    socket.on('siofu_progress', data => handleUploadProgress(socket, data, fileMetadata));
    socket.on('siofu_done', () => handleUploadDone(socket, fileMetadata));
    socket.on('siofu_error', error => handleUploadError(socket, error));
    socket.on('disconnect', () => handleDisconnectDuringUpload(socket, fileMetadata));
    socket.on('channel-join', handleChannelJoin);
    socket.on('disconnecting', () => handleDisconnecting(socket, fileMetadata));

    emitTotalThrows();
}

function handleUploadError(error) {
    console.log('Upload error:', error);
}

function handleUploadError(socket, error) {
    console.log("An error occurred during upload: ", error);
}

function handleDisconnecting(socket, fileMetadata) {
    console.log(`Socket ${socket.id} disconnected.`);
}

function handleDisconnectDuringUpload(socket, fileMetadata) {
    console.log(`Socket ${socket.id} disconnected during file upload.`);
}

async function handleUploadStart(socket, data, fileMetadata) {
    Object.assign(fileMetadata, {
        name: data.name,
        channel: data.meta.channel,
        type: data.meta.type,
        size: data.size,
    });
    socket.broadcast.emit(`receiving-${fileMetadata.channel}`, fileMetadata);
}

function handleUploadProgress(socket, data, fileMetadata) {
    socket.broadcast.emit(fileMetadata.channel, {
        file: data.content,
        ...fileMetadata
    });
}

async function handleUploadDone(socket, fileMetadata) {
    socket.broadcast.emit(`done-${fileMetadata.channel}`, { type: fileMetadata.type, file_name: fileMetadata.name });
    await new Throws({ handshake: socket.handshake }).save();
    emitTotalThrows();
}

function handleChannelJoin(channel) {
    console.log(this.id, 'joining channel', channel);
    this.broadcast.emit(`join-${channel}`, 'true');
    io.to(this.id).emit(`channel-join-${channel}`, 'Successfully connected.');
}

async function emitTotalThrows() {
    const totalThrows = await Throws.countDocuments();
    io.sockets.emit('total', totalThrows);
}

function getServerOptions() {
    return {
        cors: {
            origin: true,
            credentials: true,
        },
        maxHttpBufferSize: 73400320,
        allowRequest: (req, callback) => {
            const origin = req.headers.origin;
            callback(null, origin === backend);
        },
    }
}

function setupProductionEnv(app) {
    if (process.env.NODE_ENV === 'production') {
        const buildPath = join(__dirname, 'client/build');
        app.use(express.static(buildPath));
        app.get("/service-worker.js", (req, res) => res.sendFile(resolve('client', 'build', 'worker.js')));
        app.get('*', (req, res) => res.sendFile(resolve('client', 'build', 'index.html')));
    }
}
