export { AboutSettings } from './AboutSettings';

import { AboutSettings } from './AboutSettings';

export const aboutSettings = new AboutSettings();

export async function getAboutSettings(): Promise<AboutSettings> {
  return aboutSettings;
}
