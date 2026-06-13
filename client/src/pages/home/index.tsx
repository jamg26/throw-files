import {
  memo,
  useEffect,
  useRef,
  useState,
  ChangeEvent,
  useCallback,
  useMemo,
} from "react";
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
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Link2,
  Sparkles,
  Globe,
  Shield,
} from "lucide-react";
import { Modal } from "../../components/modal";
import { Tooltip } from "../../components/tooltip";
import { socket } from "../../utils/throw-socket";
import randomstring from "randomstring";
import { Button, Input, CardBody, Text } from "../../components";
import {
  useSpring,
  config,
  useSpringRef,
  animated,
  useTrail,
} from "react-spring";
import styled, { css, keyframes, createGlobalStyle } from "styled-components";
import JSZip from "jszip";
import ThrowFileUpload from "../../utils/throw-file-upload";

const FRONTEND_URL =
  (typeof window !== "undefined" &&
    (window as any).ENV &&
    (window as any).ENV.REACT_APP_FRONTEND_URL) ||
  "http://localhost:3000";

const URL_CLEANUP_DELAY = 10000; // 10 seconds
const TRANSFER_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Enhanced Keyframes
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeInScale = keyframes`
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
`;

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 30px var(--accent-glow), 0 0 60px var(--accent-glow); }
  50% { box-shadow: 0 0 50px var(--accent-glow-strong), 0 0 100px var(--accent-glow); }
`;

const glowPulse = keyframes`
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-8px) rotate(2deg); }
  75% { transform: translateY(4px) rotate(-1deg); }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const bounce = keyframes`
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
`;

const slideInRight = keyframes`
  from { opacity: 0; transform: translateX(100px); }
  to { opacity: 1; transform: translateX(0); }
`;

const slideInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
`;

const borderGlow = keyframes`
  0%, 100% { border-color: var(--accent-glow); }
  50% { border-color: var(--accent-glow-strong); }
`;

const GlobalStyle = createGlobalStyle`
  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
    40% { transform: scale(1); opacity: 1; }
  }
  
  @keyframes particleFloat {
    0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
    10% { opacity: 0.8; }
    90% { opacity: 0.8; }
    100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
  }
`;

interface ToastData {
  id: string;
  title: string;
  description: string;
  type: "success" | "error" | "info" | "warning";
}

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

const PARTICLES_COLORS = [
  "#ED4B9E",
  "#F472B6",
  "#FB7185",
  "#34D399",
  "#38BDF8",
  "#FBBF24",
] as const;

// Generate particle data once at module load time to prevent recreation on every render
const PARTICLES_DATA = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 20}s`,
  duration: `${15 + Math.random() * 20}s`,
  color: PARTICLES_COLORS[Math.floor(Math.random() * PARTICLES_COLORS.length)],
  size: 2 + Math.random() * 4,
}));

const Particles = memo(
  () => {
    return (
      <ParticlesContainer>
        {PARTICLES_DATA.map((p) => (
          <Particle
            key={p.id}
            aria-hidden="true"
            style={{
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
              background: p.color,
              width: `${p.size}px`,
              height: `${p.size}px`,
            }}
          />
        ))}
      </ParticlesContainer>
    );
  },
  () => true,
); // Static component, never re-renders

const ToastIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "success":
      return <CheckCircle size={18} />;
    case "error":
      return <AlertCircle size={18} />;
    case "warning":
      return <AlertCircle size={18} />;
    default:
      return <Info size={18} />;
  }
};

