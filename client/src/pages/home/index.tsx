import {
  memo,
  useEffect,
  useRef,
  useState,
  ChangeEvent,
  useCallback,
  DragEvent,
  KeyboardEvent as ReactKeyboardEvent,
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
  Download,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Link2,
  Sparkles,
  Globe,
  Shield,
  WifiOff,
} from "lucide-react";
import { Modal } from "../../components/modal";
import { Tooltip } from "../../components/tooltip";
import { socket, type ConnectionState } from "../../utils/throw-socket";
import { Button, CardBody, Text } from "../../components";
import { useSpring, useSpringRef, animated } from "react-spring";
import ThrowFileUpload, {
  UploadError,
  type SubmitFile,
  type UploadErrorEvent,
  type UploadFileInfo,
} from "../../utils/throw-file-upload";
import {
  CHANNEL_CODE_LENGTH,
  generateChannelCode,
  isValidChannelCode,
  normalizeChannelCode,
} from "../../utils/channel";
import { formatFileSize, trimFileName } from "../../utils/format";
import {
  MAX_FILE_BYTES,
  isTransferComplete,
  wouldExceedExpectedSize,
} from "../../utils/transfer";
import * as S from "./styles";

const FRONTEND_URL: string =
  (window as { ENV?: { REACT_APP_FRONTEND_URL?: string } }).ENV
    ?.REACT_APP_FRONTEND_URL ||
  // Falls back to wherever the app is actually served from, so Share can never
  // hand somebody a localhost link in production.
  window.location.origin;

const TRANSFER_TIMEOUT = 5 * 60 * 1000;
const TOAST_DURATION = 5000;
const MAX_TOASTS = 4;
const OBJECT_URL_TTL = 60_000;

const TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastData {
  id: string;
  title: string;
  description: string;
  type: ToastVariant;
}

type Direction = "send" | "receive";

interface Transfer {
  id: string;
  name: string;
  size: number;
  bytes: number;
  direction: Direction;
  compressed: boolean;
}

interface HistoryEntry {
  id: string;
  name: string;
  size: number;
  at: number;
  channel: string;
  compressed: boolean;
  direction: Direction;
}

/**
 * A fully received file waiting for the user to save it.
 *
 * Received files are no longer written to disk automatically: a synthetic anchor
 * click on every inbound `file-done` meant anyone who guessed a channel code
 * could push a download onto a stranger's machine.
 */
interface ReadyFile {
  id: string;
  name: string;
  size: number;
  type: string;
  compressed: boolean;
  blob: Blob;
}

interface ReceiveBuffer {
  chunks: Blob[];
  bytes: number;
  info: { name: string; type: string; size: number; compressed: boolean };
  timeoutId: ReturnType<typeof setTimeout>;
}

const CONNECTION_LABEL: Record<ConnectionState, string> = {
  idle: "Not connected",
  connecting: "Connecting…",
  open: "Connected",
  reconnecting: "Reconnecting…",
  failed: "Connection lost",
};

const PARTICLE_COLORS = [
  "#ED4B9E",
  "#F472B6",
  "#FB7185",
  "#34D399",
  "#38BDF8",
  "#FBBF24",
] as const;

