import * as bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Async on purpose: the previous `hashSync`/`compareSync` pair blocked the
 * event loop for the full duration of every login and registration.
 */
export const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, SALT_ROUNDS);

export const comparePassword = (password: string, hash: string): Promise<boolean> =>
  bcrypt.compare(password, hash);