const Toast = ({
  toast,
  onRemove,
}: {
  toast: ToastData;
  onRemove: (id: string) => void;
}) => {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const duration = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => onRemove(toast.id), 400);
    }, 5000);
    return () => clearTimeout(duration);
  }, [toast.id, onRemove]);

  const getTypeStyles = () => {
    switch (toast.type) {
      case "success":
        return {
          bg: "var(--success-glow)",
          border: "rgba(52, 211, 153, 0.3)",
          color: "var(--success)",
          iconBg: "rgba(52, 211, 153, 0.15)",
        };
      case "error":
        return {
          bg: "rgba(248, 113, 113, 0.12)",
          border: "rgba(248, 113, 113, 0.3)",
          color: "var(--danger)",
          iconBg: "rgba(248, 113, 113, 0.15)",
        };
      case "warning":
        return {
          bg: "rgba(251, 191, 36, 0.12)",
          border: "rgba(251, 191, 36, 0.3)",
          color: "var(--warning)",
          iconBg: "rgba(251, 191, 36, 0.15)",
        };
      default:
        return {
          bg: "var(--accent-glow)",
          border: "var(--border-accent)",
          color: "var(--accent-primary)",
          iconBg: "rgba(237, 75, 158, 0.15)",
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <ToastContainer
      $visible={visible}
      $leaving={leaving}
      style={{ background: styles.bg, borderColor: styles.border }}
    >
      <ToastIconWrapper
        style={{ background: styles.iconBg, color: styles.color }}
      >
        <ToastIcon type={toast.type} />
      </ToastIconWrapper>
      <ToastContent>
        <ToastTitle>{toast.title}</ToastTitle>
        <ToastDescription>{toast.description}</ToastDescription>
      </ToastContent>
      <ToastClose
        onClick={() => {
          setLeaving(true);
          setTimeout(() => onRemove(toast.id), 400);
        }}
      >
        <X size={14} />
      </ToastClose>
      <ToastProgress style={{ background: styles.color }} />
    </ToastContainer>
  );
};

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
  const [animatedItems, setAnimatedItems] = useState<Set<string>>(new Set());

  const getAllFiles = useCallback(() => {
    const fallbackTimestamp = Date.now();
    const allFiles = [
      ...sentFilesHistory.map((file) => ({
        ...file,
        type_info: "sent" as const,
      })),
      ...receivedFilesHistory.map((file) => ({
        ...file,
        type_info: "received" as const,
      })),
    ].sort(
      (a, b) =>
        new Date(b.sentAt || b.receivedAt || fallbackTimestamp).getTime() -
        new Date(a.sentAt || a.receivedAt || fallbackTimestamp).getTime(),
    );
    return allFiles;
  }, [sentFilesHistory, receivedFilesHistory]);

  const getFilteredFiles = useCallback(() => {
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
  }, [activeTab, sentFilesHistory, receivedFilesHistory, getAllFiles]);

  useEffect(() => {
    if (visible) {
      const files = getFilteredFiles();
      const timer = setTimeout(() => {
        const timeouts: number[] = [];
        files.forEach((file, i) => {
          const timeout = setTimeout(() => {
            setAnimatedItems((prev) => new Set([...prev, file.id]));
          }, i * 70) as unknown as number;
          timeouts.push(timeout);
        });
        return () => timeouts.forEach(clearTimeout);
      }, 150) as unknown as number;
      return () => clearTimeout(timer);
    } else {
      setAnimatedItems(new Set());
    }
  }, [visible, activeTab, getFilteredFiles]);

  const renderHistoryContent = () => {
    const files = getFilteredFiles();
    if (files.length === 0) {
      return (
        <EmptyState>
          <EmptyIconWrapper>
            <FileIcon size={32} />
          </EmptyIconWrapper>
          <EmptyTitle>No transfers yet</EmptyTitle>
          <EmptySubtitle>Your file transfers will appear here</EmptySubtitle>
        </EmptyState>
      );
    }

    return (
      <HistoryList>
        {files.map((file, index) => (
          <HistoryItem
            key={file.id}
            $visible={animatedItems.has(file.id)}
            $delay={index * 70}
          >
            <HistoryItemLeft>
              <StatusBadge $type={file.type_info}>
                {file.type_info === "sent" ? (
                  <ArrowUp size={11} />
                ) : (
                  <ArrowDown size={11} />
                )}
              </StatusBadge>
              <FileNameWrapper>
                <FileNameText title={file.name}>
                  {trimFileName(file.name, 30)}
                </FileNameText>
                {file.compressed && <ZipBadge>ZIP</ZipBadge>}
              </FileNameWrapper>
            </HistoryItemLeft>
            <HistoryItemRight>
              <MetaText>
                {formatTime(
                  new Date(file.sentAt || file.receivedAt || new Date()),
                )}
              </MetaText>
              <TypeBadge $type={file.type_info}>
                {file.type_info === "sent" ? "SENT" : "RECV"}
              </TypeBadge>
            </HistoryItemRight>
            <FileSizeText>{formatFileSize(file.size)}</FileSizeText>
          </HistoryItem>
        ))}
      </HistoryList>
    );
  };

  const totalFiles = sentFilesHistory.length + receivedFilesHistory.length;

  return (
    <Modal
      title={
        <ModalTitle>
          <HistoryWrapper>
            <History size={18} />
          </HistoryWrapper>
          Transfer History
          <CountBadge>{totalFiles}</CountBadge>
        </ModalTitle>
      }
      visible={visible}
      onClose={onClose}
      width={600}
      footer={
        <ModalFooter>
          {totalFiles > 0 && (
            <Button variant="danger" onClick={onClearHistory}>
              Clear All
            </Button>
          )}
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </ModalFooter>
      }
    >
      <TabBar>
        {[
          { key: "all", label: "All", count: totalFiles },
          { key: "sent", label: "Sent", count: sentFilesHistory.length },
          {
            key: "received",
            label: "Received",
            count: receivedFilesHistory.length,
          },
        ].map((tab) => (
          <TabButton
            key={tab.key}
            $active={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <TabCount $active={activeTab === tab.key}>{tab.count}</TabCount>
          </TabButton>
        ))}
      </TabBar>
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
  const instanceRef = useRef<ThrowFileUpload | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  if (!instanceRef.current) {
    instanceRef.current = new ThrowFileUpload(socket);
  }

  const instance = instanceRef.current!;

  const [channel, setChannel] = useState("");
  const [currentChannel, setCurrentChannel] = useState<string | null>(null);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [throwing, setThrowing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<Record<string, string>>({});
  const [size, setSize] = useState<
    Record<string, { received: number; original: number }>
  >({});
  const [filesBeingTransferred, setFilesBeingTransferred] = useState<
    TransferredFile[]
  >([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isChannelFocused, setIsChannelFocused] = useState(false);
  const [sentFilesHistory, setSentFilesHistory] = useState<FileHistory[]>([]);
  const [receivedFilesHistory, setReceivedFilesHistory] = useState<
    FileHistory[]
  >([]);

  const [sizeLimit] = useState("5GB");

  const buffersRef = useRef<
    Record<
      string,
      {
        chunks: Blob[];
        bytesReceived: number;
        fileInfo: {
          name: string;
          type: string;
          size: number;
          compressed: boolean;
        };
        startTime: number;
        timeoutId?: ReturnType<typeof setTimeout>;
      }
    >
  >({});
  const uploadingRef = useRef(false);
  const urlCleanupRef = useRef<Record<string, number>>({});

  const addToast = useCallback(
    (title: string, description: string, variant: string) => {
      const id =
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      setToasts((prev) => [
        ...prev,
        { id, title, description, type: variant as any },
      ]);
    },
    [],
  );

  const chunkPicker = (fileSize: number) => {
    const KB = 1024;
    const MB = 1024 * 1024;
    if (fileSize < 256 * KB) return 32 * KB;
    if (fileSize < MB) return 64 * KB;
    if (fileSize < 5 * MB) return 128 * KB;
    if (fileSize < 10 * MB) return 256 * KB;
    if (fileSize < 50 * MB) return 512 * KB;
    if (fileSize < 100 * MB) return 1024 * KB;
    return 2048 * KB;
  };

  const handleConnectChannel = useCallback(() => {
    if (!channel) return addToast("Error", "Enter a channel code", "danger");
    if (!/^[A-Z0-9]{1,6}$/.test(channel)) {
      return addToast(
        "Error",
        "Channel code must be 1-6 alphanumeric characters",
        "danger",
      );
    }
    if (currentChannel && currentChannel !== channel) {
      socket.emit("channel-change", {
        previousChannel: currentChannel,
        newChannel: channel,
      });
    } else {
      socket.emit("channel-join", channel);
    }
    setCurrentChannel(channel);
  }, [channel, currentChannel, addToast]);

  const handleConnectChannelRef = useRef(handleConnectChannel);
  handleConnectChannelRef.current = handleConnectChannel;

  const handleFiles = useCallback(
    async (fileList: File[]) => {
      if (fileList.length > 1) {
        try {
          addToast(
            "Compressing",
            `Preparing ${fileList.length} files...`,
            "info",
          );
          const zip = new JSZip();
          for (let i = 0; i < fileList.length; i++) {
            zip.file(fileList[i].name, fileList[i]);
          }
          const zipContent = await zip.generateAsync({ type: "blob" });
          const zipFile = new File([zipContent], `files_${Date.now()}.zip`, {
            type: "application/zip",
          });
          interface CustomFile extends File {
            meta?: { compressed: boolean; channel: string };
          }
          const customZipFile: CustomFile = new File([zipFile], zipFile.name, {
            type: zipFile.type,
            lastModified: zipFile.lastModified,
          }) as CustomFile;
          customZipFile.meta = { compressed: true, channel };
          instance.submitFiles([customZipFile]);
        } catch (error) {
          console.error("Zip compression failed:", error);
          addToast(
            "Error",
            `Failed to compress files: ${error instanceof Error ? error.message : "Unknown error"}`,
            "danger",
          );
          // Clean up file input on error
          if (fileRef.current) fileRef.current.value = "";
        }
      } else {
        instance.submitFiles(fileList);
      }
    },
    [channel, addToast],
  );

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const newChannel = event.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);
    setChannel(newChannel);
  }, []);

  function calculateSize(fileSize: string) {
    if (!fileSize || typeof fileSize !== "string") return 0;

    const trimmed = fileSize.trim().toLowerCase();
    let sizeValue = parseFloat(trimmed);

    if (isNaN(sizeValue)) return 0;

    let unit = trimmed.replace(sizeValue.toString(), "").trim();

    const multipliers: Record<string, number> = {
      tb: 1024 * 1024 * 1024 * 1024,
      gb: 1024 * 1024 * 1024,
      mb: 1024 * 1024,
      kb: 1024,
      b: 1,
      "": 1, // No unit means bytes
    };

    const multiplier = multipliers[unit] || 0;
    return sizeValue * multiplier;
  }

  const springRef = useSpringRef();

  const springConfig = { tension: 80, friction: 12, precision: 0.001 };
  const cardSpring = useSpring({
    ref: springRef,
    opacity: isLoaded ? 1 : 0,
    transform: isLoaded
      ? "translateY(0) scale(1)"
      : "translateY(60px) scale(0.95)",
    config: springConfig,
  });

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const generateChannel = useCallback(() => {
    const newChannel = randomstring.generate({
      length: 6,
      charset: "alphanumeric",
      capitalization: "uppercase",
    });
    setChannel(newChannel);
  }, []);

  useEffect(() => {
    setIsLoaded(true);
    setTimeout(() => springRef.start(), 100);
  }, []);

  useEffect(() => {
    generateChannel();
    const urlParams = new URLSearchParams(window.location.search);
    const channelQuery = urlParams.get("channel");
    if (channelQuery) {
      setChannel(channelQuery);
      setCurrentChannel(channelQuery);
    }
  }, [generateChannel]);

  useEffect(() => {
    const fileInput = document.getElementById("file_input");
    if (fileInput) instance.listenOnInput(fileInput);
    instance.maxFileSize = calculateSize(sizeLimit);

    const progressHandler = (p: {
      bytesLoaded: number;
      file: { id: string; size: number };
    }) => {
      const percentage = ((p.bytesLoaded / p.file.size) * 100).toFixed(2);
      setProgress((prev) => ({ ...prev, [p.file.id]: percentage }));
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
        "Upload Complete",
        `${event.file.name} uploaded successfully`,
        "success",
      );
      const sentFile: FileHistory = {
        id: event.file.id,
        name: event.file.name,
        size: event.file.size,
        type: event.file.type,
        sentAt: new Date(),
        channel,
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
      setThrowing(false);
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
      addToast("Sending", `Throwing ${event.file.name}...`, "info");
      uploadingRef.current = true;
      event.file.meta = {
        channel,
        type: event.file.type,
        size: event.file.size,
        id: event.file.id,
        compressed: event.file.meta.compressed || false,
      };
      instance.chunkSize = chunkPicker(event.file.size);
      setFilesBeingTransferred((prev) => [
        ...prev,
        {
          id: event.file.id,
          name: event.file.name,
          size: event.file.size,
          type: event.file.type,
          compressed: event.file.meta.compressed,
        },
      ]);
    };
    instance.addEventListener("start", startHandler);

    const errorHandler = function (data: { code: number }) {
      uploadingRef.current = false;
      if (data.code === 1) {
        addToast("Error", "File size exceed.", "danger");
        setProgress({});
        setThrowing(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    };
    instance.addEventListener("error", errorHandler);

    if (channel) handleConnectChannelRef.current();
    if (channel) window.history.pushState({}, "", `/?channel=${channel}`);

    return () => {
      instance.removeEventListener("progress", progressHandler);
      instance.removeEventListener("complete", completeHandler);
      instance.removeEventListener("start", startHandler);
      instance.removeEventListener("error", errorHandler);
    };
  }, [channel, sizeLimit, addToast]);

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

      // Validate chunk data
      if (!data.file || data.file.byteLength === 0) {
        console.error("Received empty or invalid chunk for file:", fileId);
        return;
      }

      // Validate file size (prevent DoS attacks)
      const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
      if (data.size > MAX_FILE_SIZE) {
        console.error("File size exceeds limit:", fileId, data.size);
        addToast("Error", "File too large to receive", "danger");
        return;
      }

      // Validate file type (basic validation)
      if (!data.type || data.type.length > 255) {
        console.error("Invalid file type for:", fileId, data.type);
        addToast("Error", "Invalid file type", "danger");
        return;
      }

      if (!buffersRef.current[fileId]) {
        buffersRef.current[fileId] = {
          chunks: [],
          bytesReceived: 0,
          fileInfo: {
            name: data.name,
            type: data.type,
            size: data.size,
            compressed: data.compressed || false,
          },
          startTime: Date.now(),
        };
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

        // Set timeout for incomplete transfers
        const timeoutId = setTimeout(() => {
          if (buffersRef.current[fileId]) {
            console.error(`Transfer timeout for file: ${fileId}`);
            addToast("Error", `File transfer timeout: ${data.name}`, "danger");
            delete buffersRef.current[fileId];
            setFilesBeingTransferred((prev) =>
              prev.filter((file) => file.id !== fileId),
            );
            setProgress((prev) => {
              const updated = { ...prev };
              delete updated[fileId];
              return updated;
            });
          }
        }, TRANSFER_TIMEOUT);

        // Store timeout ID for cleanup
        buffersRef.current[fileId].timeoutId = timeoutId;
      }
      const buffer = buffersRef.current[fileId];
      if (buffer) {
        // Check for size mismatch (corrupted transfer)
        if (buffer.bytesReceived + data.file.byteLength > data.size) {
          console.error("File size exceeded for:", fileId);
          addToast("Error", "File transfer corrupted", "danger");
          delete buffersRef.current[fileId];
          setFilesBeingTransferred((prev) =>
            prev.filter((file) => file.id !== fileId),
          );
          return;
        }

        buffer.chunks.push(new Blob([data.file]));
        buffer.bytesReceived += data.file.byteLength;
        const percentage = ((buffer.bytesReceived / data.size) * 100).toFixed(
          2,
        );
        setProgress((prev) => ({ ...prev, [fileId]: percentage }));
        setSize((prev) => ({
          ...prev,
          [fileId]: { received: buffer.bytesReceived, original: data.size },
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
        try {
          addToast("Received", `File received: ${data.file_name}`, "success");
          const receivedFile: FileHistory = {
            id: fileId,
            name: data.file_name,
            size: fileData.fileInfo.size,
            type: data.type,
            receivedAt: new Date(),
            channel,
            compressed: fileData.fileInfo.compressed || false,
          };
          setReceivedFilesHistory((prev) => [receivedFile, ...prev]);
          const blob = new Blob(fileData.chunks, { type: data.type });
          const objectUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.style.display = "none";
          a.href = objectUrl;
          a.download = data.file_name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          // Clear any existing timeout for this file to prevent race conditions
          const existingTimeout = urlCleanupRef.current[fileId];
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }

          const timeoutId = setTimeout(() => {
            URL.revokeObjectURL(objectUrl);
            delete urlCleanupRef.current[fileId];
          }, URL_CLEANUP_DELAY) as unknown as number;
          urlCleanupRef.current[fileId] = timeoutId;
          if (window.navigator?.vibrate) window.navigator.vibrate(200);

          // Clear transfer timeout
          if (fileData.timeoutId) {
            clearTimeout(fileData.timeoutId);
          }

          delete buffersRef.current[fileId];
          setProgress((prev) => {
            const updated = { ...prev };
            delete updated[fileId];
            return updated;
          });
          setFilesBeingTransferred((prev) =>
            prev.filter((file) => file.id !== fileId),
          );
          setThrowing(false);
        } catch (error) {
          console.error("Failed to process received file:", error);
          addToast("Error", "Failed to process received file", "danger");
          delete buffersRef.current[fileId];
          setFilesBeingTransferred((prev) =>
            prev.filter((file) => file.id !== fileId),
          );
        }
      } else {
        // Clean up URL if file data is missing (transfer failed)
        const existingTimeout = urlCleanupRef.current[fileId];
        if (existingTimeout) {
          clearTimeout(existingTimeout);
          delete urlCleanupRef.current[fileId];
        }
      }
    };

    socket.on(`done-${channel}`, handleDone);
    socket.on(`join-${channel}`, () => {
      if (window.navigator?.vibrate) window.navigator.vibrate(200);
      addToast("Connected", "A user joined the channel", "info");
    });
    socket.on(`receiving-${channel}`, (data: { name: string }) => {
      if (window.navigator?.vibrate) window.navigator.vibrate(200);
      addToast("Receiving", `Incoming: ${data.name}`, "info");
    });
    socket.on(`channel-join-${channel}`, (data: string) =>
      addToast("Success", data, "success"),
    );
    socket.on(`connections-${channel}`, (count: number) =>
      setConnectedUsers(count),
    );

    const handlePaste = (evt: ClipboardEvent) => {
      const files = evt.clipboardData?.files;
      if (!files || files.length === 0) return;
      if (uploadingRef.current)
        return addToast("Busy", "Files are uploading...", "danger");

      // Filter out non-file items (images, text, etc.)
      const validFiles = Array.from(files).filter(
        (file) => file.size > 0 && file.type !== "",
      );
      if (validFiles.length === 0) {
        return addToast(
          "Error",
          "No valid files detected in clipboard",
          "danger",
        );
      }

      handleFiles(validFiles);
    };

    document.addEventListener("paste", handlePaste);
    const handleReconnect = () => handleConnectChannel();
    socket.on("connect", handleReconnect);

    return () => {
      socket.off(channel, handleFileChunk);
      socket.off(`done-${channel}`, handleDone);
      socket.off(`join-${channel}`);
      socket.off(`receiving-${channel}`);
      socket.off(`channel-join-${channel}`);
      socket.off(`connections-${channel}`);
      socket.off("connect", handleReconnect);
      document.removeEventListener("paste", handlePaste);
      Object.values(urlCleanupRef.current).forEach(clearTimeout);
      urlCleanupRef.current = {};
    };
  }, [channel, addToast, handleConnectChannel, handleFiles]);

  const copyToClipboard = async () => {
    const text = channel;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        addToast("Copied", "Channel code copied", "success");
      } catch (error) {
        console.error("Clipboard API failed:", error);
        await fallbackCopy(text);
      }
    } else {
      await fallbackCopy(text);
    }
  };

  const shareChannel = async () => {
    const url = `${FRONTEND_URL}/?channel=${channel}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "ThrowMyFile",
          text: "Share files instantly",
          url,
        });
      } catch (error) {
        console.error("Share failed:", error);
      }
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        addToast("Copied", "Link copied to clipboard", "success");
      } catch {
        await fallbackCopy(url);
      }
    } else {
      await fallbackCopy(url);
    }
  };

  const fallbackCopy = async (text: string) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand("copy");
      addToast("Copied", "Copied to clipboard", "success");
    } catch (err) {
      addToast("Error", "Failed to copy to clipboard", "danger");
    }
    document.body.removeChild(textarea);
  };

  const handleSendClick = useCallback(() => {
    if (fileRef.current) fileRef.current.click();
  }, []);

  const handleSendKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleSendClick();
      }
    },
    [handleSendClick],
  );
  const handleFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      handleFiles(Array.from(files));
    },
    [handleFiles],
  );

  const renderFileTransferList = useCallback(() => {
    if (filesBeingTransferred.length === 0) return null;
    return (
      <TransferList>
        {filesBeingTransferred.map((file, index) => (
          <TransferItem key={file.id} $delay={index * 100}>
            <TransferItemHeader>
              <FileNameWrapper>
                <FileIconWrapper $receiving={file.receiving}>
                  <FileIcon size={15} />
                </FileIconWrapper>
                <FileNameText title={file.name}>{file.name}</FileNameText>
                {file.compressed && <ZipBadge>ZIP</ZipBadge>}
              </FileNameWrapper>
              <TransferStatus $receiving={file.receiving}>
                <StatusDot $receiving={file.receiving} />
                {file.receiving ? "Receiving" : "Sending"}
              </TransferStatus>
            </TransferItemHeader>
            {progress[file.id] && (
              <>
                <ProgressTrack>
                  <ProgressFill style={{ width: `${progress[file.id]}%` }}>
                    <ProgressGlow />
                  </ProgressFill>
                </ProgressTrack>
                <ProgressInfo>
                  <ProgressPercent>{progress[file.id]}%</ProgressPercent>
                  {size[file.id] && (
                    <ProgressSize>
                      {((size[file.id].received || 0) / 1048576).toFixed(1)} /{" "}
                      {((size[file.id].original || 0) / 1048576).toFixed(1)} MB
                    </ProgressSize>
                  )}
                </ProgressInfo>
              </>
            )}
          </TransferItem>
        ))}
      </TransferList>
    );
  }, [filesBeingTransferred, progress, size]);

  const trimFileName = useCallback((fileName: string, maxLength = 24) => {
    if (fileName.length <= maxLength) return fileName;
    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex === -1) {
      // No extension, just truncate
      return `${fileName.substring(0, maxLength - 3)}...`;
    }
    const extension = fileName.substring(lastDotIndex + 1);
    const nameWithoutExt = fileName.substring(0, lastDotIndex);
    if (nameWithoutExt.length <= maxLength - extension.length - 4)
      return fileName;
    return `${nameWithoutExt.substring(0, Math.max(5, maxLength - extension.length - 4))}...${nameWithoutExt.slice(-4)}.${extension}`;
  }, []);

  // Memoize the formatter to avoid recreating it on every call
  const fileSizeFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }),
    [],
  );

  const formatFileSize = useCallback(
    (bytes: number) => {
      if (bytes === 0) return "0 B";
      const k = 1024;
      const sizes = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      const value = bytes / Math.pow(k, i);
      return `${fileSizeFormatter.format(value)} ${sizes[i]}`;
    },
    [fileSizeFormatter],
  );

  const formatTime = useCallback(
    (date: Date) =>
      date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    [],
  );

  const renderFileHistory = useCallback(() => {
    const fallbackTimestamp = Date.now();

    const allFiles = [
      ...sentFilesHistory.map((file) => ({
        ...file,
        type_info: "sent" as const,
      })),
      ...receivedFilesHistory.map((file) => ({
        ...file,
        type_info: "received" as const,
      })),
    ].sort(
      (a, b) =>
        new Date(b.sentAt || b.receivedAt || fallbackTimestamp).getTime() -
        new Date(a.sentAt || a.receivedAt || fallbackTimestamp).getTime(),
    );

    if (allFiles.length === 0)
      return (
        <EmptyHistoryState>
          <Text color="secondary">No transfers yet</Text>
        </EmptyHistoryState>
      );

    const recentFiles = allFiles.slice(0, 3);
    return (
      <div>
        {recentFiles.map((file, index) => (
          <InlineHistoryItem key={file.id || index} $delay={index * 80}>
            <InlineLeft>
              <InlineStatusBadge $type={file.type_info}>
                {file.type_info === "sent" ? (
                  <ArrowUp size={10} />
                ) : (
                  <ArrowDown size={10} />
                )}
              </InlineStatusBadge>
              <InlineFileName title={file.name}>
                {trimFileName(file.name, 22)}
              </InlineFileName>
            </InlineLeft>
            <InlineRight>
              <InlineTime>
                {formatTime(
                  new Date(file.sentAt || file.receivedAt || fallbackTimestamp),
                )}
              </InlineTime>
              <InlineTypeBadge $type={file.type_info}>
                {file.type_info === "sent" ? "SENT" : "RECV"}
              </InlineTypeBadge>
            </InlineRight>
          </InlineHistoryItem>
        ))}
        {allFiles.length > 3 && (
          <SeeMoreButton onClick={() => setShowHistoryModal(true)}>
            +{allFiles.length - 3} more files
          </SeeMoreButton>
        )}
      </div>
    );
  }, [sentFilesHistory, receivedFilesHistory, trimFileName, formatTime]);

  return (
    <HomeComponent>
      <SkipToContent href="#main-content">Skip to main content</SkipToContent>
      <GlobalStyle />

      {/* Background Effects */}
      <div className="mesh-gradient" aria-hidden="true" />
      <div className="noise" aria-hidden="true" />
      <Particles />

      <ToastContainerWrapper>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </ToastContainerWrapper>

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

      <MainContainer id="main-content" role="main">
        <animated.div style={cardSpring}>
          <CardWrapper>
            <Card>
              {/* Glowing Border Effect */}
              <CardBorderGlow />

              <HeaderSection>
                <LogoContainer aria-hidden="true">
                  <LogoIcon>
                    <UploadIconWrapper>
                      <Upload size={30} />
                    </UploadIconWrapper>
                    <LogoRing />
                    <LogoRingDelayed />
                  </LogoIcon>
                  <LogoGlowBlob />
                </LogoContainer>

                <Title>Instant P2P</Title>
                <Subtitle>
                  Secure file transfer across devices, anywhere.
                </Subtitle>

                <FeatureBadges>
                  <Badge aria-label="End-to-End Encrypted">
                    <Shield size={12} />
                    <span>End-to-End Encrypted</span>
                  </Badge>
                  <Badge aria-label="No Server Storage">
                    <Globe size={12} />
                    <span>No Server Storage</span>
                  </Badge>
                </FeatureBadges>
              </HeaderSection>

              <CardBody>
                <ChannelSection>
                  <ChannelLabelWrapper>
                    <Link2 size={12} />
                    <span>Channel Code</span>
                  </ChannelLabelWrapper>
                  <ChannelBox $focused={isChannelFocused}>
                    <ChannelCode aria-label="Channel code" role="status">
                      {channel}
                    </ChannelCode>
                    <ActionButtons>
                      <IconButton
                        onClick={copyToClipboard}
                        title="Copy code"
                        aria-label="Copy channel code"
                      >
                        <Copy size={16} />
                      </IconButton>
                      <IconButton
                        onClick={shareChannel}
                        title="Share link"
                        aria-label="Share channel link"
                      >
                        <Share2 size={16} />
                      </IconButton>
                    </ActionButtons>
                  </ChannelBox>
                </ChannelSection>

                <JoinSection>
                  <InputWrapper>
                    <StyledInput
                      onChange={handleChange}
                      onFocus={() => setIsChannelFocused(true)}
                      onBlur={() => setIsChannelFocused(false)}
                      placeholder="Enter code"
                      value={channel}
                      autoComplete="off"
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck="false"
                    />
                  </InputWrapper>
                  <Tooltip title="Generate new">
                    <IconButtonSecondary
                      onClick={generateChannel}
                      aria-label="Generate new channel code"
                    >
                      <RefreshCw size={16} />
                    </IconButtonSecondary>
                  </Tooltip>
                  <Button
                    variant="primary"
                    onClick={handleConnectChannel}
                    style={{ height: 54 }}
                    disabled={!channel || throwing}
                  >
                    <Zap size={16} />
                    Join
                  </Button>
                </JoinSection>

                {renderFileTransferList()}

                <FileSection role="region" aria-label="File upload area">
                  {throwing && (
                    <LoadingDotsWrapper
                      aria-live="polite"
                      aria-label="Files are being transferred"
                    >
                      <LoadingDot />
                      <LoadingDot />
                      <LoadingDot />
                    </LoadingDotsWrapper>
                  )}
                  {!throwing && (
                    <SendButtonWrapper>
                      <SendButton
                        onClick={handleSendClick}
                        onKeyDown={handleSendKeyDown}
                        aria-label="Send files"
                      >
                        <SendButtonIcon aria-hidden="true">
                          <Upload size={22} />
                        </SendButtonIcon>
                        <SendButtonText>Send Files</SendButtonText>
                        <ButtonShine />
                      </SendButton>
                      <PasteHint>
                        or <PasteText>paste</PasteText> from clipboard
                      </PasteHint>
                    </SendButtonWrapper>
                  )}
                </FileSection>

                <HistorySection role="region" aria-label="Recent transfers">
                  <HistoryHeader>
                    <HistoryTitle>
                      <Sparkles size={15} />
                      Recent Transfers
                    </HistoryTitle>
                    <HistoryStats>
                      {sentFilesHistory.length + receivedFilesHistory.length}{" "}
                      total
                    </HistoryStats>
                  </HistoryHeader>
                  {showHistory && (
                    <HistoryContent>{renderFileHistory()}</HistoryContent>
                  )}
                  {sentFilesHistory.length + receivedFilesHistory.length >
                    0 && (
                    <ViewAllButton onClick={() => setShowHistoryModal(true)}>
                      View All History
                    </ViewAllButton>
                  )}
                </HistorySection>

                <Footer>
                  <UserCountBadge>
                    <Users size={14} />
                    <span>{connectedUsers} online</span>
                  </UserCountBadge>
                  <FooterLinks>
                    <span>© {new Date().getFullYear()} ThrowMyFile</span>
                    <FooterLink href="/privacy-policy">Privacy</FooterLink>
                    <FooterLink
                      href="https://github.com/jamg26/throw-files"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github size={14} />
                    </FooterLink>
                  </FooterLinks>
                </Footer>
              </CardBody>
            </Card>
          </CardWrapper>
        </animated.div>
      </MainContainer>

      <input
        type="file"
        ref={fileRef}
        id="file_input"
        multiple
        hidden
        onChange={handleFileInputChange}
        aria-label="Select files to upload"
      />
    </HomeComponent>
  );
});

const HomeComponent = styled.div`
  min-height: 100vh;
  position: relative;
  z-index: 2;
`;

const MainContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 80px 16px 24px;

  @media (max-width: 480px) {
    padding: 48px 12px 16px;
    align-items: flex-start;
  }
`;

const CardWrapper = styled.div`
  width: 100%;
  max-width: 520px;
  position: relative;

  @media (max-width: 480px) {
    max-width: 100%;
  }

  @media (min-width: 1024px) {
    max-width: 560px;
  }
`;

const Card = styled.div`
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 28px;
  box-shadow: var(--shadow-xl), var(--shadow-glow);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  position: relative;

  &:hover {
    border-color: var(--border-accent);
    transform: translateY(-6px);
    box-shadow:
      var(--shadow-xl),
      0 0 120px var(--accent-glow);
  }
`;

const CardBorderGlow = styled.div`
  position: absolute;
  inset: -1px;
  border-radius: 28px;
  padding: 1px;
  background: linear-gradient(
    135deg,
    var(--accent-primary),
    var(--accent-tertiary),
    var(--accent-sky)
  );
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;

  ${Card}:hover & {
    opacity: 0.6;
    animation: ${borderGlow} 2s ease-in-out infinite;
  }
`;

const HeaderSection = styled.div`
  text-align: center;
  padding: 32px 28px 24px;
  position: relative;

  @media (max-width: 480px) {
    padding: 24px 18px 20px;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  position: relative;
`;

const LogoIcon = styled.div`
  width: 64px;
  height: 64px;
  background: var(--accent-gradient);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  animation: ${float} 4s ease-in-out infinite;
  box-shadow:
    0 0 30px var(--accent-glow-strong),
    0 12px 40px rgba(129, 140, 248, 0.25);
`;

const UploadIconWrapper = styled.div`
  color: white;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.3));
`;

const LogoRing = styled.div`
  position: absolute;
  width: 80px;
  height: 80px;
  border: 2px solid var(--accent-primary);
  border-radius: 24px;
  top: -8px;
  left: -8px;
  opacity: 0.3;
  animation: ${glowPulse} 3s ease-in-out infinite;
`;

const LogoRingDelayed = styled(LogoRing)`
  width: 100px;
  height: 100px;
  border-radius: 30px;
  top: -16px;
  left: -16px;
  animation-delay: 0.5s;
  opacity: 0.15;
`;

const LogoGlowBlob = styled.div`
  position: absolute;
  width: 120px;
  height: 120px;
  background: var(--accent-gradient);
  border-radius: 50%;
  filter: blur(35px);
  opacity: 0.25;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: ${glowPulse} 4s ease-in-out infinite;
`;

const Title = styled.h1`
  font-size: clamp(26px, 6.5vw, 34px);
  font-weight: 800;
  letter-spacing: -1.5px;
  color: var(--text-primary);
  margin: 0 0 12px;
  background: linear-gradient(
    135deg,
    var(--text-primary) 0%,
    var(--accent-secondary) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (max-width: 360px) {
    font-size: 24px;
    letter-spacing: -1px;
  }
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 auto 20px;
  line-height: 1.6;
  max-width: 34ch;

  @media (max-width: 480px) {
    font-size: 13px;
    margin-bottom: 16px;
  }
`;

const FeatureBadges = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    gap: 8px;
  }
`;

const Badge = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--bg-glass);
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
  animation: ${fadeInUp} 0.5s ease both;
  animation-delay: 0.3s;

  svg {
    color: var(--accent-primary);
  }

  @media (max-width: 480px) {
    padding: 5px 10px;
    font-size: 10px;
  }
`;

const ChannelSection = styled.div`
  margin-bottom: 20px;
`;

const ChannelLabelWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-muted);
  margin-bottom: 14px;
