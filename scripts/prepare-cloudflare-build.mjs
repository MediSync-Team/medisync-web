import { existsSync, mkdirSync, renameSync } from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const trashDir = path.join(projectRoot, '.build-trash');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const generatedDirs = ['.open-next', '.next'];

function uniqueDestination(name) {
  const baseName = `${name}-${timestamp}`;
  let candidate = path.join(trashDir, baseName);
  let suffix = 1;

  while (existsSync(candidate)) {
    candidate = path.join(trashDir, `${baseName}-${suffix}`);
    suffix += 1;
  }

  return candidate;
}

mkdirSync(trashDir, { recursive: true });

let moved = 0;

for (const dir of generatedDirs) {
  const source = path.join(projectRoot, dir);

  if (!existsSync(source)) {
    continue;
  }

  const destination = uniqueDestination(dir);
  renameSync(source, destination);
  moved += 1;
  console.log(`[clean:cf] Moved ${dir} to ${path.relative(projectRoot, destination)}`);
}

if (moved === 0) {
  console.log('[clean:cf] No Cloudflare/Next build folders to move.');
} else {
  console.log('[clean:cf] Build folders were moved aside. You can delete .build-trash later when no dev/deploy process is running.');
}
