import jwt from "jsonwebtoken";
import { env } from "../env.js";

export function signAccessToken(payload: {
  id: string;
  email: string;
}): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken(payload: { id: string }): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): {
  id: string;
  email: string;
} {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
    id: string;
    email: string;
  };
  return { id: decoded.id, email: decoded.email };
}

export function verifyRefreshToken(token: string): { id: string } {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { id: string };
  return { id: decoded.id };
}
