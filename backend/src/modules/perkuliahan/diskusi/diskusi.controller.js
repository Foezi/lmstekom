import { db } from '../../../core/database.js';
import { asyncHandler, ApiError } from '../../../shared/utils/apiError.js';
import { logActivity } from '../../../shared/utils/activityLog.js';

const ip = (req) => req.ip || req.socket?.remoteAddress || null;

// 1. Ambil daftar room chat untuk user yang sedang login
export const listRooms = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const rooms = await db.chatRoom.findMany({
    where: { members: { some: { userId } } },
    include: {
      members: { include: { user: { include: { dosen: true, mahasiswa: true, prodiKelola: true } } } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ data: rooms });
});

// 2. Ambil riwayat chat berdasarkan roomId
export const getMessages = asyncHandler(async (req, res) => {
  const roomId = parseInt(req.params.roomId, 10);
  const userId = req.user.id;

  const member = await db.chatMember.findUnique({
    where: { roomId_userId: { roomId, userId } }
  });
  if (!member) throw ApiError.forbidden('Anda bukan anggota dari diskusi ini');

  const messages = await db.chatMessage.findMany({
    where: { roomId },
    include: { sender: { include: { dosen: true, mahasiswa: true } } },
    orderBy: { createdAt: 'asc' }
  });

  res.json({ data: messages });
});

// 3. Buat Room Chat Baru
export const createRoom = asyncHandler(async (req, res) => {
  const { type, name, targetUserIds, kelasId } = req.body;
  const userId = req.user.id;

  if (type === 'CLASS') {
    if (req.user.role !== 'DOSEN' && req.user.role !== 'ADMIN') {
      throw ApiError.forbidden('Hanya Dosen atau Admin yang bisa membuat grup Kelas');
    }
    
    // Cari semua mahasiswa di kelas ini
    const mahasiswas = await db.user.findMany({
      where: { mahasiswa: { kelasId: parseInt(kelasId) } }
    });
    
    const kelas = await db.kelas.findUnique({ where: { id: parseInt(kelasId) } });
    
    const allMembers = [userId, ...mahasiswas.map(m => m.id)];
    const room = await db.chatRoom.create({
      data: {
        type: 'CLASS',
        name: `Kelas ${kelas?.namaKelas || 'Unknown'}`,
        createdBy: userId,
        members: {
          create: allMembers.map(id => ({
            userId: id,
            role: id === userId ? 'ADMIN' : 'MEMBER'
          }))
        }
      },
      });
    
    await logActivity({ userId: req.user.id, aktivitas: `BUAT_RUANG_DISKUSI Kelas ${kelasId}`, modul: 'DISKUSI', ipAddress: ip(req) });
    return res.json({ data: room });
  }

  if (!targetUserIds || targetUserIds.length === 0) {
    throw ApiError.badRequest('Minimal harus ada 1 orang yang diajak diskusi');
  }

  if (type === 'GROUP') {
    if (req.user.role === 'MAHASISWA') {
      throw ApiError.forbidden('Mahasiswa tidak diizinkan membuat grup diskusi');
    }
    if (!name) throw ApiError.badRequest('Nama grup harus diisi');

    const allMembers = [userId, ...targetUserIds];
    const room = await db.chatRoom.create({
      data: {
        type: 'GROUP',
        name,
        createdBy: userId,
        members: {
          create: allMembers.map(id => ({
            userId: id,
            role: id === userId ? 'ADMIN' : 'MEMBER'
          }))
        }
      },
      });
    
    await logActivity({ userId: req.user.id, aktivitas: `BUAT_RUANG_DISKUSI Grup ${name}`, modul: 'DISKUSI', ipAddress: ip(req) });
    return res.json({ data: room });
  }

  // PERSONAL Chat (Hanya 1 on 1)
  const targetId = targetUserIds[0];
  if (targetId === userId) throw ApiError.badRequest('Tidak bisa chat dengan diri sendiri');

  // Cari apakah chat room personal sudah ada
  const existingRooms = await db.chatRoom.findMany({
    where: {
      type: 'PERSONAL',
      AND: [
        { members: { some: { userId } } },
        { members: { some: { userId: targetId } } }
      ]
    },
    include: { members: true }
  });

  const existingRoom = existingRooms.find(r => r.members.length === 2);
  if (existingRoom) {
    return res.json({ data: existingRoom });
  }

  // Buat chat personal baru
  const room = await db.chatRoom.create({
    data: {
      type: 'PERSONAL',
      members: {
        create: [
          { userId, role: 'MEMBER' },
          { userId: targetId, role: 'MEMBER' }
        ]
      }
    },
    include: { members: { include: { user: { include: { dosen: true, mahasiswa: true } } } } }
  });

  await logActivity({ userId: req.user.id, aktivitas: `BUAT_RUANG_DISKUSI Personal dg User ${targetId}`, modul: 'DISKUSI', ipAddress: ip(req) });
  res.json({ data: room });
});

