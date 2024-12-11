import runSettings from '../modules/components/dynamic-settings';
// import { HOME_WEBSITE } from '../modules/constants';
import { getOptions } from '../modules/hooks/useOptions';
import baseURL from '../modules/utils/baseURL';

export const isInstallSettings = false;

export async function InstallSettingsEntryPoint(): Promise<void> {
  const root = document.getElementById('tfc-settings') as ParentNode;
  const settingsRoot = document.createElement('div');
  root.replaceChildren(settingsRoot);
  runSettings(settingsRoot, await getOptions());
}
