import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;

if (!SECRET || SECRET.length < 32) {
  throw new Error(
    "JWT_SECRET is missing or too short (minimum 32 characters). " +
      "Set a strong random value in your environment before starting the server.",
  );
}

const EXPIRES = process.env.JWT_EXPIRES_IN || "7d";

export function signToken(userId, tokenVersion = 0) {
  return jwt.sign({ sub: userId, ver: tokenVersion }, SECRET, {
    expiresIn: EXPIRES,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET); // returns { sub, ver, iat, exp } — throws on invalid/expired
}
