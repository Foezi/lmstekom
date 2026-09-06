import { Router } from 'express';
import { requireRole } from '../../../shared/middlewares/requireRole.js';
import * as controller from './diskusi.controller.js';

const router = Router();
const ACCESS_ROLES = ['ADMIN', 'ADMIN_AKADEMIK', 'ADMIN_PRODI', 'DOSEN', 'MAHASISWA'];

router.get('/rooms', requireRole(...ACCESS_ROLES), controller.listRooms);
router.post('/rooms', requireRole(...ACCESS_ROLES), controller.createRoom);
router.get('/rooms/:roomId/messages', requireRole(...ACCESS_ROLES), controller.getMessages);
router.post('/rooms/:roomId/members', requireRole(...ACCESS_ROLES), controller.addMembers);
router.delete('/rooms/:roomId/members/:userId', requireRole(...ACCESS_ROLES), controller.removeMember);
router.get('/users', requireRole(...ACCESS_ROLES), controller.getAvailableUsers);
router.get('/kelas', requireRole('DOSEN', 'ADMIN'), controller.getDosenClasses);

export default router;
