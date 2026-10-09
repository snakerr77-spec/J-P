import { sha256Hex } from './crypto';

export function generateOtpCode(): string {
  const value = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return String(value).padStart(6, '0');
}

export function hashOtpCode(code: string): Promise<string> {
  return sha256Hex(code);
}