`;

const ChannelBox = styled.div<{ $focused?: boolean }>`
  background: var(--bg-tertiary);
  border: 1px solid
    ${(p) => (p.$focused ? "var(--accent-primary)" : "var(--border-subtle)")};
  border-radius: 18px;
  padding: 22px 26px;
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${(p) =>
    p.$focused
      ? "0 0 0 4px var(--accent-glow), 0 8px 32px rgba(0,0,0,0.2)"
      : "none"};

  &:hover {
    border-color: var(--border-accent);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }

  [data-theme="light"] & {
    background: var(--bg-secondary);
    border-color: ${(p) =>
      p.$focused ? "var(--accent-primary)" : "var(--border-subtle)"};
    box-shadow: ${(p) =>
      p.$focused
        ? "0 0 0 4px var(--accent-glow), 0 4px 20px var(--accent-glow)"
        : "var(--shadow-sm)"};
  }

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 16px;
  }
`;

const ChannelCode = styled.span`
  font-family: "Inter", monospace;
  font-size: clamp(24px, 7vw, 38px);
  font-weight: 700;
  letter-spacing: clamp(2px, 1.2vw, 6px);
  color: var(--accent-primary);
  flex: 1;
  min-width: 0;
  word-break: break-word;
  text-align: left;
  text-shadow: 0 0 40px var(--accent-glow);

  @media (max-width: 360px) {
    font-size: 22px;
    letter-spacing: 1px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
  flex-shrink: 0;

  @media (max-width: 480px) {
    justify-content: flex-end;
  }
`;

const IconButton = styled.button`
  background: var(--bg-glass);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  min-width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: var(--accent-glow);
    border-color: var(--accent-primary);
    color: var(--accent-primary);
    transform: scale(1.05);
    box-shadow: 0 4px 20px var(--accent-glow);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const IconButtonSecondary = styled(IconButton)`
  background: var(--bg-tertiary);
`;

const InputWrapper = styled.div`
  flex: 1;
`;

const JoinSection = styled.div`
  display: flex;
  gap: 12px;
  align-items: stretch;
  margin-bottom: 28px;

  @media (max-width: 600px) {
    flex-wrap: wrap;
    gap: 10px;

    ${InputWrapper} {
      width: 100%;
      flex: none;
    }

    > button,
    > div {
      flex: 1;
      min-width: 0;
    }
  }
`;

const StyledInput = styled(Input)`
  height: 54px;
  font-size: 16px;
  letter-spacing: 3px;
  border-radius: 16px;
  text-transform: uppercase;
  font-weight: 600;

  @media (max-width: 480px) {
    height: 48px;
    font-size: 15px;
    letter-spacing: 2px;
  }
`;

const TransferList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 28px;
`;

const TransferItem = styled.div<{ $delay: number }>`
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  padding: 20px 22px;
  animation: ${fadeInUp} 0.5s ease ${(p) => p.$delay}ms both;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--accent-primary);
    transform: translateX(6px);
    box-shadow: 0 8px 32px rgba(129, 140, 248, 0.15);
  }

  [data-theme="light"] & {
    background: var(--bg-secondary);
  }
