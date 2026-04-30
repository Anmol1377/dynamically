import 'server-only';
import { hash, verify } from '@node-rs/argon2';

const ARGON2_OPTS = {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, ARGON2_OPTS);
}

export async function verifyPassword(stored: string, plain: string): Promise<boolean> {
  try {
    return await verify(stored, plain, ARGON2_OPTS);
  } catch {
    return false;
  }
}
