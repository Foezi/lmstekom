import { signToken } from './src/shared/utils/jwt.js';
import { db } from './src/core/database.js';

async function run() {
  const user = await db.user.findUnique({ where: { username: 'superadmin' } });
  const token = signToken({ id: user.id, role: user.role });
  
  const res = await fetch('http://127.0.0.1:3000/api/materi', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Data length:", data.data?.length);
  if (data.data?.length > 0) {
    console.log("Sample matakuliah:", data.data[0].matakuliah?.namaMk);
  } else {
    console.log("Response:", data);
  }
}
run();
