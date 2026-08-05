const { spawn } = require('child_process');

const children = [];

function start(name, cmd, args, opts) {
  const child = spawn(cmd, args, { stdio: 'inherit', shell: true, ...opts });
  child.on('exit', (code) => {
    if (!process.exitCode) process.exitCode = code || 0;
  });
  children.push(child);
  return child;
}

start('dev-api', 'node', ['scripts/dev-api.cjs']);
start('vite', 'node', ['node_modules/vite/bin/vite.js']);

const shutdown = () => {
  children.forEach((c) => { try { c.kill(); } catch {} });
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);