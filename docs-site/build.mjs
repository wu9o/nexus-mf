import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const command = process.platform === 'win32' ? 'cogita.cmd' : 'cogita';
const result = spawnSync(command, ['build'], { cwd: root, stdio: 'inherit' });

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const index = resolve(root, 'doc_build/index.html');
if (!existsSync(index)) {
  throw new Error(`Missing generated handbook index: ${index}`);
}
