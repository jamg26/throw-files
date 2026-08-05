// Channel code rules live here so the input handler, the `?channel=` query
// parser and the join validator can never disagree about what a valid code is.
//
// Codes are the only secret protecting a transfer, so the length is fixed at 6
// rather than a 1-6 range: a 1-character code has only 36 possible values.

export const CHANNEL_CODE_LENGTH = 6;

const CHANNEL_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const VALID_CHANNEL_CODE = /^[A-Z0-9]{6}$/;

/** Coerce arbitrary input into the channel-code character set. */
export function normalizeChannelCode(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, CHANNEL_CODE_LENGTH);
}

/** True only for a complete, canonical channel code. */
export function isValidChannelCode(code: string): boolean {
  return VALID_CHANNEL_CODE.test(code);
}

/** Cryptographically random channel code. */
export function generateChannelCode(): string {
  const bytes = new Uint8Array(CHANNEL_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const byte of bytes) {
    code += CHANNEL_ALPHABET[byte % CHANNEL_ALPHABET.length];
  }
  return code;
}
