import { z } from 'zod';

export const createKurikulumSchema = z.object({
  tahun: z.coerce.number().int().min(2000).max(2100),
  statusAktif: z.enum(['AKTIF', 'NONAKTIF']).default('AKTIF'),
});

export const updateKurikulumSchema = createKurikulumSchema.partial();
