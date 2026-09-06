import jwt from 'jsonwebtoken';
import { env } from '../../core/env.js';

export const signToken = (payload) => jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export const verifyToken = (token) => jwt.verify(token, env.jwtSecret);