// Generated once at module load so re-renders never reshuffle the field.
const PARTICLES_DATA = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 20}s`,
  duration: `${15 + Math.random() * 20}s`,
  color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
  size: 2 + Math.random() * 4,
}));

const Particles = memo(
  () => (
    <S.ParticlesContainer aria-hidden="true">
      {PARTICLES_DATA.map((p) => (
        <S.Particle
          key={p.id}
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
    </S.ParticlesContainer>
  ),
  () => true,
);

function vibrate(): void {
  if (window.navigator?.vibrate) window.navigator.vibrate(200);
}

function formatTime(at: number): string {
  return TIME_FORMAT.format(new Date(at));
}

const TOAST_ICONS: Record<ToastVariant, JSX.Element> = {
  success: <CheckCircle size={18} />,
  error: <AlertCircle size={18} />,
  warning: <AlertCircle size={18} />,
  info: <Info size={18} />,
};

const TOAST_STYLES: Record<
  ToastVariant,
  { bg: string; border: string; color: string; iconBg: string }
> = {
  success: {
    bg: "var(--success-glow)",
    border: "rgba(52, 211, 153, 0.3)",
    color: "var(--success)",
    iconBg: "rgba(52, 211, 153, 0.15)",
  },
  error: {
    bg: "rgba(248, 113, 113, 0.12)",
    border: "rgba(248, 113, 113, 0.35)",
    color: "var(--danger)",
    iconBg: "rgba(248, 113, 113, 0.15)",
  },
  warning: {
    bg: "rgba(251, 191, 36, 0.12)",
    border: "rgba(251, 191, 36, 0.35)",
    color: "var(--warning)",
    iconBg: "rgba(251, 191, 36, 0.15)",
  },
  info: {
    bg: "var(--accent-glow)",
    border: "var(--border-accent)",
    color: "var(--accent-primary)",
    iconBg: "rgba(237, 75, 158, 0.15)",
  },
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

  // Held in a ref so the dismiss timer below can depend on nothing. Keying the
  // effect on the callback restarted the countdown on every parent render, so
  // toasts never auto-dismissed while a transfer was ticking.
  const onRemoveRef = useRef(onRemove);
  onRemoveRef.current = onRemove;

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    const dismiss = setTimeout(() => setLeaving(true), TOAST_DURATION);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(dismiss);
    };
  }, []);

  useEffect(() => {
    if (!leaving) return;
    const remove = setTimeout(() => onRemoveRef.current(toast.id), 400);
    return () => clearTimeout(remove);
  }, [leaving, toast.id]);

  const styles = TOAST_STYLES[toast.type];

  return (
    <S.ToastContainer
      $visible={visible}
      $leaving={leaving}
      style={{ background: styles.bg, borderColor: styles.border }}
    >
      <S.ToastIconWrapper
        style={{ background: styles.iconBg, color: styles.color }}
      >
        {TOAST_ICONS[toast.type]}
      </S.ToastIconWrapper>
      <S.ToastContent>
        <S.ToastTitle>{toast.title}</S.ToastTitle>
        <S.ToastDescription>{toast.description}</S.ToastDescription>
      </S.ToastContent>
      <S.ToastClose onClick={() => setLeaving(true)} aria-label="Dismiss">
        <X size={14} />
      </S.ToastClose>
      <S.ToastProgress style={{ background: styles.color }} />
    </S.ToastContainer>
  );
};

const HistoryModal = ({
  visible,
  onClose,
  history,
  onClearHistory,
}: {
  visible: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onClearHistory: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "send" | "receive">("all");

  const sentCount = history.filter((h) => h.direction === "send").length;
  const receivedCount = history.length - sentCount;
  const files =
    activeTab === "all"
      ? history
      : history.filter((h) => h.direction === activeTab);

  return (
    <Modal
      title={
        <S.ModalTitle>
          <S.HistoryWrapper>
            <History size={18} />
          </S.HistoryWrapper>
          Transfer History
          <S.CountBadge>{history.length}</S.CountBadge>
        </S.ModalTitle>
      }
      visible={visible}
      onClose={onClose}
      width={600}
      footer={
        <S.ModalFooter>
          {history.length > 0 && (
            <Button variant="danger" onClick={onClearHistory}>
              Clear All
            </Button>
          )}
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </S.ModalFooter>
      }
    >
      <S.TabBar>
        {(
          [
            { key: "all", label: "All", count: history.length },
            { key: "send", label: "Sent", count: sentCount },
            { key: "receive", label: "Received", count: receivedCount },
          ] as const
        ).map((tab) => (
          <S.TabButton
            key={tab.key}
            $active={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <S.TabCount $active={activeTab === tab.key}>{tab.count}</S.TabCount>
          </S.TabButton>
        ))}
      </S.TabBar>

      {files.length === 0 ? (
        <S.EmptyState>
          <S.EmptyIconWrapper>
            <FileIcon size={32} />
          </S.EmptyIconWrapper>
          <S.EmptyTitle>No transfers yet</S.EmptyTitle>
          <S.EmptySubtitle>Your file transfers will appear here</S.EmptySubtitle>
        </S.EmptyState>
      ) : (
        <S.HistoryList>
          {files.map((file, index) => {
            const type = file.direction === "send" ? "sent" : "received";
            return (
              <S.HistoryItem key={file.id} $visible $delay={index * 40}>
                <S.HistoryItemLeft>
                  <S.StatusBadge $type={type}>
                    {file.direction === "send" ? (
                      <ArrowUp size={11} />
                    ) : (
                      <ArrowDown size={11} />
                    )}
                  </S.StatusBadge>
                  <S.FileNameWrapper>
                    <S.FileNameText title={file.name}>
                      {trimFileName(file.name, 30)}
                    </S.FileNameText>
                    {file.compressed && <S.ZipBadge>ZIP</S.ZipBadge>}
                  </S.FileNameWrapper>
                </S.HistoryItemLeft>
                <S.HistoryItemRight>
                  <S.MetaText>{formatTime(file.at)}</S.MetaText>
                  <S.TypeBadge $type={type}>
                    {file.direction === "send" ? "SENT" : "RECV"}
                  </S.TypeBadge>
                </S.HistoryItemRight>
                <S.FileSizeText>{formatFileSize(file.size)}</S.FileSizeText>
              </S.HistoryItem>
            );
          })}
        </S.HistoryList>
      )}
    </Modal>
  );
};

export const Home = memo(() => {
  const uploaderRef = useRef<ThrowFileUpload | null>(null);
  if (!uploaderRef.current) uploaderRef.current = new ThrowFileUpload(socket);
  const uploader = uploaderRef.current;

  const [code, setCode] = useState("");
  const [joinedChannel, setJoinedChannel] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    socket.connectionState,
  );
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [readyFiles, setReadyFiles] = useState<ReadyFile[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const buffersRef = useRef<Record<string, ReceiveBuffer>>({});
  const dragDepthRef = useRef(0);

  // Read by socket handlers that are registered once and must not go stale.
  const joinedChannelRef = useRef<string | null>(null);
  joinedChannelRef.current = joinedChannel;

  const transferring = transfers.length > 0;

  const springRef = useSpringRef();
  const cardSpring = useSpring({
    ref: springRef,
    opacity: isLoaded ? 1 : 0,
    transform: isLoaded
      ? "translateY(0) scale(1)"
      : "translateY(60px) scale(0.95)",
    config: { tension: 80, friction: 12, precision: 0.001 },
  });

  // ── Toasts ────────────────────────────────────────────────────────────────

  const addToast = useCallback(
    (title: string, description: string, type: ToastVariant) => {
      setToasts((prev) => [
        ...prev.slice(-(MAX_TOASTS - 1)),
        { id: crypto.randomUUID(), title, description, type },
      ]);
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Transfer list ─────────────────────────────────────────────────────────

  const upsertTransfer = useCallback((transfer: Transfer) => {
    setTransfers((prev) => {
      const index = prev.findIndex((t) => t.id === transfer.id);
      if (index === -1) return [...prev, transfer];
      const next = [...prev];
      next[index] = transfer;
      return next;
    });
  }, []);

  const setTransferBytes = useCallback((id: string, bytes: number) => {
    setTransfers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, bytes } : t)),
    );
  }, []);

  const dropTransfer = useCallback((id: string) => {
    setTransfers((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /** Tear down a partial receive: timer, buffer and progress row together. */
  const discardBuffer = useCallback(
    (id: string) => {
      const buffer = buffersRef.current[id];
      if (buffer) clearTimeout(buffer.timeoutId);
      delete buffersRef.current[id];
      dropTransfer(id);
    },
    [dropTransfer],
  );

  const addHistory = useCallback((entry: HistoryEntry) => {
    setHistory((prev) => [entry, ...prev]);
  }, []);

  // ── Channel ───────────────────────────────────────────────────────────────

  const joinChannel = useCallback(
    (next: string) => {
      const normalized = normalizeChannelCode(next);
      if (!isValidChannelCode(normalized)) {
        addToast(
          "Invalid code",
          `Channel codes are exactly ${CHANNEL_CODE_LENGTH} letters or digits.`,
          "error",
        );
        return;
      }
      setCode(normalized);
      setJoinedChannel(normalized);
      socket.setChannel(normalized);
      // replaceState, never pushState: pushing on every change trapped the
      // browser's Back button behind one entry per keystroke.
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?channel=${normalized}`,
      );
    },
    [addToast],
  );

  const handleCodeChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    // Typing no longer joins anything — the old effect fired a join and a
    // history entry for every prefix of the code.
    setCode(normalizeChannelCode(event.target.value));
  }, []);

  const handleCodeKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        joinChannel(code);
      }
    },
    [code, joinChannel],
  );

  const handleGenerate = useCallback(() => {
    joinChannel(generateChannelCode());
  }, [joinChannel]);

  // ── Sending ───────────────────────────────────────────────────────────────

  const sendFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      const channel = joinedChannelRef.current;
      if (!channel || !socket.connected) {
        addToast(
          "Not connected",
          "Join a channel and wait for the green light before sending.",
          "error",
        );
        return;
      }
      if (uploader.hasActiveUploads) {
        addToast(
          "Already sending",
          "Wait for the current transfer to finish.",
          "warning",
        );
        return;
      }

      if (files.length === 1) {
        await uploader.submitFiles(files as SubmitFile[], channel);
        return;
      }

      try {
        addToast("Compressing", `Zipping ${files.length} files…`, "info");
        const zip = new (await import("jszip")).default();
        files.forEach((file) => zip.file(file.name, file));
        const blob = await zip.generateAsync({ type: "blob" });
        const archive = new File(
          [blob],
          `throwmyfile-${Date.now()}.zip`,
          { type: "application/zip" },
        ) as SubmitFile;
        archive.compressed = true;
        await uploader.submitFiles([archive], channel);
      } catch (error) {
        addToast(
          "Compression failed",
          error instanceof Error
            ? error.message
            : "Those files could not be zipped.",
          "error",
        );
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [addToast, uploader],
  );

  const cancelTransfer = useCallback(
    (transfer: Transfer) => {
      if (transfer.direction === "send") {
        uploader.cancelUpload(transfer.id);
        return;
      }
      discardBuffer(transfer.id);
      addToast("Cancelled", `Stopped receiving ${transfer.name}.`, "info");
    },
    [uploader, discardBuffer, addToast],
  );

  // ── Receiving ─────────────────────────────────────────────────────────────

  const saveFile = useCallback((file: ReadyFile) => {
    const url = URL.createObjectURL(file.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    anchor.rel = "noopener";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), OBJECT_URL_TTL);
  }, []);

  const dismissReadyFile = useCallback((id: string) => {
    setReadyFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // ── Socket wiring (registered once) ───────────────────────────────────────

  useEffect(() => {
    const onState = (state: ConnectionState) => {
      setConnectionState(state);
      if (state === "failed") {
        addToast(
          "Connection lost",
          "We stopped trying to reconnect. Use Retry when you're back online.",
          "error",
        );
      }
    };

    const onPeerJoined = () => {
      vibrate();
      addToast("Peer joined", "Someone else is on this channel.", "info");
    };

    const onConnections = (count: unknown) => {
      setConnectedUsers(typeof count === "number" ? count : 0);
    };

    const onIncoming = (data: { name?: string }) => {
      vibrate();
      addToast("Incoming", `Receiving ${data?.name ?? "a file"}…`, "info");
    };

    const onChunk = (data: {
      id: string;
      name: string;
      type: string;
      size: number;
      compressed: boolean;
      file: ArrayBuffer;
    }) => {
      if (!data.file || data.file.byteLength === 0) return;
      if (!(data.size > 0) || data.size > MAX_FILE_BYTES) {
        addToast(
          "Rejected",
          `${data.name || "A file"} declares an implausible size.`,
          "error",
        );
        return;
      }

      let buffer = buffersRef.current[data.id];
      if (!buffer) {
        buffer = buffersRef.current[data.id] = {
          chunks: [],
          bytes: 0,
          info: {
            name: data.name || "download",
            type: data.type || "application/octet-stream",
            size: data.size,
            compressed: Boolean(data.compressed),
          },
          timeoutId: setTimeout(() => {
            const stalled = buffersRef.current[data.id];
            if (!stalled) return;
            addToast(
              "Transfer timed out",
              `${stalled.info.name} stopped arriving. Nothing was saved.`,
              "error",
            );
            discardBuffer(data.id);
          }, TRANSFER_TIMEOUT),
        };
        upsertTransfer({
          id: data.id,
          name: buffer.info.name,
          size: data.size,
          bytes: 0,
          direction: "receive",
          compressed: buffer.info.compressed,
        });
      }

      if (
        wouldExceedExpectedSize(buffer.bytes, data.file.byteLength, buffer.info.size)
      ) {
        addToast(
          "Transfer failed",
          `${buffer.info.name} sent more data than it declared.`,
          "error",
        );
        discardBuffer(data.id);
        return;
      }

      buffer.chunks.push(new Blob([data.file]));
      buffer.bytes += data.file.byteLength;
      setTransferBytes(data.id, buffer.bytes);
    };

    const onFileDone = (data: { id: string; name?: string }) => {
      const buffer = buffersRef.current[data.id];
      if (!buffer) return;

      clearTimeout(buffer.timeoutId);
      delete buffersRef.current[data.id];
      dropTransfer(data.id);

      // The old code handed the browser whatever chunks had arrived, so a
      // single dropped frame produced a truncated file reported as a success.
      if (!isTransferComplete(buffer.bytes, buffer.info.size)) {
        addToast(
          "Transfer incomplete",
          `${buffer.info.name} arrived with ${formatFileSize(buffer.bytes)} of ${formatFileSize(buffer.info.size)}. Nothing was saved.`,
          "error",
        );
        return;
      }

      setReadyFiles((prev) => [
        {
          id: data.id,
          name: buffer.info.name,
          size: buffer.info.size,
          type: buffer.info.type,
          compressed: buffer.info.compressed,
          blob: new Blob(buffer.chunks, { type: buffer.info.type }),
        },
        ...prev,
      ]);
      addHistory({
        id: data.id,
        name: buffer.info.name,
        size: buffer.info.size,
        at: Date.now(),
        channel: joinedChannelRef.current ?? "",
        compressed: buffer.info.compressed,
        direction: "receive",
      });
      vibrate();
      addToast(
        "File ready",
        `${buffer.info.name} — press Save to download it.`,
        "success",
      );
    };

    const onFileAbort = (data: { id: string; name?: string }) => {
      if (!buffersRef.current[data.id]) return;
      const name = buffersRef.current[data.id].info.name;
      discardBuffer(data.id);
      addToast("Sender cancelled", `${name} was not sent.`, "warning");
    };

    const onDisconnected = () => {
      const ids = Object.keys(buffersRef.current);
      if (ids.length === 0) return;
      ids.forEach((id) => discardBuffer(id));
      addToast(
        "Transfer interrupted",
        "The connection dropped mid-transfer, so the partial data was discarded.",
        "error",
      );
    };

    socket.on("state", onState);
    socket.on("peer-joined", onPeerJoined);
    socket.on("connections", onConnections);
    socket.on("file-incoming", onIncoming);
    socket.on("chunk", onChunk);
    socket.on("file-done", onFileDone);
    socket.on("file-abort", onFileAbort);
    socket.on("disconnected", onDisconnected);

    return () => {
      socket.off("state", onState);
      socket.off("peer-joined", onPeerJoined);
      socket.off("connections", onConnections);
      socket.off("file-incoming", onIncoming);
      socket.off("chunk", onChunk);
      socket.off("file-done", onFileDone);
      socket.off("file-abort", onFileAbort);
      socket.off("disconnected", onDisconnected);
    };
  }, [
    addToast,
    addHistory,
    discardBuffer,
    dropTransfer,
    setTransferBytes,
    upsertTransfer,
  ]);

  // ── Uploader wiring ───────────────────────────────────────────────────────

  useEffect(() => {
    const onStart = ({ file }: { file: UploadFileInfo }) => {
      upsertTransfer({
        id: file.id,
        name: file.name,
        size: file.size,
        bytes: 0,
        direction: "send",
        compressed: file.compressed,
      });
    };

    const onProgress = ({ id, bytesSent }: { id: string; bytesSent: number }) =>
      setTransferBytes(id, bytesSent);

    const onComplete = ({ file }: { file: UploadFileInfo }) => {
      dropTransfer(file.id);
      addHistory({
        id: file.id,
        name: file.name,
        size: file.size,
        at: Date.now(),
        channel: joinedChannelRef.current ?? "",
        compressed: file.compressed,
        direction: "send",
      });
      addToast("Sent", `${file.name} was delivered.`, "success");
      if (fileRef.current) fileRef.current.value = "";
    };

    // Every failure mode surfaces now; previously only the size error did, so
    // an empty file or a read failure left the UI stuck mid-transfer forever.
    const onError = (event: UploadErrorEvent) => {
      if (event.id) dropTransfer(event.id);
      const cancelled = event.code === UploadError.Cancelled;
      addToast(
        cancelled ? "Cancelled" : "Send failed",
        event.message,
        cancelled ? "info" : "error",
      );
      if (fileRef.current) fileRef.current.value = "";
    };

    uploader.addEventListener("start", onStart);
    uploader.addEventListener("progress", onProgress);
    uploader.addEventListener("complete", onComplete);
    uploader.addEventListener("error", onError);

    return () => {
      uploader.removeEventListener("start", onStart);
      uploader.removeEventListener("progress", onProgress);
      uploader.removeEventListener("complete", onComplete);
      uploader.removeEventListener("error", onError);
    };
  }, [
    uploader,
    addToast,
    addHistory,
    dropTransfer,
    setTransferBytes,
    upsertTransfer,
  ]);

  // ── Mount ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    setIsLoaded(true);
    const timer = setTimeout(() => springRef.start(), 100);

    // Shared links are normalized, so `?channel=abc123` now works instead of
    // silently failing validation and never connecting.
    const raw = new URLSearchParams(window.location.search).get("channel");
    const fromUrl = normalizeChannelCode(raw);
    if (raw && !isValidChannelCode(fromUrl)) {
      addToast(
        "Link problem",
        "That link's channel code was incomplete, so we generated a fresh one.",
        "warning",
      );
    }
    joinChannel(isValidChannelCode(fromUrl) ? fromUrl : generateChannelCode());

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      Object.values(buffersRef.current).forEach((b) => clearTimeout(b.timeoutId));
      buffersRef.current = {};
      uploader.dispose();
    },
    [uploader],
  );

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const files = event.clipboardData?.files;
      if (!files || files.length === 0) return;
      // Only emptiness disqualifies a file. Requiring a non-empty MIME type used
      // to silently discard extensionless files the browser could not classify.
      const valid = Array.from(files).filter((file) => file.size > 0);
      if (valid.length === 0) {
        addToast("Nothing to send", "The clipboard held no files.", "warning");
        return;
      }
      void sendFiles(valid);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [sendFiles, addToast]);

  // ── Drag and drop ─────────────────────────────────────────────────────────

  const dragHasFiles = (event: DragEvent) =>
    Array.from(event.dataTransfer?.types ?? []).includes("Files");

  const handleDragEnter = useCallback((event: DragEvent) => {
    event.preventDefault();
    if (!dragHasFiles(event)) return;
    dragDepthRef.current += 1;
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDragLeave = useCallback((event: DragEvent) => {
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      dragDepthRef.current = 0;
      setIsDragging(false);
      const files = Array.from(event.dataTransfer?.files ?? []);
      if (files.length > 0) void sendFiles(files);
    },
    [sendFiles],
  );

  // ── Clipboard / share ─────────────────────────────────────────────────────

  const fallbackCopy = useCallback(
    (text: string) => {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        addToast("Copied", "Copied to clipboard.", "success");
      } catch {
        addToast("Copy failed", "Copy the code manually instead.", "error");
      }
      textarea.remove();
    },
    [addToast],
  );

  const copyCode = useCallback(async () => {
    const value = joinedChannel ?? code;
    try {
      await navigator.clipboard.writeText(value);
      addToast("Copied", "Channel code copied.", "success");
    } catch {
      fallbackCopy(value);
    }
  }, [joinedChannel, code, addToast, fallbackCopy]);

  const shareLink = useCallback(async () => {
    const url = `${FRONTEND_URL}/?channel=${joinedChannel ?? code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "ThrowMyFile",
          text: "Share files instantly",
          url,
        });
        return;
      } catch {
        // User dismissed the share sheet — nothing to report.
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      addToast("Copied", "Share link copied.", "success");
    } catch {
      fallbackCopy(url);
    }
  }, [joinedChannel, code, addToast, fallbackCopy]);

  const openFilePicker = useCallback(() => fileRef.current?.click(), []);

  const handleFileInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) void sendFiles(Array.from(files));
    },
    [sendFiles],
  );

  const retryConnection = useCallback(() => {
    if (joinedChannel) socket.setChannel(joinedChannel);
  }, [joinedChannel]);

  const recentHistory = history.slice(0, 3);
  const canSend = connectionState === "open" && !transferring;

  return (
    <S.HomeComponent>
      <S.SkipToContent href="#main-content">
        Skip to main content
      </S.SkipToContent>
      <S.GlobalStyle />

      <div className="mesh-gradient" aria-hidden="true" />
      <div className="noise" aria-hidden="true" />
      <Particles />

      <S.ToastContainerWrapper
        role="status"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </S.ToastContainerWrapper>

      <HistoryModal
        visible={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        history={history}
        onClearHistory={() => setHistory([])}
      />

      <S.MainContainer id="main-content" role="main" tabIndex={-1}>
        <animated.div style={cardSpring}>
          <S.CardWrapper>
            <S.Card>
              <S.CardBorderGlow />

              <S.HeaderSection>
                <S.LogoContainer aria-hidden="true">
                  <S.LogoIcon>
                    <S.UploadIconWrapper>
                      <Upload size={30} />
                    </S.UploadIconWrapper>
                    <S.LogoRing />
                    <S.LogoRingDelayed />
                  </S.LogoIcon>
                  <S.LogoGlowBlob />
                </S.LogoContainer>

                <S.Title>Instant Transfer</S.Title>
                <S.Subtitle>
                  Files relay straight between devices and are never stored.
                </S.Subtitle>

                <S.FeatureBadges>
                  <S.Badge>
                    <Shield size={12} />
                    <span>Encrypted in transit</span>
                  </S.Badge>
                  <S.Badge>
                    <Globe size={12} />
                    <span>No server storage</span>
                  </S.Badge>
                </S.FeatureBadges>
              </S.HeaderSection>

              <CardBody>
                {connectionState !== "open" && (
                  <S.ConnectionBanner
                    $state={connectionState}
                    role="status"
                    aria-live="polite"
                  >
                    <WifiOff size={14} aria-hidden="true" />
                    <span>{CONNECTION_LABEL[connectionState]}</span>
                    {connectionState === "failed" && (
                      <S.BannerAction onClick={retryConnection}>
                        Retry
                      </S.BannerAction>
                    )}
                  </S.ConnectionBanner>
                )}

                <S.ChannelSection>
                  <S.ChannelLabelWrapper>
                    <Link2 size={12} />
                    <span>Channel Code</span>
                  </S.ChannelLabelWrapper>
                  <S.ChannelBox>
                    <S.ChannelCode aria-label={`Channel code ${joinedChannel ?? "none"}`}>
                      {joinedChannel ?? "······"}
                    </S.ChannelCode>
                    <S.ActionButtons>
                      <S.IconButton
                        onClick={copyCode}
                        title="Copy code"
                        aria-label="Copy channel code"
                      >
                        <Copy size={16} />
                      </S.IconButton>
                      <S.IconButton
                        onClick={shareLink}
                        title="Share link"
                        aria-label="Share channel link"
                      >
                        <Share2 size={16} />
                      </S.IconButton>
                    </S.ActionButtons>
                  </S.ChannelBox>
                </S.ChannelSection>

                <S.JoinSection>
                  <S.InputWrapper>
                    <S.StyledInput
                      onChange={handleCodeChange}
                      onKeyDown={handleCodeKeyDown}
                      placeholder="Enter code"
                      value={code}
                      maxLength={CHANNEL_CODE_LENGTH}
                      autoComplete="off"
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck="false"
                      aria-label="Channel code to join"
                    />
                  </S.InputWrapper>
                  <Tooltip title="Generate new">
                    <S.IconButtonSecondary
                      onClick={handleGenerate}
                      aria-label="Generate a new channel code"
                    >
                      <RefreshCw size={16} />
                    </S.IconButtonSecondary>
                  </Tooltip>
                  <Button
                    variant="primary"
                    onClick={() => joinChannel(code)}
                    style={{ height: 54 }}
                    disabled={
                      !isValidChannelCode(code) ||
                      transferring ||
                      code === joinedChannel
                    }
                  >
                    <Zap size={16} />
                    Join
                  </Button>
                </S.JoinSection>

                {transfers.length > 0 && (
                  <S.TransferList>
                    {transfers.map((transfer, index) => {
                      const receiving = transfer.direction === "receive";
                      const percent =
                        transfer.size > 0
                          ? Math.min(
                              100,
                              (transfer.bytes / transfer.size) * 100,
                            )
                          : 0;
                      return (
                        <S.TransferItem key={transfer.id} $delay={index * 100}>
                          <S.TransferItemHeader>
                            <S.FileNameWrapper>
                              <S.FileIconWrapper $receiving={receiving}>
                                <FileIcon size={15} />
                              </S.FileIconWrapper>
                              <S.FileNameText title={transfer.name}>
                                {trimFileName(transfer.name, 28)}
                              </S.FileNameText>
                              {transfer.compressed && (
                                <S.ZipBadge>ZIP</S.ZipBadge>
                              )}
                            </S.FileNameWrapper>
                            <S.TransferStatus $receiving={receiving}>
                              <S.StatusDot $receiving={receiving} />
                              {receiving ? "Receiving" : "Sending"}
                            </S.TransferStatus>
                            <S.CancelButton
                              onClick={() => cancelTransfer(transfer)}
                              title="Cancel transfer"
                              aria-label={`Cancel ${transfer.name}`}
                            >
                              <X size={14} />
                            </S.CancelButton>
                          </S.TransferItemHeader>
                          <S.ProgressTrack
                            role="progressbar"
                            aria-valuenow={Math.round(percent)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${transfer.name} progress`}
                          >
                            <S.ProgressFill style={{ width: `${percent}%` }}>
                              <S.ProgressGlow />
                            </S.ProgressFill>
                          </S.ProgressTrack>
                          <S.ProgressInfo>
                            <S.ProgressPercent>
                              {percent.toFixed(1)}%
                            </S.ProgressPercent>
                            <S.ProgressSize>
                              {formatFileSize(transfer.bytes)} /{" "}
                              {formatFileSize(transfer.size)}
                            </S.ProgressSize>
                          </S.ProgressInfo>
                        </S.TransferItem>
                      );
                    })}
                  </S.TransferList>
                )}

                {readyFiles.length > 0 && (
                  <S.ReadyList aria-label="Files ready to save">
                    {readyFiles.map((file) => (
                      <S.ReadyItem key={file.id}>
                        <S.FileNameWrapper>
                          <S.FileIconWrapper $receiving>
                            <CheckCircle size={15} />
                          </S.FileIconWrapper>
                          <S.FileNameText title={file.name}>
                            {trimFileName(file.name, 24)}
                          </S.FileNameText>
                          {file.compressed && <S.ZipBadge>ZIP</S.ZipBadge>}
                        </S.FileNameWrapper>
                        <S.ReadyActions>
                          <S.ReadySize>{formatFileSize(file.size)}</S.ReadySize>
                          <Button
                            variant="success"
                            size="small"
                            onClick={() => saveFile(file)}
                          >
                            <Download size={14} />
                            Save
                          </Button>
                          <S.CancelButton
                            onClick={() => dismissReadyFile(file.id)}
                            title="Discard"
                            aria-label={`Discard ${file.name}`}
                          >
                            <X size={14} />
                          </S.CancelButton>
                        </S.ReadyActions>
                      </S.ReadyItem>
                    ))}
                  </S.ReadyList>
                )}

                <S.FileSection
                  $dragging={isDragging}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  aria-label="File upload area"
                >
                  {transferring ? (
                    <S.LoadingDotsWrapper
                      aria-live="polite"
                      aria-label="Transfer in progress"
                    >
                      <S.LoadingDot />
                      <S.LoadingDot />
                      <S.LoadingDot />
                    </S.LoadingDotsWrapper>
                  ) : (
                    <S.SendButtonWrapper>
                      <S.SendButton
                        onClick={openFilePicker}
                        disabled={!canSend}
                        aria-label="Choose files to send"
                      >
                        <S.SendButtonIcon aria-hidden="true">
                          <Upload size={22} />
                        </S.SendButtonIcon>
                        <S.SendButtonText>
                          {isDragging ? "Drop to send" : "Send Files"}
                        </S.SendButtonText>
                        <S.ButtonShine />
                      </S.SendButton>
                      <S.PasteHint>
                        drag &amp; drop, or <S.PasteText>paste</S.PasteText> from
                        the clipboard
                      </S.PasteHint>
                    </S.SendButtonWrapper>
                  )}
                </S.FileSection>

                <S.HistorySection aria-label="Recent transfers">
                  <S.HistoryHeader>
                    <S.HistoryTitle>
                      <Sparkles size={15} />
                      Recent Transfers
                    </S.HistoryTitle>
                    <S.HistoryStats>{history.length} total</S.HistoryStats>
                  </S.HistoryHeader>

                  <S.HistoryContent>
                    {recentHistory.length === 0 ? (
                      <S.EmptyHistoryState>
                        <Text type="secondary">No transfers yet</Text>
                      </S.EmptyHistoryState>
                    ) : (
                      recentHistory.map((file, index) => {
                        const type =
                          file.direction === "send" ? "sent" : "received";
                        return (
                          <S.InlineHistoryItem
                            key={file.id}
                            $delay={index * 80}
                          >
                            <S.InlineLeft>
                              <S.InlineStatusBadge $type={type}>
                                {file.direction === "send" ? (
                                  <ArrowUp size={10} />
                                ) : (
                                  <ArrowDown size={10} />
                                )}
                              </S.InlineStatusBadge>
                              <S.InlineFileName title={file.name}>
                                {trimFileName(file.name, 22)}
                              </S.InlineFileName>
                            </S.InlineLeft>
                            <S.InlineRight>
                              <S.InlineTime>{formatTime(file.at)}</S.InlineTime>
                              <S.InlineTypeBadge $type={type}>
                                {file.direction === "send" ? "SENT" : "RECV"}
                              </S.InlineTypeBadge>
                            </S.InlineRight>
                          </S.InlineHistoryItem>
                        );
                      })
                    )}
                  </S.HistoryContent>

                  {history.length > 3 && (
                    <S.SeeMoreButton onClick={() => setShowHistoryModal(true)}>
                      +{history.length - 3} more files
                    </S.SeeMoreButton>
                  )}
                  {history.length > 0 && history.length <= 3 && (
                    <S.ViewAllButton onClick={() => setShowHistoryModal(true)}>
                      View All History
                    </S.ViewAllButton>
                  )}
                </S.HistorySection>

                <S.Footer>
                  <S.UserCountBadge>
                    <Users size={14} />
                    <span>
                      {connectedUsers} {connectedUsers === 1 ? "device" : "devices"}{" "}
                      on this channel
                    </span>
                  </S.UserCountBadge>
                  <S.FooterLinks>
                    <span>© {new Date().getFullYear()} ThrowMyFile</span>
                    <S.FooterLink href="/privacy-policy">Privacy</S.FooterLink>
                    <S.FooterLink
                      href="https://github.com/jamg26/throw-files"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Source on GitHub"
                    >
                      <Github size={14} />
                    </S.FooterLink>
                  </S.FooterLinks>
                </S.Footer>
              </CardBody>
            </S.Card>
          </S.CardWrapper>
        </animated.div>
      </S.MainContainer>

      <input
        type="file"
        ref={fileRef}
        id="file_input"
        multiple
        hidden
        onChange={handleFileInputChange}
        aria-label="Select files to send"
      />
    </S.HomeComponent>
  );
});
