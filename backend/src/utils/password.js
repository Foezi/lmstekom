import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);

export const comparePassword = (plain, hashed) => bcrypt.compare(plain, hashed);

/** Password default saat data dosen/mahasiswa dibuat/import — wajib diganti login pertama (blueprint §6.0a). */
export const defaultPasswordFor = (username) => `${username}@poltek`;
