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

export const Home = memo((props) => {
  var instance = new SocketIOFileUpload(socket);
  const [channel, setChannel] = useState("");
  const [total, setTotal] = useState(0);
  const [throwing, setThrowing] = useState(false);
  const [toasts, setToasts] = useState([]);
  const fileRef = useRef(null);
  const [flip, set] = useState(false);
  const [progress, setProgress] = useState({});
  const [size, setSize] = useState({});
  const [filesBeingTransferred, setFilesBeingTransferred] = useState([]);
  const [compressFiles, setCompressFiles] = useState(true);
  const [showFeaturePopup, setShowFeaturePopup] = useState(false);
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

  // Check if feature popup has been shown before
  useEffect(() => {
    const hasSeenPopup = localStorage.getItem("hasSeenMultiFileFeature");
    if (!hasSeenPopup) {
      setShowFeaturePopup(true);
    }
  }, []);

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
    if (channel) setChannel(channel);
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

        if (fileData.fileInfo.compressed) {
          addToast("Great!", "Receiving compressed files...", "info");

          try {
            // Handle compressed file (zip)
            const blob = new Blob(fileData.chunks, { type: "application/zip" });
            const zip = new JSZip();

            // Load the zip file
            const zipContent = await zip.loadAsync(blob);

            // Extract and download each file
            const files = Object.keys(zipContent.files).filter(
              (filename) => !zipContent.files[filename].dir
            );

            // Update status
            addToast("Great!", `Extracted ${files.length} files`, "success");

            // Download each file
            for (const filename of files) {
              const content = await zipContent.files[filename].async("blob");
              const objectUrl = URL.createObjectURL(content);
              const a = document.createElement("a");
              a.href = objectUrl;
              a.download = filename;
              a.click();
              URL.revokeObjectURL(objectUrl);
            }
          } catch (error) {
            console.error("Error extracting zip:", error);
            addToast("Error", "Failed to extract files from archive", "danger");
          }
        } else {
          // Handle single file (non-zip)
          addToast(
            "Great!",
            `You received the file: ${data.file_name}`,
            "success"
          );
          const blob = new Blob(fileData.chunks, { type: data.type });
          const objectUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = objectUrl;
          a.download = data.file_name;
          a.click();
          URL.revokeObjectURL(objectUrl);
        }

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

    socket.on(`connections-${channel}`, (data) => {
      console.log(data);
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
    setChannel(
      randomstring.generate({
        length: 6,
        charset: "alphanumeric",
        capitalization: "uppercase",
      })
    );
    socket.removeAllListeners();
  };

  const handleChange = (event) => {
    setChannel(event.target.value.toUpperCase().slice(0, 6));
  };

  const handleConnectChannel = () => {
    if (!channel) return addToast("Oops!", "Empty channel.", "danger");
    socket.emit("channel-join", channel);
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
                      <span>{progress[file.id]}%</span>
                      {size[file.id] && (
                        <span>
                          {((size[file.id].received || 0) / 1048576).toFixed(2)}{" "}
                          /{" "}
                          {((size[file.id].original || 0) / 1048576).toFixed(2)}{" "}
                          MB
                        </span>
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

  return (
    <HomeComponent>
      <FeaturePopup
        visible={showFeaturePopup}
        onClose={handleFeaturePopupClose}
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
                <small style={{ fontSize: "0.5rem" }}>
                  <div>Total files shared: {total}</div>
                  <p style={{ marginBottom: 0 }}>
                    throwmyfile.com @{new Date().getFullYear()}
                  </p>
                  <a href="/privacy-policy">privacy policy</a>
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

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                  }}
                >
                  <SunIcon
                    width={16}
                    color={isDarkMode ? "textDisabled" : "warning"}
                  />
                  <Switch
                    checked={isDarkMode}
                    onChange={toggleTheme}
                    style={{ margin: "0 8px" }}
                  />
                  <MoonIcon
                    width={16}
                    color={isDarkMode ? "secondary" : "textDisabled"}
                  />
                </div>
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
