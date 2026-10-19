import { readdirSync, mkdirSync, copyFileSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';
const [source, destination, arch] = process.argv.slice(2);
if (!source || !destination) throw new Error('Usage: stage-packages source destination [mac arch]');
mkdirSync(destination, { recursive: true });
function visit(dir) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    if (item.isDirectory()) {
      if (!item.name.endsWith('.app')) visit(path);
      continue;
    }
    if (!/\.(dmg|exe|msi|deb|rpm|AppImage|app\.tar\.gz)(\.sig)?$/.test(item.name)) continue;
    let name = basename(path);
    if (name.startsWith('DRGG.app.tar.gz')) {
      if (!['aarch64', 'x64'].includes(arch)) throw new Error('Missing Mac architecture');
      const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
      name = name.replace('DRGG.app', `DRGG_${version}_${arch}.app`);
    }
    copyFileSync(path, join(destination, name));
  }
}
visit(source);
