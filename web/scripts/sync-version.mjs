// A package.json verzióját átírja az Xcode-projekt MARKETING_VERSION beállításába,
// hogy az Infó képernyő és az App Store verziója ugyanaz legyen. Az ios:sync futtatja.
import { readFileSync, writeFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));
const pbxproj = new URL('../ios/App/App.xcodeproj/project.pbxproj', import.meta.url);
const before = readFileSync(pbxproj, 'utf-8');
const after = before.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`);
if (after !== before) {
  writeFileSync(pbxproj, after);
  console.log(`[sync-version] MARKETING_VERSION = ${version}`);
} else {
  console.log(`[sync-version] már ${version}`);
}
