import { asyncHandler } from '../../shared/utils/apiError.js';
import * as kurikulumService from './kurikulum.service.js';

export const getAllKurikulum = asyncHandler(async (req, res) => {
  const data = await kurikulumService.findAll();
  res.json({ data });
});

export const getKurikulumById = asyncHandler(async (req, res) => {
  const data = await kurikulumService.findById(Number(req.params.id));
  res.json({ data });
});

export const createKurikulum = asyncHandler(async (req, res) => {
  const data = await kurikulumService.create(req.body);
  res.status(201).json({ data, message: 'Tahun kurikulum berhasil ditambahkan' });
});

export const updateKurikulum = asyncHandler(async (req, res) => {
  const data = await kurikulumService.update(Number(req.params.id), req.body);
  res.json({ data, message: 'Tahun kurikulum berhasil diperbarui' });
});

export const deleteKurikulum = asyncHandler(async (req, res) => {
  await kurikulumService.remove(Number(req.params.id));
  res.json({ message: 'Tahun kurikulum berhasil dihapus' });
});
