import { asyncHandler } from '../../shared/utils/apiError.js';
import * as mkService from './matakuliah.service.js';

export const getAllMatakuliah = asyncHandler(async (req, res) => {
  const data = await mkService.findAll(req.user);
  res.json({ data });
});

export const getMatakuliahById = asyncHandler(async (req, res) => {
  const data = await mkService.findById(Number(req.params.id), req.user);
  res.json({ data });
});

export const createMatakuliah = asyncHandler(async (req, res) => {
  const data = await mkService.create(req.body, req.user);
  res.status(201).json({ data, message: 'Mata Kuliah berhasil ditambahkan' });
});

export const updateMatakuliah = asyncHandler(async (req, res) => {
  const data = await mkService.update(Number(req.params.id), req.body, req.user);
  res.json({ data, message: 'Mata Kuliah berhasil diperbarui' });
});

export const deleteMatakuliah = asyncHandler(async (req, res) => {
  await mkService.remove(Number(req.params.id), req.user);
  res.json({ message: 'Mata Kuliah berhasil dihapus' });
});
