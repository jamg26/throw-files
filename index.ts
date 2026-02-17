import dotenv from "dotenv";
dotenv.config();
import express, { Express, Request, Response } from "express";
import http from "http";
import morgan from "morgan";
import siofu from "socketio-file-upload";
import { Server, Socket } from "socket.io";
import { join, resolve } from "path";
import fs from "fs";
import router from "./router";

const app: Express = express();
const port = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, getServerOptions());
const backend = process.env.FE_URL || "http://localhost:3000";

// App Setup
app.use(morgan("tiny"));
app.use(express.json({ limit: "50mb" }));
app.use(siofu.router);
router(app);
setupProductionEnv(app);

// Track connected users per channel
const channelUsers = new Map<string, number>();

server.listen(port, () => console.log(`HTTPS Server is Listening on: ${port}`));

io.on("connection", handleSocketConnection);

interface FileMetadata {
  id: string;
  name: string;
  channel: string;
  type: string;
  size: number;
}

function handleSocketConnection(socket: Socket) {
  const fileUploadInstance = new siofu();
  let fileMetadataMap = new Map<string, FileMetadata>();
  let currentChannel: string | null = null;

  // Specify the directory to save uploaded files
  fileUploadInstance.dir = join(__dirname, "uploads");

  // Ensure the upload directory exists
  if (!fs.existsSync(fileUploadInstance.dir)) {
    fs.mkdirSync(fileUploadInstance.dir, { recursive: true });
  }

  fileUploadInstance.listen(socket);
  fileUploadInstance.on("error", handleUploadError);

  // Handle the 'saved' event to capture file information
  fileUploadInstance.on(
    "saved",
    (event: { file: { id: string; pathName: string } }) => {
      const fileId = event.file.id;
      if (fileMetadataMap.has(fileId)) {
        handleUploadDone(socket, fileMetadataMap.get(fileId)!, event);
      }
    },
  );

  socket.on(
    "siofu_start",
    (data: {
      id: string;
      name: string;
      meta: { channel: string; type: string };
      size: number;
    }) => {
      const fileId = data.id;
      const metadata: FileMetadata = {
        id: fileId,
        name: data.name,
        channel: data.meta.channel,
        type: data.meta.type,
        size: data.size,
      };
      fileMetadataMap.set(fileId, metadata);
      handleUploadStart(socket, data, metadata);
    },
  );

  socket.on("siofu_progress", (data: { id: string; content: ArrayBuffer }) => {
    const fileId = data.id;
    if (fileMetadataMap.has(fileId)) {
      handleUploadProgress(socket, data, fileMetadataMap.get(fileId)!);
    }
  });

  socket.on("siofu_error", (error: Error) => handleUploadError(socket, error));

  socket.on("disconnect", () => {
    // Clean up all files being processed for this socket
    fileMetadataMap.forEach((metadata) => {
      handleDisconnectDuringUpload(socket, metadata);
    });
    fileMetadataMap.clear();

    // Remove user from current channel if they were in one
    if (currentChannel) {
      if (channelUsers.has(currentChannel)) {
        const count = channelUsers.get(currentChannel)! - 1;
        channelUsers.set(currentChannel, count);

        // If count reaches 0, remove the channel entry
        if (count <= 0) {
          channelUsers.delete(currentChannel);
        } else {
          // Emit updated user count to remaining users in the channel
          io.emit(`connections-${currentChannel}`, count);
        }
      }
    }
  });

  socket.on("channel-join", (channel: string) => {
    // Save the current channel for this socket
    currentChannel = channel;
    handleChannelJoin(socket, channel);
  });

  socket.on(
    "channel-change",
    ({
      previousChannel,
      newChannel,
    }: {
      previousChannel: string;
      newChannel: string;
    }) => {
      // Handle the case when a user changes channels
      if (previousChannel && channelUsers.has(previousChannel)) {
        // Decrease the count in the previous channel
        const count = channelUsers.get(previousChannel)! - 1;
        channelUsers.set(previousChannel, count);

        // If count reaches 0, remove the channel entry
        if (count <= 0) {
          channelUsers.delete(previousChannel);
        } else {
          // Emit updated user count to remaining users in the previous channel
          io.emit(`connections-${previousChannel}`, count);
        }
      }

      // Update the current channel reference for this socket
      currentChannel = newChannel;

      // Join the new channel
      handleChannelJoin(socket, newChannel);
    },
  );

  socket.on("disconnecting", () => {
    // Clean up all files being processed for this socket
    fileMetadataMap.forEach((metadata) => {
      handleDisconnecting(socket, metadata);
    });
  });
}

