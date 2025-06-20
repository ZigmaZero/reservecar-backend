import { readdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const testDir = './dist/tests';

readdirSync(testDir)
  .filter(f => f.endsWith('.test.js'))
  .forEach(f => {
    console.log(`\n==> Running ${f}`);
    execSync(`node --test "${join(testDir, f)}"`, { stdio: 'inherit' });
  });