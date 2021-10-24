require('dotenv').config();
const express = require('express');
const http = require('http');
//const bodyParser = require("body-parser");
const morgan = require('morgan');
const app = express();
const mongoose = require('mongoose');

require('./models/user');
require('./models/throw');
const router = require('./router');

mongoose.connect(process.env.MONGO_URI, {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
    //   useCreateIndex: true,
    //   useFindAndModify: false,
});

// App Setup
app.use(morgan('tiny'));
//app.use(bodyParser.json({ type: "*/*" })); //deprecated
// app.use(express.json());
app.use(express.json({ limit: '50mb' }));
// app.use(express.usrlencoded({ limit: '50mb' }));
router(app);

if (['production'].includes(process.env.NODE_ENV)) {
    app.use(express.static('client/build'));

    const path = require('path');

    app.get('*', (req, res) => {
        res.sendFile(path.resolve('client', 'build', 'index.html'));
    });

    app.get('/service-worker.js', (req, res) => {
        res.sendFile(path.resolve('client', 'build', 'worker.js'));
    });
}

// Server Setup
const port = process.env.PORT || 5000;
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
    allowEIO3: true,
    cors: {
        origin: true,
        credentials: true,
    },
    maxHttpBufferSize: 55428800,
});

server.listen(port);
console.log('Server is Listening on: ', port);

const Throws = mongoose.model('throws');

io.on('connection', async (socket) => {
    const totalThrows = await Throws.find();
    io.sockets.emit('total', totalThrows.length);

    socket.on('throw-file', async (data) => {
        console.log('file received, sending to channel#:', data.channel);
        socket.broadcast.emit(`receiving-${data.channel}`, { ...data, type: data.type });
        socket.broadcast.emit(data.channel, { ...data, type: data.type });
        new Throws({ handshake: socket.handshake }).save();
        const totalThrows = await Throws.find();
        io.sockets.emit('total', totalThrows.length);
    });

    socket.on('channel-join', (channel) => {
        socket.broadcast.emit(`join-${channel}`, 'true');
    });
});