`;

const TransferItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const FileNameWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
`;

const FileIconWrapper = styled.div<{ $receiving?: boolean }>`
  color: ${(p) =>
    p.$receiving ? "var(--accent-sky)" : "var(--accent-emerald)"};
  flex-shrink: 0;
`;

const FileNameText = styled.span`
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ZipBadge = styled.span`
  font-size: 9px;
  font-weight: 700;
  color: var(--accent-tertiary);
  background: rgba(192, 132, 252, 0.15);
  padding: 4px 10px;
  border-radius: 8px;
  text-transform: uppercase;
  flex-shrink: 0;
`;

const TransferStatus = styled.span<{ $receiving?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  color: ${(p) =>
    p.$receiving ? "var(--accent-sky)" : "var(--accent-emerald)"};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatusDot = styled.span<{ $receiving?: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(p) =>
    p.$receiving ? "var(--accent-sky)" : "var(--accent-emerald)"};
  animation: ${pulse} 1.5s ease-in-out infinite;
  box-shadow: 0 0 10px
    ${(p) => (p.$receiving ? "var(--accent-sky)" : "var(--accent-emerald)")};
`;

const ProgressTrack = styled.div`
  height: 8px;
  background: var(--border-subtle);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
  position: relative;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: var(--accent-gradient);
  border-radius: 4px;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
`;

