require("dotenv").config();
const express = require("express");
const http = require("http");
const morgan = require("morgan");
const mongoose = require("mongoose");
const siofu = require("socketio-file-upload");
const { Server } = require("socket.io");
const { join, resolve } = require("path");
const fs = require("fs");
const router = require("./router");

const app = express();
const port = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, getServerOptions());
const backend = process.env.FE_URL || "http://localhost:3000";

require("./models/user");
require("./models/throw");
const Throws = mongoose.model("throws");

// DB Setup
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// App Setup
app.use(morgan("tiny"));
app.use(express.json({ limit: "50mb" }));
app.use(siofu.router);
router(app);
setupProductionEnv(app);

server.listen(port, () => console.log(`HTTPS Server is Listening on: ${port}`));

io.on("connection", handleSocketConnection);

function handleSocketConnection(socket) {
  const fileUploadInstance = new siofu();
  let fileMetadataMap = new Map();

  // Specify the directory to save uploaded files
  fileUploadInstance.dir = join(__dirname, "uploads");

  // Ensure the upload directory exists
  if (!fs.existsSync(fileUploadInstance.dir)) {
    fs.mkdirSync(fileUploadInstance.dir, { recursive: true });
  }

  fileUploadInstance.listen(socket);
  fileUploadInstance.on("error", handleUploadError);

  // Handle the 'saved' event to capture file information
  fileUploadInstance.on("saved", (event) => {
    const fileId = event.file.id;
    if (fileMetadataMap.has(fileId)) {
      handleUploadDone(socket, fileMetadataMap.get(fileId), event);
    }
  });

  socket.on("siofu_start", (data) => {
    const fileId = data.id;
    const metadata = {
      id: fileId,
      name: data.name,
      channel: data.meta.channel,
      type: data.meta.type,
      size: data.size,
    };
    fileMetadataMap.set(fileId, metadata);
    handleUploadStart(socket, data, metadata);
  });

  socket.on("siofu_progress", (data) => {
    const fileId = data.id;
    if (fileMetadataMap.has(fileId)) {
      handleUploadProgress(socket, data, fileMetadataMap.get(fileId));
    }
  });

  socket.on("siofu_error", (error) => handleUploadError(socket, error));

  socket.on("disconnect", () => {
    // Clean up all files being processed for this socket
    fileMetadataMap.forEach((metadata) => {
      handleDisconnectDuringUpload(socket, metadata);
    });
    fileMetadataMap.clear();
  });

  socket.on("channel-join", handleChannelJoin);

  socket.on("disconnecting", () => {
    // Clean up all files being processed for this socket
    fileMetadataMap.forEach((metadata) => {
      handleDisconnecting(socket, metadata);
    });
  });

  emitTotalThrows();
}

function handleUploadError(error) {
  console.log("Upload error:", error);
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
  socket.broadcast.emit(`receiving-${fileMetadata.channel}`, fileMetadata);
}

function handleUploadProgress(socket, data, fileMetadata) {
  socket.broadcast.emit(fileMetadata.channel, {
    file: data.content,
    id: fileMetadata.id,
    name: fileMetadata.name,
    type: fileMetadata.type,
    size: fileMetadata.size,
  });
}

async function handleUploadDone(socket, fileMetadata, event) {
  // Get the uploaded file name from the 'saved' event
  const filePath = event.file.pathName;

  socket.broadcast.emit(`done-${fileMetadata.channel}`, {
    type: fileMetadata.type,
    file_name: fileMetadata.name,
    file_id: fileMetadata.id,
  });

  await new Throws({ handshake: socket.handshake }).save();

  // Remove the file after it is fully uploaded and processed
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(`Error deleting file ${filePath}:`, err);
    } else {
      console.log(`File ${filePath} deleted successfully.`);
    }
  });

  emitTotalThrows();
}

function handleChannelJoin(channel) {
  console.log(this.id, "joining channel", channel);
  this.broadcast.emit(`join-${channel}`, "true");
  io.to(this.id).emit(`channel-join-${channel}`, "Successfully connected.");
}

async function emitTotalThrows() {
  let totalThrows = 0;
  try {
    totalThrows = await Throws.countDocuments();
  } catch (e) {}
  io.sockets.emit("total", totalThrows);
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
  };
}

function setupProductionEnv(app) {
  if (process.env.NODE_ENV === "production") {
    const buildPath = join(__dirname, "client/build");
    app.use(express.static(buildPath));
    app.get("/service-worker.js", (req, res) =>
      res.sendFile(resolve("client", "build", "worker.js"))
    );
    app.get("*", (req, res) =>
      res.sendFile(resolve("client", "build", "index.html"))
    );
  }
}
