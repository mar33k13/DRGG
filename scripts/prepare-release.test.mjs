import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createHash, sign, randomBytes } from 'node:crypto';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assemble, verifyArtifact } from './prepare-release.mjs';
const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const keyId = randomBytes(8);
const pub = Buffer.from(
  `untrusted comment: test\n${Buffer.concat([Buffer.from('Ed'), keyId, publicKey.export({ format: 'der', type: 'spki' }).subarray(-32)]).toString('base64')}\n`,
).toString('base64');
function signature(data, version = '0.2.0') {
  const sig = sign(null, createHash('blake2b512').update(data).digest(), privateKey);
  const comment = `timestamp:1\tfile:test\tversion:${version}`;
  const global = sign(null, Buffer.concat([sig, Buffer.from(comment)]), privateKey);
  return Buffer.from(
    `untrusted comment: test\n${Buffer.concat([Buffer.from('ED'), keyId, sig]).toString('base64')}\ntrusted comment: ${comment}\n${global.toString('base64')}\n`,
  ).toString('base64');
}
test('release verification rejects altered payloads, comments, versions and keys', () => {
  const data = Buffer.from('original');
  const sig = signature(data);
  verifyArtifact(data, sig, pub, '0.2.0');
  assert.throws(() => verifyArtifact(Buffer.from('tampered'), sig, pub, '0.2.0'));
  assert.throws(() => verifyArtifact(data, sig, pub, '0.2.1'), /version/);
  const modified = Buffer.from(
    Buffer.from(sig, 'base64').toString().replace('version:0.2.0', 'version:0.2.1'),
  ).toString('base64');
  assert.throws(() => verifyArtifact(data, modified, pub, '0.2.1'), /signature/);
  assert.throws(() => verifyArtifact(data, sig, 'invalid', '0.2.0'));
});
test('release assembly requires every platform and keeps MSI/NSIS distinct', () => {
  const dir = mkdtempSync(join(tmpdir(), 'drgg-release-'));
  try {
    assert.throws(() => assemble(dir, '0.2.0', pub));
    const signed = [
      'DRGG_0.2.0_aarch64.app.tar.gz',
      'DRGG_0.2.0_x64.app.tar.gz',
      'DRGG_0.2.0_x64-setup.exe',
      'DRGG_0.2.0_x64_en-US.msi',
      'DRGG_0.2.0_amd64.AppImage',
    ];
    for (const name of [
      ...signed,
      'DRGG_0.2.0_aarch64.dmg',
      'DRGG_0.2.0_x64.dmg',
      'DRGG_0.2.0_amd64.deb',
      'DRGG-0.2.0-1.x86_64.rpm',
    ]) {
      const data = Buffer.from(name);
      writeFileSync(join(dir, name), data);
      if (signed.includes(name)) writeFileSync(join(dir, `${name}.sig`), signature(data));
    }
    const manifest = assemble(dir, '0.2.0', pub);
    assert.match(manifest.platforms['windows-x86_64-msi'].url, /\.msi$/);
    assert.match(manifest.platforms['windows-x86_64-nsis'].url, /\.exe$/);
    assert.equal(Object.keys(manifest.platforms).length, 7);
    assert.match(readFileSync(join(dir, 'drgg-SHA256SUMS.txt'), 'utf8'), /latest.json/);
    rmSync(join(dir, signed[0]));
    assert.throws(() => assemble(dir, '0.2.0', pub));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
