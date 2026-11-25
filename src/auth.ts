export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(password: string): Promise<string> {
  return sha256Password(password);
}

async function sha256Password(password: string): Promise<string> {
  return sha256Hex(password);
}

function b64urlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function signJWT(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = b64urlEncode(new TextEncoder().encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = b64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const data = `${header}.${body}`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return `${data}.${b64urlEncode(new Uint8Array(sig))}`;
}

export async function verifyJWT(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const [headerB64, bodyB64, sigB64] = token.split(".");
    if (!headerB64 || !bodyB64 || !sigB64) return null;
    const data = `${headerB64}.${bodyB64}`;
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const sig = b64urlDecode(sigB64);
    const ok = await crypto.subtle.verify("HMAC", key, sig, new TextEncoder().encode(data));
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(bodyB64)));
    if (payload.exp && Date.now() >= payload.exp * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}
