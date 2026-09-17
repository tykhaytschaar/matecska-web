/** Az alkalmazás adatai az Infó képernyőhöz. A verzió és a build ideje fordításkor kerül be. */
export interface AppInfo {
  name: string;
  version: string;
  /** A build pillanata. */
  builtAt: Date;
  developer: string;
}

/** Kapcsolat a Segítség képernyőn. TODO: valódi cím. */
export const SUPPORT_EMAIL = 'hello@matecska.hu';
/** Önkéntes támogatás Ko-fin (csak a webes változatban). */
export const KOFI_USER = 'almosivanyi';
export const KOFI_URL = `https://ko-fi.com/${KOFI_USER}`;
/** A Ko-fi beágyazott panelje a Támogatás képernyőn. */
export const KOFI_EMBED_URL = `https://ko-fi.com/${KOFI_USER}/?hidefeed=true&widget=true&embed=true&preview=true`;
/** Az app weboldala; a natív appban semlegesen, támogatásra utalás nélkül szerepel. */
export const WEBSITE_URL = 'https://tykhaytschaar.github.io/matecska-web/';
/** Teljes adatkezelési tájékoztató: statikus oldal a webes kiadásban (web/public/adatvedelem). */
export const PRIVACY_POLICY_URL = 'https://tykhaytschaar.github.io/matecska-web/adatvedelem/';

export const APP_INFO: AppInfo = {
  name: 'Matecska',
  version: __APP_VERSION__,
  builtAt: new Date(__BUILD_TIME__),
  developer: 'Iványi Álmos',
};

/** Magyar formátumú dátum és idő, a néző időzónájában, pl. „2026. szept. 16. 9:12”. */
export function formatBuildTime(date: Date, locale = 'hu-HU'): string {
  if (Number.isNaN(date.getTime())) return 'ismeretlen';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
