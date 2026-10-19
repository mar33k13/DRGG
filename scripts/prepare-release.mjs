import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash, createPublicKey, verify } from 'node:crypto';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Minisign Ed25519 + BLAKE2b-512. Verify both payload and trusted version comment.
// Runtime installation independently uses Tauri's verifier.
export function verifyArtifact(bytes, encodedSignature, encodedPublicKey, version) {
  const lines = Buffer.from(encodedSignature.trim(), 'base64').toString().trim().split('\n');
  const keyLines = Buffer.from(encodedPublicKey.trim(), 'base64').toString().trim().split('\n');
  const packet = Buffer.from(lines[1] || '', 'base64');
  const key = Buffer.from(keyLines[1] || '', 'base64');
  if (
    packet.length !== 74 ||
    key.length !== 42 ||
    packet.subarray(0, 2).toString() !== 'ED' ||
    !packet.subarray(2, 10).equals(key.subarray(2, 10))
  )
    throw new Error('Invalid signature format or key');
  const publicKey = createPublicKey({
    key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), key.subarray(10)]),
    format: 'der',
    type: 'spki',
  });
  if (!lines[2]?.startsWith('trusted comment: ')) throw new Error('Missing trusted comment');
  const comment = lines[2].slice(17);
  if (
    !verify(
      null,
      createHash('blake2b512').update(bytes).digest(),
      publicKey,
      packet.subarray(10),
    ) ||
    !verify(
      null,
      Buffer.concat([packet.subarray(10), Buffer.from(comment)]),
      publicKey,
      Buffer.from(lines[3] || '', 'base64'),
    )
  )
    throw new Error('Invalid artifact signature');
  if (!comment.split('\t').includes(`version:${version}`))
    throw new Error('Signed version mismatch');
}
export function assemble(directory, version, publicKey, notes = '') {
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Expected a stable semantic version');
  const macArm = `DRGG_${version}_aarch64.app.tar.gz`,
    macIntel = `DRGG_${version}_x64.app.tar.gz`;
  const exe = `DRGG_${version}_x64-setup.exe`,
    msi = `DRGG_${version}_x64_en-US.msi`,
    appimage = `DRGG_${version}_amd64.AppImage`;
  const required = [
    macArm,
    macIntel,
    exe,
    msi,
    appimage,
    `DRGG_${version}_aarch64.dmg`,
    `DRGG_${version}_x64.dmg`,
    `DRGG_${version}_amd64.deb`,
    `DRGG-${version}-1.x86_64.rpm`,
  ];
  const signed = [macArm, macIntel, exe, msi, appimage];
  for (const filename of required)
    if (!readFileSync(join(directory, filename)).length)
      throw new Error(`Empty package: ${filename}`);
  const entries = {};
  for (const filename of signed) {
    const signature = readFileSync(join(directory, `${filename}.sig`), 'utf8').trim();
    verifyArtifact(readFileSync(join(directory, filename)), signature, publicKey, version);
    entries[filename] = {
      signature,
      url: `https://github.com/mar33k13/DRGG/releases/download/v${version}/${filename}`,
    };
  }
  // Each installer keeps its own format. Canonical targets provide metadata for manual installs.
  const manifest = {
    version,
    notes,
    pub_date: new Date().toISOString(),
    platforms: {
      'darwin-aarch64': entries[macArm],
      'darwin-x86_64': entries[macIntel],
      'windows-x86_64-nsis': entries[exe],
      'windows-x86_64-msi': entries[msi],
      'windows-x86_64': entries[exe],
      'linux-x86_64-appimage': entries[appimage],
      'linux-x86_64': entries[appimage],
    },
  };
  writeFileSync(join(directory, 'latest.json'), JSON.stringify(manifest, null, 2) + '\n');
  const files = readdirSync(directory)
    .filter((n) => n !== 'drgg-SHA256SUMS.txt')
    .sort();
  for (const name of files.filter((n) => n.endsWith('.sig')))
    verifyArtifact(
      readFileSync(join(directory, name.slice(0, -4))),
      readFileSync(join(directory, name), 'utf8'),
      publicKey,
      version,
    );
  writeFileSync(
    join(directory, 'drgg-SHA256SUMS.txt'),
    files
      .map(
        (name) =>
          `${createHash('sha256')
            .update(readFileSync(join(directory, name)))
            .digest('hex')}  ${name}`,
      )
      .join('\n') + '\n',
  );
  return manifest;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const version = JSON.parse(readFileSync('package.json')).version;
  const config = JSON.parse(readFileSync('src-tauri/tauri.conf.json'));
  if (config.version !== version) throw new Error('Versions differ');
  const notes = readFileSync(`docs/releases/${version}.md`, 'utf8');
  assemble(process.argv[2], version, config.plugins.updater.pubkey, notes);
  console.log(`Verified complete DRGG ${version} release, signatures and update manifest.`);
}
