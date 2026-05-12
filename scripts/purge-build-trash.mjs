import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const trashDir = path.join(projectRoot, '.build-trash');
const dryRun = process.argv.includes('--dry-run');

function relative(filePath) {
  return path.relative(projectRoot, filePath) || '.';
}

function assertInsideTrash(entryPath) {
  const resolvedTrash = path.resolve(trashDir);
  const resolvedEntry = path.resolve(entryPath);
  const relativePath = path.relative(resolvedTrash, resolvedEntry);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`[purge:build-trash] Refusing to delete outside ${relative(trashDir)}: ${entryPath}`);
  }
}

if (!existsSync(trashDir)) {
  console.log('[purge:build-trash] .build-trash does not exist. Nothing to purge.');
  process.exit(0);
}

const entries = readdirSync(trashDir, { withFileTypes: true });

if (entries.length === 0) {
  console.log('[purge:build-trash] .build-trash is already empty.');
  process.exit(0);
}

console.log(`[purge:build-trash] ${dryRun ? 'Would purge' : 'Purging'} ${entries.length} top-level entr${entries.length === 1 ? 'y' : 'ies'} from .build-trash.`);

for (const entry of entries) {
  const entryPath = path.join(trashDir, entry.name);
  assertInsideTrash(entryPath);

  if (dryRun) {
    console.log(`[purge:build-trash] Would delete ${relative(entryPath)}`);
    continue;
  }

  console.log(`[purge:build-trash] Deleting ${relative(entryPath)} ...`);
  rmSync(entryPath, {
    recursive: true,
    force: true,
    maxRetries: 3,
    retryDelay: 250,
  });
  console.log(`[purge:build-trash] Deleted ${relative(entryPath)}`);
}

if (!dryRun) {
  mkdirSync(trashDir, { recursive: true });
  console.log('[purge:build-trash] Done. .build-trash is empty.');
}
