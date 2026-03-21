import { memo, useEffect, useRef, useState, ChangeEvent } from "react";
import {
  RefreshCw,
  Copy,
  Share2,
  Github,
  ArrowUp,
  ArrowDown,
  History,
  Zap,
  File as FileIcon,
  Users,
} from "lucide-react";
import { toast } from "../../components/toast";
import { Modal } from "../../components/modal";
import { Tooltip } from "../../components/tooltip";
import { socket } from "../../utils/throw-socket";
import randomstring from "randomstring";
import {
  Button,
  Input,
  Card,
  CardBody,
  CardHeader,
  Text,
  Link,
} from "../../components";
import { useSpring, config } from "react-spring";
import styled from "styled-components";
import JSZip from "jszip";
import ThrowFileUpload from "../../utils/throw-file-upload";

// BACKEND_URL and socket connection are now managed in throw-socket.ts.
// The singleton `socket` is imported above.

// Get frontend URL from environment variables
const FRONTEND_URL =
  (typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_FRONTEND_URL) ||
  (typeof window !== "undefined" &&
    (window as any).ENV &&
    (window as any).ENV.REACT_APP_FRONTEND_URL) ||
  "http://localhost:3000";


interface FeaturePopupProps {
  visible: boolean;
  onClose: () => void;
}

