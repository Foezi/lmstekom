import { db } from './src/core/database.js';

async function checkJadwal() {
  try {
    const count = await db.jadwal.count();
    console.log('Total jadwal:', count);
  } catch (err) {
    console.error(err);
  } finally {
    await db.$disconnect();
  }
}

checkJadwal();