const ProgressGlow = styled.div`
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.5),
    transparent
  );
  animation: ${shimmer} 1.5s infinite;
`;

const ProgressInfo = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 13px;
`;

const ProgressPercent = styled.span`
  color: var(--accent-primary);
  font-weight: 700;
`;

const ProgressSize = styled.span`
  color: var(--text-muted);
`;

const FileSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
`;

const LoadingDotsWrapper = styled.div`
  display: flex;
  gap: 10px;
`;

const LoadingDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent-gradient);
  animation: bounce 1.4s ease-in-out infinite both;

  &:nth-of-type(1) {
    animation-delay: -0.32s;
  }
  &:nth-of-type(2) {
    animation-delay: -0.16s;
  }
`;

const SendButtonWrapper = styled.div`
  text-align: center;
`;

const SendButton = styled.button`
  background: var(--accent-gradient);
  background-size: 200% 200%;
  color: white;
  border: none;
  border-radius: 24px;
  padding: 22px 72px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 14px;
  box-shadow:
    0 8px 40px rgba(129, 140, 248, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: "Inter", sans-serif;
  letter-spacing: -0.02em;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-6px) scale(1.03);
    box-shadow:
      0 16px 60px rgba(129, 140, 248, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.2) inset;
    animation: ${gradientShift} 2s ease infinite;
  }

  &:active {
    transform: translateY(-3px) scale(0.98);
  }

  [data-theme="light"] & {
    box-shadow:
      0 8px 32px rgba(99, 102, 241, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.2) inset;

    &:hover {
      box-shadow:
        0 16px 48px rgba(99, 102, 241, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.3) inset;
    }
  }

  @media (max-width: 480px) {
    width: 100%;
    padding: 16px 24px;
    font-size: 16px;
    gap: 10px;
    border-radius: 18px;
  }
