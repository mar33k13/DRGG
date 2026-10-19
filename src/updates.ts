import { useEffect, useRef, useState } from 'react';
import { Channel, invoke, isTauri } from '@tauri-apps/api/core';
import { APP_VERSION } from './version';
export type UpdateInfo = {
  version: string;
  revision: string;
  package: string;
  canInstall: boolean;
};
export type UpdateRelease = { version: string; notes: string };
export type UpdateProgress = { downloaded: number; total: number | null };
export type ResumeChoice = {
  conceptId: string | null;
  screen: 'home' | 'wizard' | 'library';
  step: number;
};
export type UpdateResume = { choice: ResumeChoice; updated: boolean; version: string };
export type UpdatePhase =
  'idle' | 'checking' | 'current' | 'available' | 'downloading' | 'ready' | 'installing' | 'error';
export function useUpdates() {
  const desktop = isTauri();
  const [info, setInfo] = useState<UpdateInfo>({
    version: APP_VERSION,
    revision: '',
    package: 'unknown',
    canInstall: false,
  });
  const [phase, setPhase] = useState<UpdatePhase>('idle');
  const [release, setRelease] = useState<UpdateRelease | null>(null);
  const [progress, setProgress] = useState<UpdateProgress>({ downloaded: 0, total: null });
  const [error, setError] = useState('');
  const [retry, setRetry] = useState<'check' | 'download' | 'install'>('check');
  const inFlight = useRef(false);
  useEffect(() => {
    if (desktop)
      void invoke<UpdateInfo>('update_info')
        .then(setInfo)
        .catch(() => setError('info'));
  }, [desktop]);
  const run = async (task: 'check' | 'download' | 'install', action: () => Promise<void>) => {
    if (!desktop || inFlight.current) return;
    inFlight.current = true;
    setError('');
    setRetry(task);
    try {
      await action();
    } catch (reason) {
      setError(String(reason));
      setPhase('error');
    } finally {
      inFlight.current = false;
    }
  };
  const check = () =>
    run('check', async () => {
      setPhase('checking');
      setRelease(null);
      const available = await invoke<UpdateRelease | null>('check_update');
      setRelease(available);
      setPhase(available ? 'available' : 'current');
    });
  const download = () =>
    run('download', async () => {
      if (!release || !info.canInstall) return;
      setPhase('downloading');
      setProgress({ downloaded: 0, total: null });
      const channel = new Channel<UpdateProgress>();
      channel.onmessage = setProgress;
      await invoke('download_update', { progress: channel });
      setPhase('ready');
    });
  const install = (choice: ResumeChoice) =>
    run('install', async () => {
      if (phase !== 'ready' && !(phase === 'error' && retry === 'install')) return;
      setPhase('installing');
      await invoke('install_update', { choice });
      // Native success restarts the process. Keep the interface locked until then.
    });
  const openDownloads = async () => {
    try {
      await invoke('open_update_download');
    } catch {
      setError('open');
    }
  };
  return {
    desktop,
    info,
    phase,
    release,
    progress,
    error,
    retry,
    check,
    download,
    install,
    openDownloads,
  };
}
export type Updater = ReturnType<typeof useUpdates>;
