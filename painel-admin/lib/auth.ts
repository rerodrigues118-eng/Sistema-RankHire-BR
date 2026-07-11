import bcrypt from "bcryptjs";
import { authenticator } from "otplib";

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compareSync(password, hash);
}

export function generateTotpSecret() {
  return authenticator.generateSecret();
}

export function verifyTotpToken(secret: string, token: string) {
  authenticator.options = { window: 1, step: 30 };
  return authenticator.check(token, secret);
}
