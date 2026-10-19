// Generate a bundled collection of the actual package/crate license files.
// Run cargo fetch --locked first, with the same CARGO_HOME used for the build.
import { readFileSync, readdirSync, existsSync, writeFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
const root = process.cwd(),
  groups = new Map(),
  missing = [],
  seen = new Set();
function collect(directory, name) {
  const names = readdirSync(directory).filter((n) =>
    /^(licen[sc]e|copying|notice|copyright)([.-]|$)/i.test(n),
  );
  let found = false;
  for (const filename of names) {
    try {
      const text = readFileSync(join(directory, filename), 'utf8').trim();
      if (!text) continue;
      const packages = groups.get(text) || new Set();
      packages.add(name);
      groups.set(text, packages);
      found = true;
    } catch {}
  }
  return found;
}
function visitJS(name, from) {
  const req = createRequire(join(from, 'package.json'));
  let entry;
  try {
    entry = req.resolve(`${name}/package.json`);
  } catch {
    entry = req.resolve(name);
    while (!existsSync(join(dirname(entry), 'package.json'))) entry = dirname(entry);
    entry = join(dirname(entry), 'package.json');
  }
  const directory = realpathSync(dirname(entry));
  if (seen.has(directory)) return;
  seen.add(directory);
  const pkg = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
  if (!collect(directory, `${pkg.name}@${pkg.version} (${pkg.license || 'see package'})`))
    missing.push(`${pkg.name}@${pkg.version}`);
  for (const dependency of Object.keys(pkg.dependencies || {})) visitJS(dependency, directory);
}
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
for (const name of Object.keys(pkg.dependencies)) visitJS(name, root);
const cargoHome = process.env.CARGO_HOME || join(homedir(), '.cargo');
const registry = join(cargoHome, 'registry', 'src');
const sources = existsSync(registry) ? readdirSync(registry).map((n) => join(registry, n)) : [];
const lock = readFileSync('src-tauri/Cargo.lock', 'utf8').split('[[package]]').slice(1);
for (const section of lock) {
  if (!section.includes('source = "registry+')) continue;
  const name = section.match(/^name = "([^"]+)"/m)?.[1],
    version = section.match(/^version = "([^"]+)"/m)?.[1];
  const directory = sources.map((p) => join(p, `${name}-${version}`)).find(existsSync);
  if (!directory) {
    missing.push(`${name}@${version} (source not fetched)`);
    continue;
  }
  const manifest = readFileSync(join(directory, 'Cargo.toml'), 'utf8');
  const license = manifest.match(/^license = "([^"]+)"/m)?.[1] || 'see crate manifest';
  if (!collect(directory, `${name}@${version} (${license})`)) {
    // Some crates keep license files under a licenses/ directory.
    const sub = join(directory, 'licenses');
    let found = false;
    if (existsSync(sub)) {
      for (const filename of readdirSync(sub)) {
        try {
          const text = readFileSync(join(sub, filename), 'utf8').trim();
          const packages = groups.get(text) || new Set();
          packages.add(`${name}@${version} (${license})`);
          groups.set(text, packages);
          found = true;
        } catch {}
      }
    }
    if (!found) missing.push(`${name}@${version} (${license}; no standalone license file)`);
  }
}
const header =
  'DRGG — third-party dependency notices\nDependencies retain their own licenses. This collection is generated from installed package and fetched crate sources, including platform-specific and build dependencies.\n';
let output = header;
for (const [text, names] of groups)
  output += `\n${'='.repeat(72)}\n${[...names].sort().join('\n')}\n${'-'.repeat(72)}\n${text}\n`;
if (missing.length)
  output += `\n${'='.repeat(72)}\nPackages without standalone license files (consult the corresponding source package):\n${missing.sort().join('\n')}\n`;
writeFileSync('src/data/third-party-notices.txt', output);
console.log(
  `Collected ${groups.size} unique notice texts; ${missing.length} packages need source-manifest references.`,
);
if (missing.length) console.log(missing.join('\n'));
