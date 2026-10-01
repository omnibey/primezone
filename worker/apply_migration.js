const { spawn } = require('child_process');
const p = spawn('npx.cmd', ['wrangler', 'd1', 'migrations', 'apply', 'primezone-db', '--local'], { stdio: ['pipe', 'inherit', 'inherit'] });
p.stdin.write('y\n');
p.stdin.end();