// Feature announcement popup
const FeaturePopup = ({ visible, onClose }: FeaturePopupProps) => {
  return (
    <Modal visible={visible} onClose={onClose} width={560}>
      <div
        style={{
          background: "linear-gradient(135deg, #1e1e32 0%, #2d1b4e 100%)",
          padding: "32px",
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
            background: "rgba(124, 58, 237, 0.2)",
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
            background: "rgba(124, 58, 237, 0.1)",
            borderRadius: "50%",
            zIndex: 0,
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <h3
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              color: "#7C3AED",
              margin: 0,
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Zap size={18} />
            New Feature Alert!
          </h3>

          <Text
            color="#E2E8F0"
            bold
            style={{ display: "block", fontSize: "18px", marginBottom: "16px" }}
          >
            Multiple File Transfers
          </Text>

          <Text
            color="#A78BFA"
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

interface FileHistory {
  id: string;
  name: string;
  size: number;
  type: string;
  sentAt?: Date;
  receivedAt?: Date;
  channel: string;
  compressed: boolean;
  type_info?: "sent" | "received";
}

interface HistoryModalProps {
  visible: boolean;
  onClose: () => void;
  sentFilesHistory: FileHistory[];
  receivedFilesHistory: FileHistory[];
  onClearHistory: () => void;
  formatFileSize: (bytes: number) => string;
  formatTime: (date: Date) => string;
  trimFileName: (fileName: string, maxLength?: number) => string;
}

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
}: HistoryModalProps) => {
  const [activeTab, setActiveTab] = useState("all");

  const getAllFiles = () => {
    const allFiles = [
      ...sentFilesHistory.map((file) => ({
        ...file,
        type_info: "sent" as const,
      })),
      ...receivedFilesHistory.map((file) => ({
        ...file,
        type_info: "received" as const,
      })),
    ].sort((a, b) => {
      const dateA = new Date(a.sentAt || a.receivedAt!).getTime();
      const dateB = new Date(b.sentAt || b.receivedAt!).getTime();
      return dateB - dateA;
    });

    return allFiles;
  };

  const getFilteredFiles = () => {
    switch (activeTab) {
      case "sent":
        return sentFilesHistory.map((file) => ({
          ...file,
          type_info: "sent" as const,
        }));
      case "received":
        return receivedFilesHistory.map((file) => ({
          ...file,
          type_info: "received" as const,
        }));
      default:
        return getAllFiles();
    }
  };

  const renderHistoryContent = () => {
    const files = getFilteredFiles();

    if (files.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "48px 20px" }}>
          <FileIcon
            size={36}
            style={{
              color: "rgba(255,255,255,0.18)",
              marginBottom: "14px",
              display: "block",
            }}
          />
          <Text color="textDisabled" style={{ fontSize: "15px" }}>
            No files {activeTab === "all" ? "transferred" : activeTab} yet in
            this session
          </Text>
          <br />
          <Text
            color="textDisabled"
            style={{ fontSize: "13px", marginTop: "8px", opacity: 0.6 }}
          >
            Your {activeTab === "all" ? "file transfers" : `${activeTab} files`}{" "}
            will appear here temporarily until page refresh
          </Text>
        </div>
      );
    }

    return (
      <div style={{ maxHeight: "400px", overflowY: "auto" }}>
        {files.map((file, index) => (
          <div
            key={file.id}
            style={{
              borderBottom:
                index < files.length - 1
                  ? "1px solid rgba(255,255,255,0.06)"
                  : "none",
              padding: "8px 0",
            }}
          >
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
                  color: "#E2E8F0",
                }}
              >
                <span
                  style={{
                    color: file.type_info === "sent" ? "#22C55E" : "#3B82F6",
                    fontSize: "12px",
                  }}
                >
                  {file.type_info === "sent" ? (
                    <ArrowUp size={11} />
                  ) : (
                    <ArrowDown size={11} />
                  )}
                </span>{" "}
                {file.name}{" "}
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
                  style={{ fontSize: "12px", color: "#94A3B8" }}
                >
                  {formatTime(new Date(file.sentAt || file.receivedAt!))}
                </Text>
                <Text
                  small
                  style={{
                    fontSize: "10px",
                    color: file.type_info === "sent" ? "#22C55E" : "#3B82F6",
                    fontWeight: "700",
                  }}
                >
                  {file.type_info === "sent" ? "SENT" : "RECEIVED"}
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
                {formatFileSize(file.size)}
              </Text>
              <Text small color="textSubtle">
                {file.channel}
              </Text>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const totalFiles = sentFilesHistory.length + receivedFilesHistory.length;

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <History size={16} color="#7C3AED" />
          <span>File Transfer History ({totalFiles})</span>
        </div>
      }
      visible={visible}
      onClose={onClose}
      width={700}
      footer={
        totalFiles > 0 ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <Button variant="danger" onClick={onClearHistory}>
              Clear All History
            </Button>
            <Button variant="primary" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        )
      }
    >
      {/* Tab buttons */}
      <div
        style={{
          marginBottom: "16px",
          display: "flex",
          gap: "4px",
          padding: "4px",
          background: "rgba(255,255,255,0.04)",
          borderRadius: "10px",
        }}
      >
        {[
          { key: "all", label: "All", count: totalFiles },
          { key: "sent", label: "Sent", count: sentFilesHistory.length },
          {
            key: "received",
            label: "Received",
            count: receivedFilesHistory.length,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1,
              padding: "7px 12px",
              border: "none",
              background:
                activeTab === tab.key
                  ? "rgba(124, 58, 237, 0.85)"
                  : "transparent",
              color: activeTab === tab.key ? "white" : "rgba(255,255,255,0.45)",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: activeTab === tab.key ? "600" : "400",
              borderRadius: "7px",
              transition: "all 0.2s ease",
              fontFamily: "'Space Grotesk', sans-serif",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            {tab.label}
            <span
              style={{
                background:
                  activeTab === tab.key
                    ? "rgba(255,255,255,0.22)"
                    : "rgba(255,255,255,0.07)",
                padding: "1px 7px",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: "600",
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {renderHistoryContent()}
    </Modal>
  );
};

interface TransferredFile {
  id: string;
  name: string;
  size: number;
  type: string;
  compressed: boolean;
  receiving?: boolean;
}

export const Home = memo(() => {
  // Use a ref to hold the instance to persist it across renders
  const instanceRef = useRef<ThrowFileUpload | null>(null);

  if (!instanceRef.current) {
    instanceRef.current = new ThrowFileUpload(socket);
  }

  const instance = instanceRef.current;

  const [channel, setChannel] = useState("");
  const [currentChannel, setCurrentChannel] = useState<string | null>(null);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [throwing, setThrowing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [flip, set] = useState(false);
  const [progress, setProgress] = useState<Record<string, string>>({});
  const [size, setSize] = useState<
    Record<string, { received: number; original: number }>
  >({});
  const [filesBeingTransferred, setFilesBeingTransferred] = useState<
    TransferredFile[]
  >([]);
  const [compressFiles, setCompressFiles] = useState(true);
  const [showFeaturePopup, setShowFeaturePopup] = useState(false);
  const [sentFilesHistory, setSentFilesHistory] = useState<FileHistory[]>([]);
  const [receivedFilesHistory, setReceivedFilesHistory] = useState<
    FileHistory[]
  >([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [sizeLimit] = useState("5GB");

  const buffersRef = useRef<
    Record<
      string,
      {
        chunks: ArrayBuffer[];
        bytesReceived: number;
        fileInfo: {
          name: string;
          type: string;
          size: number;
          compressed: boolean;
        };
      }
    >
  >({});
  const uploadingRef = useRef(false);

  const chunkPicker = (fileSize: number) => {
    const MB = 1024 * 1024;
    if (fileSize < MB) return 64 * 1024; // 64KB for files < 1MB
    if (fileSize < 10 * MB) return 256 * 1024; // 256KB for files < 10MB
    if (fileSize < 100 * MB) return MB; // 1MB for files < 100MB
    if (fileSize < 500 * MB) return 4 * MB; // 4MB for files < 500MB
    return 16 * MB; // 16MB for larger files
  };

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

  const generateChannel = () => {
    const newChannel = randomstring.generate({
      length: 6,
      charset: "alphanumeric",
      capitalization: "uppercase",
    });

    setChannel(newChannel);
  };

  useEffect(() => {
    generateChannel();
    // get query "channel" and set to state if exists
    const urlParams = new URLSearchParams(window.location.search);
    const channelQuery = urlParams.get("channel");
    if (channelQuery) {
      setChannel(channelQuery);
      setCurrentChannel(channelQuery);
    }
  }, []);

  useEffect(() => {
    const fileInput = document.getElementById("file_input");
    if (fileInput) {
      instance.listenOnInput(fileInput);
    }

    instance.maxFileSize = calculateSize(sizeLimit);

    const progressHandler = (p: {
      bytesLoaded: number;
      file: { id: string; size: number };
    }) => {
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
    };
    instance.addEventListener("progress", progressHandler);

    const completeHandler = function (event: {
      file: {
        id: string;
        name: string;
        size: number;
        type: string;
        meta?: { compressed?: boolean };
      };
    }) {
      uploadingRef.current = false;
      addToast(
        "Upload File",
        `${event.file.name} uploaded successfully`,
        "success",
      );

      // Add to sent files history
      const sentFile: FileHistory = {
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
        prev.filter((file) => file.id !== event.file.id),
      );

      if (Object.keys(progress).length === 0) {
        setThrowing(false);
      }
      if (fileRef.current) fileRef.current.value = "";
    };
    instance.addEventListener("complete", completeHandler);

    const startHandler = function (event: {
      file: {
        id: string;
        name: string;
        size: number;
        type: string;
        meta: {
          channel: string;
          type: string;
          size: number;
          id: string;
          compressed: boolean;
        };
      };
    }) {
      addToast("Please wait!", `Throwing file ${event.file.name}...`, "info");
      uploadingRef.current = true;
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
    };
    instance.addEventListener("start", startHandler);

    const errorHandler = function (data: { code: number }) {
      uploadingRef.current = false;
      if (data.code === 1) {
        addToast("Oops!", "File size exceed.", "danger");
        setProgress({});
        setThrowing(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    };
    instance.addEventListener("error", errorHandler);

    if (channel) {
      handleConnectChannel();
    }

    if (channel) {
      window.history.pushState({}, "", `/?channel=${channel}`);
    }

    return () => {
      // Clean up event listeners to avoid duplicates on channel change
      instance.removeEventListener("progress", progressHandler);
      instance.removeEventListener("complete", completeHandler);
      instance.removeEventListener("start", startHandler);
      instance.removeEventListener("error", errorHandler);
    };
  }, [channel]);

  useEffect(() => {
    const handleFileChunk = (data: {
      id: string;
      name: string;
      type: string;
      size: number;
      compressed: boolean;
      file: ArrayBuffer;
    }) => {
      const fileId = data.id;
      if (!buffersRef.current[fileId]) {
        // Initialize buffer for this file
        buffersRef.current[fileId] = {
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
      const buffer = buffersRef.current[fileId];
      if (buffer) {
        // Add chunk to buffer
        buffer.chunks.push(data.file);
        buffer.bytesReceived += data.file.byteLength;

        // Calculate percentage
        const percentage = ((buffer.bytesReceived / data.size) * 100).toFixed(
          2,
        );

        // Update progress
        setProgress((prev) => ({
          ...prev,
          [fileId]: percentage,
        }));

        // Update size tracking
        setSize((prev) => ({
          ...prev,
          [fileId]: {
            received: buffer.bytesReceived,
            original: data.size,
          },
        }));

        setThrowing(true);
      }
    };

    socket.on(channel, handleFileChunk);

    const handleDone = async (data: {
      file_id: string;
      file_name: string;
      type: string;
    }) => {
      const fileId = data.file_id;
      const fileData = buffersRef.current[fileId];

      if (fileData) {
        console.log("## ", {
          compressed: fileData.fileInfo.compressed,
          chunks: fileData.chunks,
          fileInfo: fileData.fileInfo,
        });

        addToast(
          "Great!",
          `You received the file: ${data.file_name}`,
          "success",
        );

        // Add to received files history
        const receivedFile: FileHistory = {
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

        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(200);
        }

        // Clean up
        delete buffersRef.current[fileId];

        setProgress((prev) => {
          const updated = { ...prev };
          delete updated[fileId];
          return updated;
        });

        setFilesBeingTransferred((prev) =>
          prev.filter((file) => file.id !== fileId),
        );

        if (Object.keys(progress).length === 0) {
          setThrowing(false);
        }
      }
    };

    socket.on(`done-${channel}`, handleDone);

    socket.on(`join-${channel}`, () => {
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(200);
      }
      addToast("Great!", "A user connected with the channel.", "info");
    });

    socket.on(`receiving-${channel}`, (data: { name: string }) => {
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(200);
      }
      addToast("Please Wait", `Receiving file: ${data.name}...`, "info");
    });

    socket.on(`channel-join-${channel}`, (data: string) => {
      addToast("Great!", data, "success");
    });

    socket.on(`connections-${channel}`, (count: number) => {
      setConnectedUsers(count);
    });

    const handlePaste = (evt: ClipboardEvent) => {
      const dT = evt.clipboardData;
      const files = dT?.files;
      if (!files || files.length === 0) return;

      if (uploadingRef.current)
        return addToast(
          "Oops!",
          "Your files are currently uploading.",
          "danger",
        );

      handleFiles(Array.from(files));
    };

    document.addEventListener("paste", handlePaste);

    return () => {
      socket.off(channel, handleFileChunk);
      socket.off(`done-${channel}`, handleDone);
      socket.off(`join-${channel}`);
      socket.off(`receiving-${channel}`);
      socket.off(`channel-join-${channel}`);
      socket.off(`connections-${channel}`);
      document.removeEventListener("paste", handlePaste);
    };
  }, [channel]);

  function calculateSize(fileSize: string) {
    let sizeValue = parseFloat(fileSize);
    let unit = fileSize.replace(sizeValue.toString(), "").trim().toLowerCase();

    switch (unit) {
      case "gb":
        return sizeValue * 1024 * 1024 * 1024;
      case "mb":
        return sizeValue * 1024 * 1024;
      case "kb":
        return sizeValue * 1024;
      case "b":
        return sizeValue;
      default:
        return 0;
    }
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
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

  const addToast = (title: string, description: string, variant: string) => {
    const content = (
      <span>
        <strong>{title}</strong>: {description}
      </span>
    );
    switch (variant) {
      case "success":
        toast.success(content);
        break;
      case "danger":
        toast.error(content);
        break;
      case "info":
        toast.info(content);
        break;
      case "warning":
        toast.warning(content);
        break;
      default:
        toast.info(content);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(channel).then(() => {
      addToast("Copied!", "Channel copied to clipboard.", "success");
    });
  };

  const shareChannel = () => {
    const url = `${FRONTEND_URL}/?channel=${channel}`;
    navigator.clipboard.writeText(url).then(() => {
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
        "danger",
      );
    }
  };

  const handleFiles = async (fileList: File[]) => {
    if (compressFiles && fileList.length > 1) {
      try {
        addToast(
          "Compressing",
          `Compressing ${fileList.length} files...`,
          "info",
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
          { type: "application/zip" },
        );

        // Add metadata to the file directly to avoid reference issues
        interface CustomFile extends File {
          meta?: {
            compressed: boolean;
            channel: string;
          };
        }

        const customZipFile: CustomFile = new File([zipFile], zipFile.name, {
          type: zipFile.type,
          lastModified: zipFile.lastModified,
        }) as CustomFile;

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

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleSendClick = () => {
    if (fileRef.current) fileRef.current.click();
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Convert FileList to Array before passing to handleFiles
    const filesArray = Array.from(files);
    handleFiles(filesArray);
  };

  const renderFileTransferList = () => {
    if (filesBeingTransferred.length === 0) return null;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {filesBeingTransferred.map((file) => (
          <div
            key={file.id}
            style={{
              padding: "12px 14px",
              background: "rgba(124, 58, 237, 0.07)",
              border: "1px solid rgba(124, 58, 237, 0.18)",
              borderRadius: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <Text style={{ fontSize: "13px", color: "#E2E8F0" }}>
                {file.name}
                {file.compressed && (
                  <span
                    style={{
                      color: "#A78BFA",
                      fontSize: "11px",
                      marginLeft: "6px",
                    }}
                  >
                    (Compressed)
                  </span>
                )}
              </Text>
              <Text
                small
                style={{
                  fontSize: "11px",
                  color: file.receiving ? "#3B82F6" : "#22C55E",
                  fontWeight: "600",
                }}
              >
                {file.receiving ? "Receiving" : "Sending"}
              </Text>
            </div>
            {progress[file.id] && (
              <div style={{ width: "100%" }}>
                <div
                  style={{
                    height: "3px",
                    background: "rgba(255, 255, 255, 0.08)",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${progress[file.id]}%`,
                      height: "100%",
                      background:
                        "linear-gradient(90deg, #7C3AED 0%, #F43F5E 100%)",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "5px",
                  }}
                >
                  <Text small style={{ fontSize: "11px", color: "#A78BFA" }}>
                    {progress[file.id]}%
                  </Text>
                  {size[file.id] && (
                    <Text small style={{ fontSize: "11px", color: "#94A3B8" }}>
                      {((size[file.id].received || 0) / 1048576).toFixed(2)} /{" "}
                      {((size[file.id].original || 0) / 1048576).toFixed(2)} MB
                    </Text>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Helper function to format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Helper function to trim long file names
  const trimFileName = (fileName: string, maxLength = 20) => {
    if (fileName.length <= maxLength) return fileName;

    const extension = fileName.split(".").pop() || "";
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf("."));

    if (nameWithoutExt.length <= maxLength - extension.length - 4) {
      return fileName;
    }

    const trimmedName = nameWithoutExt.substring(
      0,
      Math.max(5, maxLength - extension.length - 4),
    );
    return `${trimmedName}....${nameWithoutExt.slice(-3)}.${extension}`;
  };

  // Render sent and received files history (inline version - shows recent 3 files)
  const renderFileHistory = () => {
    const allFiles = [
      ...sentFilesHistory.map((file) => ({
        ...file,
        type_info: "sent" as const,
      })),
      ...receivedFilesHistory.map((file) => ({
        ...file,
        type_info: "received" as const,
      })),
    ].sort((a, b) => {
      const dateA = new Date(a.sentAt || a.receivedAt!).getTime();
      const dateB = new Date(b.sentAt || b.receivedAt!).getTime();
      return dateB - dateA;
    });

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
        {recentFiles.map((file, index) => (
          <div
            key={file.id || index}
            style={{
              padding: "10px 14px",
              border: "1px solid rgba(255, 255, 255, 0.07)",
              borderRadius: "10px",
              marginBottom: index < recentFiles.length - 1 ? "6px" : "0",
              background: "rgba(255, 255, 255, 0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "4px",
              }}
            >
              <Text
                strong
                style={{
                  color: "#E2E8F0",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    color: file.type_info === "sent" ? "#22C55E" : "#3B82F6",
                    fontSize: "11px",
                  }}
                >
                  {file.type_info === "sent" ? (
                    <ArrowUp size={11} />
                  ) : (
                    <ArrowDown size={11} />
                  )}
                </span>
                <span title={file.name}>{trimFileName(file.name)}</span>
                {file.compressed && (
                  <span style={{ color: "#A78BFA", fontSize: "11px" }}>
                    (Compressed)
                  </span>
                )}
              </Text>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  flexShrink: 0,
                  marginLeft: "8px",
                }}
              >
                <Text small style={{ fontSize: "11px", color: "#94A3B8" }}>
                  {formatTime(new Date(file.sentAt || file.receivedAt!))}
                </Text>
                <Text
                  small
                  style={{
                    fontSize: "9px",
                    color: file.type_info === "sent" ? "#22C55E" : "#3B82F6",
                    fontWeight: "700",
                    letterSpacing: "0.4px",
                  }}
                >
                  {file.type_info === "sent" ? "SENT" : "RECEIVED"}
                </Text>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                opacity: 0.5,
              }}
            >
              <Text small style={{ fontSize: "11px", color: "#94A3B8" }}>
                {formatFileSize(file.size)}
              </Text>
              <Text small style={{ fontSize: "11px", color: "#94A3B8" }}>
                {file.channel}
              </Text>
            </div>
          </div>
        ))}
        {allFiles.length > 3 && (
          <div
            style={{
              textAlign: "center",
              padding: "8px 12px",
              background: "rgba(255, 255, 255, 0.03)",
              borderRadius: "8px",
              marginTop: "6px",
              border: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <Text small style={{ color: "#94A3B8" }}>
              {allFiles.length - 3} more files.{" "}
              <Button
                variant="text"
                scale="sm"
                onClick={() => setShowHistoryModal(true)}
                style={{
                  padding: "0 4px",
                  color: "#A78BFA",
                  background: "transparent",
                  fontWeight: "600",
                  height: "auto",
                }}
              >
                See All
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
      />

      <div
        style={{ display: "flex", justifyContent: "center", margin: "20px" }}
      >
        <div>
          {/* <ToastContainer toasts={toasts} onRemove={handleRemoveToast} /> */}
          <Card style={{ marginTop: "20px", maxWidth: "600px" }}>
            <CardHeader style={{ borderBottom: "none", paddingBottom: 0 }}>
              <h1
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  color: "#E2E8F0",
                  margin: 0,
                  marginBottom: 0,
                  fontWeight: 800,
                  letterSpacing: "-1.5px",
                  fontSize: "36px",
                }}
              >
                Instant P2P Transfer
              </h1>
              <Text
                style={{
                  opacity: 0.7,
                  fontSize: "18px",
                  display: "block",
                  marginTop: "8px",
                }}
              >
                Securely move files across the globe, instantly.
              </Text>
            </CardHeader>
            <CardBody>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    padding: "32px",
                    borderRadius: "24px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "-20px",
                      right: "-20px",
                      width: "100px",
                      height: "100px",
                      background:
                        "radial-gradient(circle, rgba(244, 63, 94, 0.1) 0%, transparent 70%)",
                      borderRadius: "50%",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <Text
                      bold
                      style={{
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "2px",
                        opacity: 0.5,
                      }}
                    >
                      Active Channel
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                      }}
                    >
                      <div title="Copy to clipboard">
                        <Copy
                          size={20}
                          style={{
                            cursor: "pointer",
                            color: "#7C3AED",
                          }}
                          onClick={copyToClipboard}
                        />
                      </div>
                      <div title="Share link">
                        <Share2
                          size={20}
                          style={{
                            cursor: "pointer",
                            color: "#F43F5E",
                          }}
                          onClick={shareChannel}
                        />
                      </div>
                    </div>
                  </div>
                  <h1
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      color: "#F43F5E",
                      margin: 0,
                      fontSize: "48px",
                      fontWeight: 700,
                    }}
                  >
                    {channel}
                  </h1>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto",
                    gap: "12px",
                    alignItems: "end",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <Text
                      small
                      bold
                      style={{
                        opacity: 0.5,
                        marginLeft: "4px",
                      }}
                    >
                      JOIN CHANNEL
                    </Text>
                    <Input
                      onChange={handleChange}
                      placeholder="Enter 6-digit code"
                      value={channel}
                      style={{ height: "48px" }}
                    />
                  </div>
                  <Tooltip title="Generate new random code">
                    <Button
                      onClick={generateChannel}
                      size="large"
                      variant="secondary"
                      style={{
                        height: "48px",
                        width: "48px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                      }}
                    >
                      <RefreshCw size={16} />
                    </Button>
                  </Tooltip>
                  <Button
                    onClick={handleConnectChannel}
                    size="large"
                    variant="primary"
                    style={{ height: "48px", padding: "0 24px" }}
                  >
                    JOIN
                  </Button>
                </div>

                <input
                  type="file"
                  ref={fileRef}
                  id="file_input"
                  multiple
                  hidden
                  onChange={handleFileInputChange}
                />

                {renderFileTransferList()}

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "100%",
                    padding: "20px 0",
                  }}
                >
                  {throwing && (
                    <div className="dots" style={{ height: "60px" }}>
                      <div></div>
                      <div></div>
                      <div></div>
                    </div>
                  )}
                  {!throwing && (
                    <div style={{ textAlign: "center" }}>
                      <Button
                        variant="primary"
                        size="large"
                        loading={throwing}
                        onClick={handleSendClick}
                        style={{
                          height: "64px",
                          fontSize: "18px",
                          padding: "0 48px",
                          borderRadius: "32px",
                          marginBottom: "12px",
                        }}
                      >
                        SEND FILES
                      </Button>
                      <br />
                      <Text style={{ opacity: 0.6, fontSize: "14px" }}>
                        Or simply{" "}
                        <Text bold style={{ color: "#F43F5E" }}>
                          paste
                        </Text>{" "}
                        from your clipboard
                      </Text>
                    </div>
                  )}
                </div>

                {/* File History Section */}
                <div
                  style={{
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    borderRadius: "20px",
                    padding: "20px",
                    background: "rgba(255, 255, 255, 0.02)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: showHistory ? "16px" : "0",
                    }}
                  >
                    <div>
                      <Text
                        style={{
                          fontWeight: "700",
                          fontSize: "16px",
                          color: "#E2E8F0",
                        }}
                      >
                        File History
                      </Text>
                      <br />
                      <Text
                        small
                        style={{
                          fontSize: "12px",
                          opacity: 0.5,
                        }}
                      >
                        {sentFilesHistory.length} sent •{" "}
                        {receivedFilesHistory.length} received
                      </Text>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {sentFilesHistory.length + receivedFilesHistory.length >
                        0 && (
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() => setShowHistory(!showHistory)}
                        >
                          {showHistory ? "Hide" : "Recent"}
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="primary"
                        onClick={() => setShowHistoryModal(true)}
                        style={{ padding: "0 16px" }}
                        disabled={
                          sentFilesHistory.length +
                            receivedFilesHistory.length ===
                          0
                        }
                      >
                        Full History
                      </Button>
                    </div>
                  </div>

                  {showHistory && (
                    <div
                      style={{
                        maxHeight: "200px",
                        overflowY: "auto",
                        marginTop: "12px",
                      }}
                    >
                      {renderFileHistory()}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    textAlign: "center",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    paddingTop: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      marginBottom: "10px",
                    }}
                  >
                    <Users size={12} color="rgba(255,255,255,0.28)" />
                    <Text
                      small
                      style={{
                        color: "rgba(255,255,255,0.38)",
                        fontSize: "12px",
                      }}
                    >
                      {connectedUsers} {connectedUsers === 1 ? "user" : "users"}{" "}
                      online in this channel
                    </Text>
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.26)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span>
                      throwmyfile.com &copy; {new Date().getFullYear()}
                    </span>
                    <a
                      href="/privacy-policy"
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      Privacy
                    </a>
                    <a
                      href="https://github.com/jamg26/throw-files"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "inherit",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      title="View Source on GitHub"
                    >
                      <Github size={12} />
                    </a>
                  </div>
                  <Tooltip title="Rest easy! Your files travel securely, moving straight from your device to the recipient. We don't store any data on our servers.">
                    <div style={{ marginTop: "12px" }}>
                      <Link
                        style={{
                          fontSize: "11px",
                          color: "rgba(124, 58, 237, 0.6)",
                        }}
                      >
                        Curious about your file's journey?
                      </Link>
                    </div>
                  </Tooltip>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </HomeComponent>
  );
});

const HomeComponent = styled.div`
  min-height: 100vh;
  padding-top: 64px;
`;
