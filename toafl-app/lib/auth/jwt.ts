import "server-only";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

export interface TokenPayload {
  sub: string; // user id
  role?: string;
  [key: string]: unknown;
}

function getAccessSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("Missing JWT_ACCESS_SECRET environment variable.");
  return secret;
}

function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("Missing JWT_REFRESH_SECRET environment variable.");
  return secret;
}

const ACCESS_EXPIRES_IN = (process.env.JWT_ACCESS_EXPIRES_IN ?? "15m") as SignOptions["expiresIn"];
const REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"];

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, getAccessSecret(), {
    expiresIn: ACCESS_EXPIRES_IN,
  });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, getRefreshSecret(), {
    expiresIn: REFRESH_EXPIRES_IN,
  });
}

export function verifyAccessToken(token: string): JwtPayload & TokenPayload {
  return jwt.verify(token, getAccessSecret()) as JwtPayload & TokenPayload;
}

export function verifyRefreshToken(token: string): JwtPayload & TokenPayload {
  return jwt.verify(token, getRefreshSecret()) as JwtPayload & TokenPayload;
}
