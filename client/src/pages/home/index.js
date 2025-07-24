import { memo, useEffect, useRef, useState, useContext } from "react";
import {
  Row,
  Col,
  Space,
  Tooltip,
  Popconfirm,
  List,
  Switch,
  Modal,
} from "antd";
import io from "socket.io-client";
import randomstring from "randomstring";
import { Button, Input, Card, CardBody, CardHeader } from "../../components";
import {
  Text,
  Heading,
  Link,
  RefreshIcon,
  CopyIcon,
  ShareIcon,
  MoonIcon,
  SunIcon,
} from "@pancakeswap/uikit";
import { ToastContainer } from "@pancakeswap-libs/uikit";
import { useSpring, animated, config } from "react-spring";
import styled from "styled-components";
import JSZip from "jszip";
import { ThemeContext } from "../../index";

var SocketIOFileUpload = require("socketio-file-upload");

// Get backend URL from environment variables
const BACKEND_URL =
  // Try to access environment variables in different formats for compatibility
  (typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_BACKEND_URL) ||
  (typeof window !== "undefined" &&
    window.ENV &&
    window.ENV.REACT_APP_BACKEND_URL) ||
  "http://localhost:5000";

// Get frontend URL from environment variables
const FRONTEND_URL =
  (typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_FRONTEND_URL) ||
  (typeof window !== "undefined" &&
    window.ENV &&
    window.ENV.REACT_APP_FRONTEND_URL) ||
  "http://localhost:3000";

const socket = io(BACKEND_URL, {
  transports: ["websocket"],
  jsonp: false,
  forceNew: true,
  extraHeaders: {
    "Bypass-Tunnel-Reminder": "true",
  },
});

