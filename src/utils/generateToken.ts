import { randomUUID } from 'crypto';

export function generateToken() {
  return randomUUID().replace(/-/g, '');
}
