// Loaded only by Playwright's HTML route, never imported by the application.
import { mockIPC, mockWindows } from '@tauri-apps/api/mocks';
type Mock = {
  calls: string[];
  checkError: string;
  downloadError: string;
  saveError: boolean;
  manual: boolean;
  current: boolean;
  resume: unknown;
  installed: unknown;
  finish?: () => void;
};
declare global {
  interface Window {
    updateMock: Mock;
    updateMockConfig?: Partial<Mock>;
    isTauri: boolean;
  }
}
window.isTauri = true;
const state = (window.updateMock = {
  calls: [],
  checkError: '',
  downloadError: '',
  saveError: false,
  manual: false,
  current: false,
  resume: null,
  installed: null,
  ...window.updateMockConfig,
} as Mock);
mockWindows('main');
mockIPC(
  async (command, args) => {
    state.calls.push(command);
    if (command === 'update_info')
      return {
        version: '0.2.0',
        revision: 'test1234',
        package: state.manual ? 'deb' : 'app',
        canInstall: !state.manual,
      };
    if (command === 'load_library') return localStorage.getItem('drgg.library.v1');
    if (command === 'save_library') {
      if (state.saveError) throw 'storage';
      localStorage.setItem('drgg.library.v1', (args as { contents: string }).contents);
      return;
    }
    if (command === 'take_update_resume') {
      const r = state.resume;
      state.resume = null;
      return r;
    }
    if (command === 'check_update') {
      if (state.checkError) throw state.checkError;
      return state.current
        ? null
        : { version: '0.2.1', notes: '<b>Notas seguras</b>\nNueva versión de prueba.' };
    }
    if (command === 'download_update') {
      const { progress } = args as {
        progress: { onmessage: (value: { downloaded: number; total: number | null }) => void };
      };
      progress.onmessage({ downloaded: 512, total: 1024 });
      await new Promise<void>((resolve) => {
        state.finish = resolve;
      });
      if (state.downloadError) throw state.downloadError;
      return;
    }
    if (command === 'install_update') {
      state.installed = args;
      throw 'install';
    }
    return null;
  },
  { shouldMockEvents: true },
);
await import('../../src/main');
