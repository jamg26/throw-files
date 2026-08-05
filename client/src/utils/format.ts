// Display formatting helpers.

const UNITS = ["B", "KB", "MB", "GB", "TB", "PB"] as const;

const NUMBER_FORMAT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const ELLIPSIS = "…";

/** Human-readable byte count. Never yields NaN/undefined for hostile input. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${NUMBER_FORMAT.format(value)} ${UNITS[unit]}`;
}

/**
 * Shorten a filename to at most `maxLength` characters, keeping the extension
 * when there is room for it.
 *
 * The result is guaranteed never to be longer than `maxLength` — the previous
 * implementation could return a string far longer than the limit whenever the
 * extension itself was long.
 */
export function trimFileName(fileName: string, maxLength = 24): string {
  if (!fileName) return "";
  if (maxLength <= 0) return "";
  if (fileName.length <= maxLength) return fileName;

  const lastDot = fileName.lastIndexOf(".");
  // A leading dot is a dotfile, not an extension; a trailing dot has no
  // extension after it.
  const hasExtension = lastDot > 0 && lastDot < fileName.length - 1;

  if (hasExtension) {
    const extension = fileName.slice(lastDot);
    const stem = fileName.slice(0, lastDot);
    // Only worth preserving if at least one stem character still fits.
    if (extension.length + ELLIPSIS.length + 1 <= maxLength) {
      const stemBudget = maxLength - extension.length - ELLIPSIS.length;
      return `${stem.slice(0, stemBudget)}${ELLIPSIS}${extension}`;
    }
  }

  return `${fileName.slice(0, maxLength - ELLIPSIS.length)}${ELLIPSIS}`;
}