`;

const SendButtonIcon = styled.div`
  display: flex;
  transition: transform 0.3s ease;

  ${SendButton}:hover & {
    transform: translateY(-3px) scale(1.1);
  }
`;

const SendButtonText = styled.span``;

const ButtonShine = styled.div`
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  transition: left 0.7s ease;

  ${SendButton}:hover & {
    left: 100%;
  }
`;

const PasteHint = styled.p`
  margin-top: 18px;
  font-size: 14px;
  color: var(--text-muted);

  @media (max-width: 480px) {
    font-size: 13px;
    margin-top: 14px;
  }
`;

const PasteText = styled.span`
  color: var(--accent-primary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: var(--accent-secondary);
    text-decoration: underline;
  }
`;

const HistorySection = styled.div`
  margin-top: 28px;
  padding: 22px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--border-medium);
  }

  [data-theme="light"] & {
    background: var(--bg-secondary);
  }

  @media (max-width: 480px) {
    padding: 16px;
    margin-top: 22px;
  }
`;

const HistoryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
`;

const HistoryTitle = styled.span`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);

  svg {
    color: var(--accent-amber);
  }
`;

const HistoryStats = styled.span`
  font-size: 12px;
  color: var(--text-muted);
  background: var(--bg-glass);
  padding: 5px 14px;
  border-radius: 20px;
`;

