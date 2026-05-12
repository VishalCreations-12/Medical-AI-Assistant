import * as jose from "jose";

const alg = "HS256";

export function getJwtSecret() {
  const s =
    process.env.JWT_SECRET ??
    "dev-secret-change-in-production-min-32-chars-long";
  return new TextEncoder().encode(s);
}

export async function signToken(userId: string, role: string) {
  return new jose.SignJWT({ uid: userId, role })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("72h")
    .sign(getJwtSecret());
}

export async function verifyToken(token: string) {
  const { payload } = await jose.jwtVerify(token, getJwtSecret(), {
    algorithms: [alg],
  });
  const uid = typeof payload.uid === "string" ? payload.uid : "";
  const role = typeof payload.role === "string" ? payload.role : "";
  if (!uid || !role) return null;
  return { uid, role };
}
