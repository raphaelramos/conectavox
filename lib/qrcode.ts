export const QR_CODE_TOKEN_PREFIX = "cvx1_";
export const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type QRCodeTokenType = "activity" | "user";

interface QRCodeTokenPayload {
    v: 1;
    t: QRCodeTokenType;
    e: string;
    i: string;
}

function encodeBase64Url(value: string) {
    const utf8 = new TextEncoder().encode(value);
    const binary = Array.from(utf8, (byte) => String.fromCharCode(byte)).join("");
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function buildQRCodeToken(type: QRCodeTokenType, eventId: string, identifier: string) {
    const payload: QRCodeTokenPayload = { v: 1, t: type, e: eventId, i: identifier };
    return `${QR_CODE_TOKEN_PREFIX}${encodeBase64Url(JSON.stringify(payload))}`;
}

export function buildQRCodeUrl(baseUrl: string, type: QRCodeTokenType, eventId: string, identifier: string) {
    const token = buildQRCodeToken(type, eventId, identifier);
    return `${baseUrl}code/${token}`;
}