const HistoryContent = styled.div`
  max-height: 240px;
  overflow-y: auto;
`;

const EmptyHistoryState = styled.div`
  text-align: center;
  padding: 28px;
`;

const InlineHistoryItem = styled.div<{ $delay: number }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 18px;
  background: var(--bg-glass);
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  margin-bottom: 10px;
  animation: ${fadeInUp} 0.4s ease ${(p) => p.$delay}ms both;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--accent-primary);
    transform: translateX(8px);
    box-shadow: 0 4px 24px var(--accent-glow);
  }

  @media (max-width: 400px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 14px;
  }
`;

const InlineLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`;

const InlineStatusBadge = styled.span<{ $type: "sent" | "received" }>`
  width: 30px;
  height: 30px;
  border-radius: 10px;
  background: ${(p) =>
    p.$type === "sent" ? "var(--success-glow)" : "var(--accent-glow)"};
  color: ${(p) =>
    p.$type === "sent" ? "var(--success)" : "var(--accent-primary)"};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const InlineFileName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const InlineRight = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;

  @media (max-width: 400px) {
    gap: 10px;
  }
`;

const InlineTime = styled.span`
  font-size: 12px;
  color: var(--text-muted);
`;

const InlineTypeBadge = styled.span<{ $type: "sent" | "received" }>`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: ${(p) =>
    p.$type === "sent" ? "var(--success)" : "var(--accent-primary)"};
`;

