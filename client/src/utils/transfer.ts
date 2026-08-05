// Transfer sizing limits and integrity checks.
//
// The hard constraint everything here derives from: Cloudflare Durable Objects
// reject WebSocket messages larger than 1 MiB. Our wire frame is
// [uint32 header length][header JSON][chunk bytes], so the chunk ceiling has to
// leave room for the largest header we could ever emit.

/** Cloudflare's per-message WebSocket ceiling. */
export const MAX_WS_MESSAGE_BYTES = 1024 * 1024;

/** Bytes reserved for the JSON chunk header (see maxHeaderByteLength). */
const HEADER_BUDGET_BYTES = 4096;

/**
 * Largest chunk payload we will ever put on the wire.
 *
 * 512 KiB sits comfortably under `MAX_WS_MESSAGE_BYTES` once the header budget
 * and length prefix are accounted for. The previous code scaled up to 2 MiB,
 * which silently exceeded the limit for every file over 50 MB.
 */
export const MAX_CHUNK_BYTES = 512 * 1024;

/** Advertised maximum transfer size. */
export const MAX_FILE_BYTES = 5 * 1024 * 1024 * 1024;

/** Filesystem-realistic filename ceiling. */
export const MAX_FILENAME_LENGTH = 255;

/** Upper bound on the encoded chunk header, worst case escaping included. */
export function maxHeaderByteLength(): number {
  return HEADER_BUDGET_BYTES;
}

/** Total wire size of a frame: 4-byte length prefix + header + chunk. */
export function frameByteLength(
  headerBytes: number,
  chunkBytes: number,
): number {
  return 4 + headerBytes + chunkBytes;
}

/**
 * Chunk size for a given file size. Larger files get larger chunks to cut
 * per-frame overhead, but never past `MAX_CHUNK_BYTES`.
 */
export function pickChunkSize(fileSize: number): number {
  const KB = 1024;
  const MB = 1024 * KB;
  let chunk: number;
  if (!(fileSize > 0)) chunk = 32 * KB;
  else if (fileSize < 256 * KB) chunk = 32 * KB;
  else if (fileSize < 1 * MB) chunk = 64 * KB;
  else if (fileSize < 5 * MB) chunk = 128 * KB;
  else if (fileSize < 10 * MB) chunk = 256 * KB;
  else chunk = MAX_CHUNK_BYTES;
  return Math.min(chunk, MAX_CHUNK_BYTES);
}

/**
 * Whether a received transfer is byte-for-byte complete.
 *
 * The receiver previously assembled a download from whatever chunks happened to
 * arrive, so a dropped chunk produced a silently truncated file reported as a
 * success. Nothing may be written to disk unless this returns true.
 */
export function isTransferComplete(
  bytesReceived: number,
  expectedSize: number,
): boolean {
  return expectedSize > 0 && bytesReceived === expectedSize;
}

/** Whether accepting `incomingBytes` would overshoot the declared size. */
export function wouldExceedExpectedSize(
  bytesReceived: number,
  incomingBytes: number,
  expectedSize: number,
): boolean {
  return bytesReceived + incomingBytes > expectedSize;
}