// Feature announcement popup
const FeaturePopup = ({ visible, onClose }) => {
  return (
    <Modal
      title={null}
      footer={null}
      visible={visible}
      onCancel={onClose}
      centered
      width={400}
      bodyStyle={{ padding: 0, borderRadius: "16px", overflow: "hidden" }}
    >
      <div
        style={{
          background: "linear-gradient(139.73deg, #E6FDFF 0%, #F3EFFF 100%)",
          padding: "24px",
          borderRadius: "16px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-20px",
            right: "-20px",
            width: "150px",
            height: "150px",
            background: "rgba(237, 75, 158, 0.1)",
            borderRadius: "50%",
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-40px",
            left: "-40px",
            width: "200px",
            height: "200px",
            background: "rgba(237, 75, 158, 0.05)",
            borderRadius: "50%",
            zIndex: 0,
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <Heading size="xl" color="#ED4B9E" mb="16px">
            New Feature Alert! 🎉
          </Heading>

          <Text
            color="#280D5F"
            bold
            mb="16px"
            style={{ display: "block", fontSize: "18px" }}
          >
            Multiple File Transfers
          </Text>

          <Text
            color="#7A6EAA"
            style={{ display: "block", marginBottom: "24px" }}
          >
            We've upgraded! Now you can select multiple files at once for more
            efficient transfers.
          </Text>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text color="#7A6EAA" small>
              Try it now!
            </Text>
            <Button onClick={onClose} variant="primary">
              Got it!
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// History Modal component
const HistoryModal = ({
  visible,
  onClose,
  sentFilesHistory,
  receivedFilesHistory,
  onClearHistory,
  formatFileSize,
  formatTime,
  trimFileName,
  isDarkMode,
}) => {
  const [activeTab, setActiveTab] = useState("all");

  const getAllFiles = () => {
    const allFiles = [
      ...sentFilesHistory.map((file) => ({ ...file, type: "sent" })),
      ...receivedFilesHistory.map((file) => ({ ...file, type: "received" })),
    ].sort(
      (a, b) =>
        new Date(b.sentAt || b.receivedAt) - new Date(a.sentAt || a.receivedAt)
    );

    return allFiles;
  };

  const getFilteredFiles = () => {
    switch (activeTab) {
      case "sent":
        return sentFilesHistory.map((file) => ({ ...file, type: "sent" }));
      case "received":
        return receivedFilesHistory.map((file) => ({
          ...file,
          type: "received",
        }));
      default:
        return getAllFiles();
    }
  };

  const renderHistoryContent = () => {
    const files = getFilteredFiles();

    if (files.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <Text color="textDisabled" style={{ fontSize: "16px" }}>
            📁 No files {activeTab === "all" ? "transferred" : activeTab} yet in
            this session
          </Text>
          <br />
          <Text
            color="textDisabled"
            style={{ fontSize: "14px", marginTop: "8px" }}
          >
            Your {activeTab === "all" ? "file transfers" : `${activeTab} files`}{" "}
            will appear here temporarily until page refresh
          </Text>
        </div>
      );
    }

    return (
      <div style={{ maxHeight: "400px", overflowY: "auto" }}>
        <List
          size="small"
          dataSource={files}
          renderItem={(file, index) => (
            <List.Item
              style={{
                border: "none",
                borderBottom:
                  index < files.length - 1 ? "1px solid #f0f0f0" : "none",
              }}
            >
              <div style={{ width: "100%", padding: "8px 0" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                  }}
                >
                  <Text
                    strong
                    style={{
                      fontSize: "14px",
                      color: "#000",
                    }}
                  >
                    {file.type === "sent" ? "📤" : "�"} {file.name}{" "}
                    {file.compressed && (
                      <span style={{ color: "#ED4B9E" }}>(Compressed)</span>
                    )}
                  </Text>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                    }}
                  >
                    <Text
                      small
                      color="textSubtle"
                      style={{ fontSize: "12px", color: "#000" }}
                    >
                      {formatTime(file.sentAt || file.receivedAt)}
                    </Text>
                    <Text
                      small
                      style={{
                        fontSize: "10px",
                        color: file.type === "sent" ? "#52c41a" : "#1890ff",
                        fontWeight: "bold",
                      }}
                    >
                      {file.type === "sent" ? "SENT" : "RECEIVED"}
                    </Text>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px",
                  }}
                >
                  <Text small color="textSubtle">
                    📊 Size: {formatFileSize(file.size)}
                  </Text>
                  <Text small color="textSubtle">
                    🔗 Channel: {file.channel}
                  </Text>
                </div>
              </div>
            </List.Item>
          )}
        />
      </div>
    );
  };

  const totalFiles = sentFilesHistory.length + receivedFilesHistory.length;

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px" }}>📋</span>
          <span>File Transfer History ({totalFiles})</span>
        </div>
      }
      visible={visible}
      onCancel={onClose}
      centered
      width={700}
      footer={
        totalFiles > 0 ? (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button onClick={onClearHistory} style={{ color: "#fff" }}>
              Clear All History
            </Button>
            <Button type="primary" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <Button type="primary" onClick={onClose}>
            Close
          </Button>
        )
      }
    >
      {/* Tab buttons */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "0" }}>
          {[
            { key: "all", label: `All (${totalFiles})`, icon: "📋" },
            {
              key: "sent",
              label: `Sent (${sentFilesHistory.length})`,
              icon: "📤",
            },
            {
              key: "received",
              label: `Received (${receivedFilesHistory.length})`,
              icon: "📥",
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "8px 16px",
                border: "none",
                background: activeTab === tab.key ? "#ED4B9E" : "transparent",
                color: activeTab === tab.key ? "white" : "#666",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: activeTab === tab.key ? "bold" : "normal",
                borderRadius: "4px 4px 0 0",
                marginBottom: "-1px",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {renderHistoryContent()}
    </Modal>
  );
};

export const Home = memo((props) => {
  var instance = new SocketIOFileUpload(socket);
  const [channel, setChannel] = useState("");
  const [currentChannel, setCurrentChannel] = useState(null);
  const [total, setTotal] = useState(0);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [throwing, setThrowing] = useState(false);
  const [toasts, setToasts] = useState([]);
  const fileRef = useRef(null);
  const [flip, set] = useState(false);
  const [progress, setProgress] = useState({});
  const [size, setSize] = useState({});
  const [filesBeingTransferred, setFilesBeingTransferred] = useState([]);
  const [compressFiles, setCompressFiles] = useState(true);
  const [showFeaturePopup, setShowFeaturePopup] = useState(false);
  const [sentFilesHistory, setSentFilesHistory] = useState([]);
  const [receivedFilesHistory, setReceivedFilesHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  const [sizeLimit, setSizeLimit] = useState("5GB");

  let buffers = {};
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
    position: "relative",
    width: "100%",
    height: 20,
    fontSize: "1em",
    color: "#ED4B9E",
    overflow: "hidden",
    fontWeight: "bold",
  });

  const words = [
    "Bluetooth",
    "Infrared",
    "Tether",
    "Magic",
    "WiFi",
    "5G",
    "Fiber",
    "Satellite",
  ];

  const { scroll } = useSpring({
    scroll: (words.length - 1) * 50,
    from: { scroll: 0 },
    reset: true,
    reverse: flip,
    delay: 200,
    config: config.molasses,
    onRest: () => set(!flip),
  });

  // Handle popup close
  const handleFeaturePopupClose = () => {
    setShowFeaturePopup(false);
    localStorage.setItem("hasSeenMultiFileFeature", "true");
  };

  useEffect(() => {
    generateChannel();
    // get query "channel" and set to state if exists
    const urlParams = new URLSearchParams(window.location.search);
    const channel = urlParams.get("channel");
    if (channel) {
      setChannel(channel);
      setCurrentChannel(channel);
    }
  }, []);

  useEffect(() => {
    instance.listenOnInput(document.getElementById("file_input"));
    instance.maxFileSize = calculateSize(sizeLimit);
    instance.addEventListener("progress", (p) => {
      const percentage = ((p.bytesLoaded / p.file.size) * 100).toFixed(2);
      setProgress((prev) => ({
        ...prev,
        [p.file.id]: percentage,
      }));
      setThrowing(true);
      setSize((prev) => ({
        ...prev,
        [p.file.id]: { received: p.bytesLoaded, original: p.file.size },
      }));
    });

    instance.addEventListener("complete", function (event) {
      uploading = false;
      addToast(
        "Upload File",
        `${event.file.name} uploaded successfully`,
        "success"
      );

      // Add to sent files history
      const sentFile = {
        id: event.file.id,
        name: event.file.name,
        size: event.file.size,
        type: event.file.type,
        sentAt: new Date(),
        channel: channel,
        compressed: event.file.meta?.compressed || false,
      };

      setSentFilesHistory((prev) => [sentFile, ...prev]);

      setProgress((prev) => {
        const updated = { ...prev };
        delete updated[event.file.id];
        return updated;
      });

      setFilesBeingTransferred((prev) =>
        prev.filter((file) => file.id !== event.file.id)
      );

      if (Object.keys(progress).length === 0) {
        setThrowing(false);
      }
      fileRef.current.value = null;
    });

    instance.addEventListener("start", function (event) {
      addToast("Please wait!", `Throwing file ${event.file.name}...`, "info");
      uploading = true;
      event.file.meta.channel = channel;
      event.file.meta.type = event.file.type;
      event.file.meta.size = event.file.size;
      event.file.meta.id = event.file.id;
      event.file.meta.compressed = event.file.meta.compressed || false;
      const chunkSize = chunkPicker(event.file.size);
      instance.chunkSize = chunkSize;
      console.log("chunkSize:", instance.chunkSize);

      setFilesBeingTransferred((prev) => [
        ...prev,
        {
          id: event.file.id,
          name: event.file.name,
          size: event.file.size,
          type: event.file.type,
          compressed: event.file.meta.compressed || false,
        },
      ]);
    });

    instance.addEventListener("error", function (data) {
      uploading = false;
      if (data.code === 1) {
        addToast("Oops!", "File size exceed.", "danger");
        setProgress({});
        setThrowing(false);
        fileRef.current.value = null;
      }
    });

    if (channel) {
      handleConnectChannel();
    }

    if (channel) {
      window.history.pushState({}, "", `/?channel=${channel}`);
    }

    return () => {
      instance.destroy();
      instance = null;
    };
  }, [channel]);

  useEffect(() => {
    socket.on("total", setTotal);
  }, [total]);

  useEffect(() => {
    socket.on(channel, (data) => {
      const fileId = data.id;
      if (!buffers[fileId]) {
        // Initialize buffer for this file
        buffers[fileId] = {
          chunks: [],
          bytesReceived: 0,
          fileInfo: {
            name: data.name,
            type: data.type,
            size: data.size,
            compressed: data.compressed || false,
          },
        };

        // Add file to UI
        setFilesBeingTransferred((prev) => [
          ...prev,
          {
            id: fileId,
            name: data.name,
            size: data.size,
            type: data.type,
            compressed: data.compressed || false,
            receiving: true,
          },
        ]);
      }

      // Make sure buffer exists (defensive programming)
      if (buffers[fileId]) {
        // Add chunk to buffer
        buffers[fileId].chunks.push(data.file);
        buffers[fileId].bytesReceived += data.file.byteLength;

        // Calculate percentage
        const percentage = (
          (buffers[fileId].bytesReceived / data.size) *
          100
        ).toFixed(2);

        // Update progress
        setProgress((prev) => ({
          ...prev,
          [fileId]: percentage,
        }));

        // Update size tracking
        setSize((prev) => ({
          ...prev,
          [fileId]: {
            received: buffers[fileId]?.bytesReceived,
            original: data.size,
          },
        }));

        setThrowing(true);
      }
    });

    socket.on(`done-${channel}`, async (data) => {
      const fileId = data.file_id;

      if (buffers[fileId]) {
        const fileData = buffers[fileId];

        console.log("## ", {
          compressed: fileData.fileInfo.compressed,
          chunks: fileData.chunks,
          fileInfo: fileData.fileInfo,
        });

        addToast(
          "Great!",
          `You received the file: ${data.file_name}`,
          "success"
        );

        // Add to received files history
        const receivedFile = {
          id: fileId,
          name: data.file_name,
          size: fileData.fileInfo.size,
          type: data.type,
          receivedAt: new Date(),
          channel: channel,
          compressed: fileData.fileInfo.compressed || false,
        };

        setReceivedFilesHistory((prev) => [receivedFile, ...prev]);

        const blob = new Blob(fileData.chunks, { type: data.type });
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = data.file_name;
        a.click();
        URL.revokeObjectURL(objectUrl);

        window.navigator.vibrate(200);

        // Clean up
        delete buffers[fileId];

        setProgress((prev) => {
          const updated = { ...prev };
          delete updated[fileId];
          return updated;
        });

        setFilesBeingTransferred((prev) =>
          prev.filter((file) => file.id !== fileId)
        );

        if (Object.keys(progress).length === 0) {
          setThrowing(false);
        }
      }
    });

    socket.on(`join-${channel}`, (room) => {
      window.navigator.vibrate(200);
      addToast("Great!", "A user connected with the channel.", "info");
      // TODO: Play Notification Sound
    });

    socket.on(`receiving-${channel}`, (data) => {
      window.navigator.vibrate(200);
      addToast("Please Wait", `Receiving file: ${data.name}...`, "info");
      // TODO: Play Notification Sound
    });

    socket.on(`channel-join-${channel}`, (data) => {
      addToast("Great!", data, "success");
      // TODO: Play Notification Sound
    });

    socket.on(`connections-${channel}`, (count) => {
      setConnectedUsers(count);
    });

    document.onpaste = (evt) => {
      const dT = evt.clipboardData || window.clipboardData;
      const files = dT.files;
      if (!files || files.length === 0) return;

      if (uploading)
        return addToast(
          "Oops!",
          "Your files are currently uploading.",
          "danger"
        );

      handleFiles(files);
    };
  }, [channel]);

  function calculateSize(fileSize) {
    let size = parseFloat(fileSize);
    let unit = fileSize.replace(size, "").trim().toLowerCase();

    switch (unit) {
      case "gb":
        return size * 1024 * 1024 * 1024;
      case "mb":
        return size * 1024 * 1024;
      case "kb":
        return size * 1024;
      case "b":
        return size;
      default:
        return "Invalid unit. Please use GB, MB, KB, or B.";
    }
  }

  const generateChannel = () => {
    // Store the previous channel before generating a new one
    const previousChannel = currentChannel;
    const newChannel = randomstring.generate({
      length: 6,
      charset: "alphanumeric",
      capitalization: "uppercase",
    });

    setChannel(newChannel);
  };

  const handleChange = (event) => {
    const newChannel = event.target.value.toUpperCase().slice(0, 6);
    setChannel(newChannel);
  };

  const handleConnectChannel = () => {
    if (!channel) return addToast("Oops!", "Empty channel.", "danger");

    // Check if we're already connected to a channel
    if (currentChannel && currentChannel !== channel) {
      // If changing to a different channel, send both previous and new channel
      socket.emit("channel-change", {
        previousChannel: currentChannel,
        newChannel: channel,
      });
    } else {
      // First time joining a channel
      socket.emit("channel-join", channel);
    }

    // Update local tracking of current channel
    setCurrentChannel(channel);
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
    setToasts((prevToasts) =>
      prevToasts.filter((prevToast) => prevToast.id !== id)
    );
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(channel).then((r) => {
      addToast("Copied!", "Channel copied to clipboard.", "success");
    });
  };

  const shareChannel = () => {
    const url = `${FRONTEND_URL}/?channel=${channel}`;
    navigator.clipboard.writeText(url).then((r) => {
      addToast("Copied!", "Channel URL copied to clipboard.", "success");
    });
    if (navigator.share) {
      navigator
        .share({
          title: "Throw My File",
          text: "Share your files with anyone, anywhere.",
          url: url,
        })
        .then(() => console.log("Successful share"))
        .catch((error) => console.log("Error sharing", error));
    } else {
      addToast(
        "Oops!",
        "Your browser does not support Web Share API.",
        "danger"
      );
    }
  };

  const handleCompressToggle = (checked) => {
    setCompressFiles(checked);
  };

  const handleFiles = async (fileList) => {
    if (compressFiles && fileList.length > 1) {
      try {
        addToast(
          "Compressing",
          `Compressing ${fileList.length} files...`,
          "info"
        );

        // Create a new zip file
        const zip = new JSZip();

        // Add each file to the zip
        for (let i = 0; i < fileList.length; i++) {
          const file = fileList[i];
          const fileContent = await readFileAsArrayBuffer(file);
          zip.file(file.name, fileContent);
        }

        // Generate the zip content
        const zipContent = await zip.generateAsync({ type: "blob" });

        // Create a File object from the zip content
        const zipFile = new File(
          [zipContent],
          `files_${new Date().toISOString().replace(/[:.]/g, "-")}.zip`,
          { type: "application/zip" }
        );

        // Add metadata to the file directly to avoid reference issues
        const customZipFile = new File([zipFile], zipFile.name, {
          type: zipFile.type,
          lastModified: zipFile.lastModified,
        });

        // Set metadata that will be used later
        customZipFile.meta = {
          compressed: true,
          channel: channel,
        };

        // Upload the zip file
        instance.submitFiles([customZipFile]);
      } catch (error) {
        console.error("Error creating zip:", error);
        addToast("Error", "Failed to compress files", "danger");
      }
    } else {
      // Upload individual files without compression
      instance.submitFiles(fileList);
    }
  };

  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleSendClick = () => {
    fileRef.current.click();
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Convert FileList to Array before passing to handleFiles
    const filesArray = Array.from(files);
    handleFiles(filesArray);
  };

  const renderFileTransferList = () => {
    if (filesBeingTransferred.length === 0) return null;

    return (
      <List
        size="small"
        bordered
        dataSource={filesBeingTransferred}
        renderItem={(file) => (
          <List.Item>
            <div style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>
                  {file.name} {file.compressed && "(Compressed)"}
                </Text>
                <Text>{file.receiving ? "Receiving" : "Sending"}</Text>
              </div>
              <div>
                {progress[file.id] && (
                  <div style={{ width: "100%" }}>
                    <div
                      style={{
                        height: "4px",
                        background: "#f0f0f0",
                        borderRadius: "2px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${progress[file.id]}%`,
                          height: "100%",
                          background: "#ED4B9E",
                          transition: "width 0.2s",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.8em",
                      }}
                    >
                      <Text>{progress[file.id]}%</Text>
                      {size[file.id] && (
                        <Text>
                          {((size[file.id].received || 0) / 1048576).toFixed(2)}{" "}
                          /{" "}
                          {((size[file.id].original || 0) / 1048576).toFixed(2)}{" "}
                          MB
                        </Text>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </List.Item>
        )}
      />
    );
  };

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Helper function to format time
  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Helper function to trim long file names
  const trimFileName = (fileName, maxLength = 20) => {
    if (fileName.length <= maxLength) return fileName;

    const extension = fileName.split(".").pop();
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf("."));

    if (nameWithoutExt.length <= maxLength - extension.length - 4) {
      return fileName;
    }

    const trimmedName = nameWithoutExt.substring(
      0,
      Math.max(5, maxLength - extension.length - 4)
    );
    return `${trimmedName}....${nameWithoutExt.slice(-3)}.${extension}`;
  };

  // Render sent and received files history (inline version - shows recent 3 files)
  const renderFileHistory = () => {
    const allFiles = [
      ...sentFilesHistory.map((file) => ({ ...file, type: "sent" })),
      ...receivedFilesHistory.map((file) => ({ ...file, type: "received" })),
    ].sort(
      (a, b) =>
        new Date(b.sentAt || b.receivedAt) - new Date(a.sentAt || a.receivedAt)
    );

    if (allFiles.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Text color="textDisabled">
            No files transferred yet in this session
          </Text>
        </div>
      );
    }

    // Show only the 3 most recent files in inline view
    const recentFiles = allFiles.slice(0, 3);

    return (
      <div>
        <List
          size="small"
          bordered={false}
          dataSource={recentFiles}
          renderItem={(file, index) => (
            <div
              style={{
                padding: "8px 12px",
                border: `1px solid ${isDarkMode ? "#333" : "gray"}`,
                borderRadius: "6px",
                marginBottom: index < recentFiles.length - 1 ? "8px" : "0",
                background: isDarkMode ? "#2a2a2a" : "#ffffff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                }}
              >
                <Text
                  strong
                  style={{
                    color: isDarkMode ? "#fff" : "#000",
                    fontSize: "13px",
                  }}
                >
                  {file.type === "sent" ? "📤" : "📥"}
                  <span title={file.name} style={{ marginLeft: "4px" }}>
                    {trimFileName(file.name)}
                  </span>
                  {file.compressed && (
                    <span style={{ color: "#ED4B9E", marginLeft: "4px" }}>
                      (Compressed)
                    </span>
                  )}
                </Text>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                  }}
                >
                  <Text
                    small
                    style={{
                      fontSize: "11px",
                      color: isDarkMode ? "#888" : "#666",
                    }}
                  >
                    {formatTime(file.sentAt || file.receivedAt)}
                  </Text>
                  <Text
                    small
                    style={{
                      fontSize: "9px",
                      color: file.type === "sent" ? "#52c41a" : "#1890ff",
                      fontWeight: "bold",
                    }}
                  >
                    {file.type === "sent" ? "SENT" : "RECEIVED"}
                  </Text>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "11px",
                }}
              >
                <Text
                  small
                  style={{
                    color: isDarkMode ? "#888" : "#666",
                  }}
                >
                  Size: {formatFileSize(file.size)}
                </Text>
                <Text
                  small
                  style={{
                    color: isDarkMode ? "#888" : "#666",
                  }}
                >
                  Channel: {file.channel}
                </Text>
              </div>
            </div>
          )}
        />
        {allFiles.length > 3 && (
          <div
            style={{
              textAlign: "center",
              padding: "8px",
              background: isDarkMode ? "#333" : "#f8f9fa",
              borderRadius: "4px",
              marginTop: "8px",
              border: `1px solid ${isDarkMode ? "#444" : "gray"}`,
            }}
          >
            <Text
              small
              style={{
                color: isDarkMode ? "#888" : "#666",
              }}
            >
              ... and {allFiles.length - 3} more files.
              <Button
                variant="text"
                scale="sm"
                onClick={() => setShowHistoryModal(true)}
                style={{
                  padding: "0 4px",
                  color: "#ED4B9E",
                  background: "transparent",
                }}
              >
                View all
              </Button>
            </Text>
          </div>
        )}
      </div>
    );
  };

  return (
    <HomeComponent>
      <FeaturePopup
        visible={showFeaturePopup}
        onClose={handleFeaturePopupClose}
      />

      <HistoryModal
        visible={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        sentFilesHistory={sentFilesHistory}
        receivedFilesHistory={receivedFilesHistory}
        onClearHistory={() => {
          setSentFilesHistory([]);
          setReceivedFilesHistory([]);
        }}
        formatFileSize={formatFileSize}
        formatTime={formatTime}
        trimFileName={trimFileName}
        isDarkMode={isDarkMode}
      />

      <Row justify="center" style={{ margin: "20px" }}>
        <Col>
          <ToastContainer toasts={toasts} onRemove={handleRemoveToast} />
          <Card isWarning style={{ marginTop: "100px" }}>
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
                      style={{ width: "100%", height: 50, textAlign: "center" }}
                    >
                      {word}
                    </div>
                  ))}
                </animated.div>
              </Space>
            </CardHeader>
            <CardBody>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Space style={{ display: "flex", alignItems: "flex-start" }}>
                  <Text
                    style={{ display: "flex", flexDirection: "row", gap: 2 }}
                  >
                    Channel: {channel}
                    <div title="Copy to clipboard">
                      <CopyIcon
                        width={20}
                        onClick={copyToClipboard}
                        color="secondary"
                      />
                    </div>
                    <div title="Share link">
                      <ShareIcon
                        style={{ marginBottom: 5 }}
                        width={20}
                        onClick={shareChannel}
                        color="warning"
                      />
                    </div>
                  </Text>
                </Space>
                <Space style={{ display: "flex", alignItems: "flex-start" }}>
                  Max Limit: {sizeLimit}
                </Space>

                <Space>
                  <Input
                    scale="sm"
                    onChange={handleChange}
                    placeholder="Join an Existing Channel"
                    value={channel}
                  />
                  <Button
                    onClick={generateChannel}
                    scale="sm"
                    variant="success"
                  >
                    <RefreshIcon />
                  </Button>
                  <Button onClick={handleConnectChannel} scale="sm">
                    JOIN
                  </Button>
                </Space>
                <input
                  type="file"
                  ref={fileRef}
                  id="file_input"
                  multiple
                  hidden
                  onChange={handleFileInputChange}
                />
                <hr />

                {renderFileTransferList()}

                <Space>
                  <Popconfirm
                    title="Your files will be shared across the channel."
                    onConfirm={handleSendClick}
                    okText="Confirm"
                    cancelText="Cancel"
                  >
                    {throwing && (
                      <div className="dots">
                        <div></div>
                        <div></div>
                        <div></div>
                      </div>
                    )}
                    {!throwing && (
                      <Space direction="vertical">
                        <Button variant="danger" isLoading={throwing}>
                          SEND FILES
                        </Button>
                        <Text>Or paste directly from Clipboard!</Text>
                      </Space>
                    )}
                  </Popconfirm>
                </Space>

                {/* File History Section */}
                <div
                  style={{
                    border: `1px solid ${isDarkMode ? "#333" : "#f0f0f0"}`,
                    borderRadius: "8px",
                    padding: "12px",
                    background: isDarkMode ? "#2a2a2a" : "#fafbfc",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: showHistory ? "12px" : "0",
                    }}
                  >
                    <div>
                      <Text
                        style={{
                          fontWeight: "600",
                          color: isDarkMode ? "#ffffff" : "#000000",
                        }}
                      >
                        📋 File History (
                        {sentFilesHistory.length + receivedFilesHistory.length})
                      </Text>
                      <br />
                      <Text
                        small
                        style={{
                          fontSize: "11px",
                          color: isDarkMode ? "#888" : "#666",
                        }}
                      >
                        📤 {sentFilesHistory.length} sent • 📥{" "}
                        {receivedFilesHistory.length} received
                      </Text>
                    </div>
                    <Space>
                      {sentFilesHistory.length + receivedFilesHistory.length >
                        0 && (
                        <Button
                          scale="sm"
                          variant="tertiary"
                          onClick={() => setShowHistory(!showHistory)}
                        >
                          {showHistory ? "Hide" : "Recent"}
                        </Button>
                      )}
                      <Button
                        scale="sm"
                        variant="primary"
                        onClick={() => setShowHistoryModal(true)}
                        disabled={
                          sentFilesHistory.length +
                            receivedFilesHistory.length ===
                          0
                        }
                      >
                        View All
                      </Button>
                    </Space>
                  </div>

                  {showHistory && (
                    <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                      {renderFileHistory()}
                    </div>
                  )}

                  {sentFilesHistory.length + receivedFilesHistory.length ===
                    0 && (
                    <Text
                      small
                      style={{
                        fontStyle: "italic",
                        color: isDarkMode ? "#888" : "#666",
                      }}
                    >
                      Your sent and received files will appear here during this
                      session
                    </Text>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                  }}
                >
                  <Text style={{ fontSize: 8, marginRight: 5 }}>Theme:</Text>
                  <SunIcon
                    width={15}
                    color={isDarkMode ? "textDisabled" : "warning"}
                  />
                  <Switch
                    checked={isDarkMode}
                    onChange={toggleTheme}
                    style={{ margin: "0 5px" }}
                    size="small"
                  />
                  <MoonIcon
                    width={15}
                    color={isDarkMode ? "secondary" : "textDisabled"}
                  />
                </div>
                <small style={{ fontSize: "0.5rem" }}>
                  <div>Total files shared: {total}</div>
                  <div>Connected users in channel: {connectedUsers}</div>
                  <p style={{ marginBottom: 0 }}>
                    throwmyfile.com @{new Date().getFullYear()}
                  </p>
                  <a href="/privacy-policy">Privacy Policy</a>
                  <p>
                    <a
                      href="mailto:jammmg26@gmail.com"
                      target="_blank"
                      rel="noreferrer"
                    >
                      jammmg26@gmail.com
                    </a>
                  </p>
                </small>
                <Tooltip title="Rest easy! Your files travel securely, moving straight from your device to the recipient. We don't store any data on our servers.">
                  <Link small color="secondary">
                    Curious about your file's journey?
                  </Link>
                </Tooltip>
              </Space>
            </CardBody>
          </Card>
          <div style={{ display: "flex", marginTop: 300 }}>
            {/* <div style={{ width: 300, height: 50, background: '#000',  }}></div> */}
          </div>
        </Col>
      </Row>
    </HomeComponent>
  );
});

const HomeComponent = styled.div``;