function handleUploadError(socket: Socket | Error, error?: Error) {
  console.log("An error occurred during upload: ", error || socket);
}

function handleDisconnecting(socket: Socket, fileMetadata: FileMetadata) {
  console.log(`Socket ${socket.id} disconnected.`);
}

function handleDisconnectDuringUpload(
  socket: Socket,
  fileMetadata: FileMetadata,
) {
  console.log(`Socket ${socket.id} disconnected during file upload.`);
}

async function handleUploadStart(
  socket: Socket,
  data: { id: string },
  fileMetadata: FileMetadata,
) {
  socket.broadcast.emit(`receiving-${fileMetadata.channel}`, fileMetadata);
}

function handleUploadProgress(
  socket: Socket,
  data: { id: string; content: ArrayBuffer },
  fileMetadata: FileMetadata,
) {
  socket.broadcast.emit(fileMetadata.channel, {
    file: data.content,
    id: fileMetadata.id,
    name: fileMetadata.name,
    type: fileMetadata.type,
    size: fileMetadata.size,
  });
}

async function handleUploadDone(
  socket: Socket,
  fileMetadata: FileMetadata,
  event: { file: { pathName: string } },
) {
  // Get the uploaded file name from the 'saved' event
  const filePath = event.file.pathName;

  socket.broadcast.emit(`done-${fileMetadata.channel}`, {
    type: fileMetadata.type,
    file_name: fileMetadata.name,
    file_id: fileMetadata.id,
  });

  // Remove the file after it is fully uploaded and processed
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(`Error deleting file ${filePath}:`, err);
    } else {
      console.log(`File ${filePath} deleted successfully.`);
    }
  });
}

function handleChannelJoin(socket: Socket, channel: string) {
  console.log(socket.id, "joining channel", channel);

  // Update channel users count
  if (!channelUsers.has(channel)) {
    channelUsers.set(channel, 1);
  } else {
    channelUsers.set(channel, channelUsers.get(channel)! + 1);
  }

  // Get current user count
  const userCount = channelUsers.get(channel);

  // Broadcast join event to other users in the channel
  socket.broadcast.emit(`join-${channel}`, "true");

  // Send connection confirmation to joining user
  io.to(socket.id).emit(`channel-join-${channel}`, "Successfully connected.");

  // Broadcast updated user count to all users in the channel
  io.emit(`connections-${channel}`, userCount);
}

function getServerOptions() {
  return {
    cors: {
      origin: true,
      credentials: true,
    },
    maxHttpBufferSize: 73400320,
    allowRequest: (
      req: http.IncomingMessage,
      callback: (err: string | null | undefined, success: boolean) => void,
    ) => {
      const origin = req.headers.origin;
      callback(null, origin === backend);
    },
  };
}

function setupProductionEnv(app: Express) {
  if (process.env.NODE_ENV === 'production') {
    const buildPath = join(process.cwd(), 'client/build');
    app.use(express.static(buildPath));
    app.get('/service-worker.js', (req: Request, res: Response) =>
      res.sendFile(join(process.cwd(), 'client', 'build', 'worker.js'))
    );
    app.get('*', (req: Request, res: Response) =>
      res.sendFile(join(process.cwd(), 'client', 'build', 'index.html'))
    );
  }
}