const SeeMoreButton = styled.button`
  background: linear-gradient(135deg, var(--accent-glow), transparent);
  border: 1px dashed var(--border-medium);
  border-radius: 14px;
  padding: 14px;
  width: 100%;
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-primary);
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: "Inter", sans-serif;
  animation: ${fadeInUp} 0.4s ease;

  &:hover {
    background: var(--accent-primary);
    color: white;
    border-style: solid;
    transform: scale(1.02);
  }
`;

const ViewAllButton = styled.button`
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  padding: 14px;
  width: 100%;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  margin-top: 16px;
  transition: all 0.2s ease;
  font-family: "Inter", sans-serif;

  &:hover {
    background: var(--accent-glow);
    border-color: var(--accent-primary);
    color: var(--accent-primary);
  }
`;

const Footer = styled.div`
  margin-top: 32px;
  text-align: center;
`;

const UserCountBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--text-muted);
  background: var(--bg-glass);
  padding: 12px 24px;
  border-radius: 28px;
  margin-bottom: 18px;
  border: 1px solid var(--border-subtle);

  svg {
    color: var(--accent-emerald);
  }
`;

const FooterLinks = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  font-size: 12px;
  color: var(--text-muted);
  flex-wrap: wrap;

  a {
    color: inherit;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: all 0.2s ease;

    &:hover {
      color: var(--accent-primary);
      transform: scale(1.1);
    }
  }

  @media (max-width: 480px) {
    gap: 12px;
  }
`;

const FooterLink = styled.a``;

// Particles
const ParticlesContainer = styled.div``;

const Particle = styled.div`
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  animation: particleFloat linear infinite;
`;

// Modal Components
const ModalTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 700;
`;

const HistoryWrapper = styled.div`
  width: 36px;
  height: 36px;
  background: var(--accent-glow);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-primary);
`;

const CountBadge = styled.span`
  background: var(--accent-gradient);
  color: white;
  font-size: 12px;
  font-weight: 700;
  padding: 5px 14px;
  border-radius: 20px;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const TabBar = styled.div`
  display: flex;
  gap: 8px;
  padding: 6px;
  background: var(--bg-tertiary);
  border-radius: 16px;
  margin-bottom: 24px;

  [data-theme="light"] & {
    background: var(--bg-secondary);
  }
`;

const TabButton = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 14px 18px;
  border: none;
  background: ${(p) => (p.$active ? "var(--accent-gradient)" : "transparent")};
  color: ${(p) => (p.$active ? "white" : "var(--text-secondary)")};
  cursor: pointer;
  font-size: 14px;
  font-weight: ${(p) => (p.$active ? "700" : "500")};
  border-radius: 14px;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-family: "Inter", sans-serif;

  &:hover {
    background: ${(p) =>
      p.$active ? "var(--accent-gradient)" : "var(--bg-glass)"};
  }
`;

const TabCount = styled.span<{ $active: boolean }>`
  background: ${(p) =>
    p.$active ? "rgba(255,255,255,0.2)" : "var(--bg-glass)"};
  padding: 4px 12px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 700;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 64px 24px;
`;

const EmptyIconWrapper = styled.div`
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  background: var(--bg-tertiary);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
`;

const EmptyTitle = styled.div`
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
`;

const EmptySubtitle = styled.div`
  font-size: 14px;
  color: var(--text-muted);
`;

const HistoryList = styled.div`
  max-height: 480px;
  overflow-y: auto;
`;

const HistoryItem = styled.div<{ $visible: boolean; $delay: number }>`
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 18px;
  align-items: center;
  padding: 18px 0;
  border-bottom: 1px solid var(--border-subtle);
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transform: translateX(${(p) => (p.$visible ? 0 : -30)}px);
  transition: all 0.4s ease ${(p) => p.$delay}ms;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--bg-glass);
    margin: 0 -16px;
    padding: 18px 16px;
    border-radius: 14px;
  }
`;

const HistoryItemLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
`;

const StatusBadge = styled.span<{ $type: "sent" | "received" }>`
  width: 32px;
  height: 32px;
  border-radius: 12px;
  background: ${(p) =>
    p.$type === "sent" ? "var(--success-glow)" : "var(--accent-glow)"};
  color: ${(p) =>
    p.$type === "sent" ? "var(--success)" : "var(--accent-primary)"};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const HistoryFileNameWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

const FileName = styled.span``;

const HistoryItemRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
`;

const MetaText = styled.span`
  font-size: 12px;
  color: var(--text-muted);
`;

const TypeBadge = styled.span<{ $type: "sent" | "received" }>`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: ${(p) =>
    p.$type === "sent" ? "var(--success)" : "var(--accent-primary)"};
`;

const FileSizeText = styled.span`
  font-size: 14px;
  color: var(--text-muted);
`;

// Toast Components
const ToastContainerWrapper = styled.div`
  position: fixed;
  top: 90px;
  right: 28px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const ToastContainer = styled.div<{ $visible: boolean; $leaving: boolean }>`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: 18px;
  box-shadow: var(--shadow-lg);
  min-width: 340px;
  max-width: 440px;
  transform: translateX(${(p) => (p.$leaving ? "120%" : "0")});
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
`;

const ToastIconWrapper = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const ToastContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ToastTitle = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
`;

const ToastDescription = styled.div`
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 3px;
`;

const ToastClose = styled.button`
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  flex-shrink: 0;

  &:hover {
    background: var(--bg-glass);
    color: var(--text-primary);
  }
`;

const ToastProgress = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  animation: toastProgress 5s linear forwards;

  @keyframes toastProgress {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }
`;

const SkipToContent = styled.a`
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--accent-primary);
  color: white;
  padding: 8px 16px;
  z-index: 9999;
  text-decoration: none;
  font-weight: 600;
  border-radius: 0 0 8px 0;
  transition: top 0.3s ease;

  &:focus {
    top: 0;
  }
`;
