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
    if (typeof Buffer !== "undefined") {
        return Buffer.from(value, "utf8").toString("base64url");
    }

    const encoded = encodeURIComponent(value).replace(
        /%([0-9A-F]{2})/g,
        (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16))
    );

    return btoa(encoded).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function buildQRCodeToken(type: QRCodeTokenType, eventId: string, identifier: string) {
    const payload: QRCodeTokenPayload = { v: 1, t: type, e: eventId, i: identifier };
    return `${QR_CODE_TOKEN_PREFIX}${encodeBase64Url(JSON.stringify(payload))}`;
}

export function buildQRCodeUrl(baseUrl: string, type: QRCodeTokenType, eventId: string, identifier: string) {
    const token = buildQRCodeToken(type, eventId, identifier);
    return `${baseUrl}code/${token}`;
}
