import { db } from '../../../core/database.js';
import { ApiError } from '../../../shared/utils/apiError.js';

export async function getQuestions(req, res) {
  const materiId = parseInt(req.params.materiId, 10);
  const questions = await db.materiVideoQuestion.findMany({
    where: { materiId },
    orderBy: { timestamp: 'asc' }
  });
  res.json({ data: questions });
}

export async function addQuestion(req, res) {
  const materiId = parseInt(req.params.materiId, 10);
  const { timestamp, pertanyaan, pilihan } = req.body;

  if (req.user.role !== 'DOSEN' && req.user.role !== 'ADMIN') {
    throw ApiError.forbidden('Hanya dosen yang dapat mengelola pertanyaan video');
  }

  const q = await db.materiVideoQuestion.create({
    data: {
      materiId,
      timestamp: parseInt(timestamp, 10),
      pertanyaan,
      pilihan
    }
  });
  res.json({ message: 'Pertanyaan berhasil ditambahkan', data: q });
}

export async function updateQuestion(req, res) {
  const qId = parseInt(req.params.qId, 10);
  const { timestamp, pertanyaan, pilihan } = req.body;

  if (req.user.role !== 'DOSEN' && req.user.role !== 'ADMIN') {
    throw ApiError.forbidden('Hanya dosen yang dapat mengelola pertanyaan video');
  }

  const q = await db.materiVideoQuestion.update({
    where: { id: qId },
    data: {
      timestamp: parseInt(timestamp, 10),
      pertanyaan,
      pilihan
    }
  });
  res.json({ message: 'Pertanyaan berhasil diperbarui', data: q });
}

export async function deleteQuestion(req, res) {
  const qId = parseInt(req.params.qId, 10);

  if (req.user.role !== 'DOSEN' && req.user.role !== 'ADMIN') {
    throw ApiError.forbidden('Hanya dosen yang dapat mengelola pertanyaan video');
  }

  await db.materiVideoQuestion.delete({ where: { id: qId } });
  res.json({ message: 'Pertanyaan berhasil dihapus' });
}

export async function getProgress(req, res) {
  const materiId = parseInt(req.params.materiId, 10);

  // Jika Dosen, kembalikan semua progress mahasiswa
  if (req.user.role === 'DOSEN' || req.user.role === 'ADMIN') {
    const progress = await db.materiVideoProgress.findMany({
      where: { materiId },
      include: {
        mahasiswa: {
          select: { nama: true, nim: true }
        }
      }
    });
    return res.json({ data: progress });
  }

  // Jika Mahasiswa, kembalikan progress dia sendiri
  if (req.user.role === 'MAHASISWA') {
    const progress = await db.materiVideoProgress.findUnique({
      where: {
        materiId_mahasiswaId: {
          materiId,
          mahasiswaId: req.user.mahasiswaId
        }
      }
    });
    return res.json({ data: progress || { completed: false, lastTimestamp: 0 } });
  }

  throw ApiError.forbidden('Akses ditolak');
}

export async function saveProgress(req, res) {
  const materiId = parseInt(req.params.materiId, 10);
  const { completed, lastTimestamp, videoDuration } = req.body;

  if (req.user.role !== 'MAHASISWA') {
    throw ApiError.forbidden('Hanya mahasiswa yang dapat menyimpan progres');
  }

  const progress = await db.materiVideoProgress.upsert({
    where: {
      materiId_mahasiswaId: {
        materiId,
        mahasiswaId: req.user.mahasiswaId
      }
    },
    update: {
      completed: completed !== undefined ? completed : undefined,
      lastTimestamp: lastTimestamp !== undefined ? lastTimestamp : undefined,
      videoDuration: videoDuration !== undefined ? videoDuration : undefined
    },
    create: {
      materiId,
      mahasiswaId: req.user.mahasiswaId,
      completed: completed || false,
      lastTimestamp: lastTimestamp || 0,
      videoDuration: videoDuration || 0
    }
  });

  res.json({ message: 'Progres berhasil disimpan', data: progress });
}
