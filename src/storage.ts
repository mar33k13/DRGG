import { invoke, isTauri } from '@tauri-apps/api/core';
import { validateConcept, type Concept } from './core';
const KEY = 'drgg.library.v1';
export async function loadLibrary(): Promise<Concept[]> {
  const raw = isTauri() ? await invoke<string | null>('load_library') : localStorage.getItem(KEY);
  if (!raw) return [];
  const data = JSON.parse(raw);
  if (data.version !== 1 || !Array.isArray(data.concepts) || data.concepts.length > 5000)
    throw new Error('Invalid library');
  const concepts = data.concepts.map(validateConcept);
  if (new Set(concepts.map((c: Concept) => c.id)).size !== concepts.length)
    throw new Error('Duplicate concept IDs');
  return concepts;
}
export async function saveLibrary(concepts: Concept[]): Promise<void> {
  const contents = JSON.stringify({ version: 1, concepts });
  if (isTauri()) await invoke('save_library', { contents });
  else localStorage.setItem(KEY, contents);
}
export async function saveExport(contents: string, filename: string): Promise<boolean> {
  if (isTauri()) return invoke<boolean>('save_export', { contents, filename });
  const url = URL.createObjectURL(new Blob([contents], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
export async function openImport(): Promise<string | null> {
  return invoke<string | null>('import_concept');
}
