import { z } from 'zod';

export const createMatakuliahSchema = z.object({
  prodiId: z.coerce.number().int().positive({ message: 'Program studi wajib dipilih' }),
  tahunKurikulumId: z.coerce.number().int().positive().nullish(),
  kodeMk: z.string().min(1).max(30),
  namaMk: z.string().min(3).max(120),
  sks: z.coerce.number().int().min(1).max(6),
  semester: z.coerce.number().int().min(1).max(8).default(1),
});

export const updateMatakuliahSchema = createMatakuliahSchema.partial();
