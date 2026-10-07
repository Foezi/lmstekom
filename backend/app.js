import fs from 'fs';

process.on('uncaughtException', (err) => {
  fs.writeFileSync('crash.log', err.stack || err.toString());
  process.exit(1);
});

import('./src/server.js').catch(err => {
  fs.writeFileSync('crash.log', err.stack || err.toString());
  process.exit(1);
});
