import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { APP_INFO, formatBuildTime } from '../src/core/appInfo';

describe('alkalmazás-infó', () => {
  it('a verzió a package.json-ból jön, a build ideje érvényes és friss', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8')) as { version: string };
    expect(APP_INFO.version).toBe(pkg.version);
    expect(APP_INFO.builtAt.getTime()).not.toBeNaN();
    expect(Date.now() - APP_INFO.builtAt.getTime()).toBeLessThan(60 * 60 * 1000);
    expect(APP_INFO.developer).toBe('Iványi Álmos');
  });

  it('a build ideje magyar formátumban, érvénytelen dátumnál „ismeretlen”', () => {
    const text = formatBuildTime(new Date('2026-09-16T07:12:00Z'), 'hu-HU');
    expect(text).toMatch(/2026/);
    expect(text).toMatch(/szept/);
    expect(formatBuildTime(new Date('nem dátum'))).toBe('ismeretlen');
  });
});