// 4. Ambil daftar user untuk diajak chat (Mahasiswa & Dosen)
export const getAvailableUsers = asyncHandler(async (req, res) => {
  const users = await db.user.findMany({
    where: { id: { not: req.user.id } },
    include: { dosen: true, mahasiswa: true, prodiKelola: true }
  });
  res.json({ data: users });
});

// 5. Ambil daftar kelas yang diajar oleh dosen
export const getDosenClasses = asyncHandler(async (req, res) => {
  const user = await db.user.findUnique({ where: { id: req.user.id }, include: { dosen: true } });
  
  if (!user || !user.dosenId) {
    return res.json({ data: [] });
  }

  // Cari kelas yang terhubung dengan jadwal dosen ini
  const jadwals = await db.jadwal.findMany({
    where: { dosenId: user.dosenId },
    include: { kelas: true }
  });

  // Filter unique kelas
  const uniqueKelas = [];
  const map = new Map();
  for (const j of jadwals) {
    if (!map.has(j.kelasId)) {
      map.set(j.kelasId, true);
      uniqueKelas.push(j.kelas);
    }
  }

  res.json({ data: uniqueKelas });
});

// 6. Tambahkan anggota baru ke dalam Grup (Hanya untuk tipe GROUP dan dilakukan oleh ADMIN)
export const addMembers = asyncHandler(async (req, res) => {
  const roomId = parseInt(req.params.roomId, 10);
  const { newMemberIds } = req.body;
  
  if (!newMemberIds || !Array.isArray(newMemberIds) || newMemberIds.length === 0) {
    throw ApiError.badRequest('newMemberIds wajib diisi berupa array');
  }

  // Validasi apakah room ada
  const room = await db.chatRoom.findUnique({
    where: { id: roomId },
    include: { members: true }
  });

  if (!room) throw ApiError.notFound('Ruang obrolan tidak ditemukan');

  // Pastikan user saat ini adalah admin
  const isUserAdmin = room.members.find(m => m.userId === req.user.id && m.role === 'ADMIN');
  if (!isUserAdmin) {
    throw ApiError.forbidden('Hanya admin yang dapat menambahkan anggota baru');
  }

  // Filter ID yang belum join
  const existingIds = room.members.map(m => m.userId);
  const validNewIds = newMemberIds.filter(id => !existingIds.includes(id));

  if (validNewIds.length > 0) {
    await db.chatMember.createMany({
      data: validNewIds.map(userId => ({
        roomId,
        userId,
        role: 'MEMBER'
      }))
    });
  }

  const updatedRoom = await db.chatRoom.findUnique({
    where: { id: roomId },
    include: {
      members: {
        include: {
          user: { select: { id: true, username: true, role: true, dosen: { select: { nama: true } }, mahasiswa: { select: { nama: true } }, prodiKelola: { select: { namaProdi: true } } } }
        }
      }
    }
  });

  await logActivity({ userId: req.user.id, aktivitas: `TAMBAH_ANGGOTA_DISKUSI Room ${roomId}`, modul: 'DISKUSI', ipAddress: ip(req) });
  res.json({ data: updatedRoom });
});

export const removeMember = asyncHandler(async (req, res) => {
  const roomId = parseInt(req.params.roomId, 10);
  const targetUserId = parseInt(req.params.userId, 10);

  const room = await db.chatRoom.findUnique({
    where: { id: roomId },
    include: { members: true }
  });

  if (!room) throw ApiError.notFound('Ruang obrolan tidak ditemukan');

  // Hanya bisa dari custom GROUP
  if (room.type !== 'GROUP') {
    throw ApiError.badRequest('Hanya bisa mengeluarkan anggota dari grup custom');
  }

  // Pastikan user yang meminta adalah admin
  const isUserAdmin = room.members.find(m => m.userId === req.user.id && m.role === 'ADMIN');
  if (!isUserAdmin) {
    throw ApiError.forbidden('Hanya admin yang dapat mengeluarkan anggota');
  }

  // Tidak boleh hapus diri sendiri (atau harus pakai leave group kalau mau)
  if (targetUserId === req.user.id) {
    throw ApiError.badRequest('Tidak bisa menghapus diri sendiri melalui fitur ini');
  }

  // Pastikan target ada di dalam grup
  const isTargetMember = room.members.find(m => m.userId === targetUserId);
  if (!isTargetMember) {
    throw ApiError.badRequest('Pengguna tersebut bukan anggota grup ini');
  }

  // Hapus anggota
  await db.chatMember.delete({
    where: {
      roomId_userId: {
        roomId,
        userId: targetUserId
      }
    }
  });

  const updatedRoom = await db.chatRoom.findUnique({
    where: { id: roomId },
    include: {
      members: {
        include: {
          user: { select: { id: true, username: true, role: true, dosen: { select: { nama: true } }, mahasiswa: { select: { nama: true } }, prodiKelola: { select: { namaProdi: true } } } }
        }
      }
    }
  });

  await logActivity({ userId: req.user.id, aktivitas: `HAPUS_ANGGOTA_DISKUSI Room ${roomId} User ${targetUserId}`, modul: 'DISKUSI', ipAddress: ip(req) });
  res.json({ data: updatedRoom });
});
