import { z } from 'zod';
import { ApiError } from '../utils/apiError.js';

/** Validasi body dengan skema zod; hasil parse di-set ke req.body. */
export const validateBody =
  (schema) =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((iss) => ({
        field: iss.path.join('.') || '(root)',
        pesan: iss.message,
      }));
      return next(ApiError.badRequest('Data tidak valid', { details }));
    }
    req.body = result.data;
    next();
  };

export { ApiError };
