const GUEST_ID_KEY = "kinedao-guest-id";

const getCrypto = (): Crypto | null => {
  if (typeof globalThis === "undefined") return null;
  return globalThis.crypto ?? null;
};

const generateUuid = () => {
  const cryptoObj = getCrypto();
  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }

  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(16);
    cryptoObj.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  const randomHex = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return `${randomHex()}${randomHex()}-${randomHex()}-${randomHex()}-${randomHex()}-${randomHex()}${randomHex()}${randomHex()}`;
};

export const getGuestId = (): string | null => {
  if (typeof window === "undefined") return null;
  const existing = window.localStorage.getItem(GUEST_ID_KEY);
  if (existing) return existing;
  const created = generateUuid();
  window.localStorage.setItem(GUEST_ID_KEY, created);
  return created;
};

export const ensureGuestId = () => {
  return getGuestId();
};

export const getCartHeaders = (): { "x-guest-id": string } | null => {
  const guestId = getGuestId();
  if (!guestId) return null;
  return { "x-guest-id": guestId };
};
