import { INSTANT_TIMING, PATIENT_TIMING, QUICK_TIMING, type BonusTiming } from './scoring';

/** A fő kategóriák: a négy alapművelet. Az azonosítók megegyeznek a profil JSON-kulcsaival. */
export type MathOperation = 'addition' | 'subtraction' | 'multiplication' | 'division';

export const OPERATIONS: readonly MathOperation[] = ['addition', 'subtraction', 'multiplication', 'division'];

export interface OperationInfo {
  title: string;
  /** Magyar iskolai jelölés: a szorzás pont, az osztás kettőspont. */
  symbol: string;
}

export const OPERATION_INFO: Record<MathOperation, OperationInfo> = {
  addition: { title: 'Összeadás', symbol: '+' },
  subtraction: { title: 'Kivonás', symbol: '−' },
  multiplication: { title: 'Szorzás', symbol: '·' },
  division: { title: 'Osztás', symbol: ':' },
};

export function isMathOperation(value: unknown): value is MathOperation {
  return typeof value === 'string' && (OPERATIONS as readonly string[]).includes(value);
}

/**
 * Alkategóriák: egy műveleten belül a konkrét gyakorlástípus. A „written” a háromjegyű,
 * füzetszerű feladat, a „double” a kétjegyű, a „single” és „table” az egyjegyű, fejben számolós.
 */
export type PracticeMode =
  | 'addition-single'
  | 'addition-double'
  | 'addition-written'
  | 'subtraction-single'
  | 'subtraction-double'
  | 'subtraction-written'
  | 'multiplication-table'
  | 'multiplication-written'
  | 'division-table'
  | 'division-written';

export const PRACTICE_MODES: readonly PracticeMode[] = [
  'addition-single',
  'addition-double',
  'addition-written',
  'subtraction-single',
  'subtraction-double',
  'subtraction-written',
  'multiplication-table',
  'multiplication-written',
  'division-table',
  'division-written',
];

/** A feladat elrendezése a képernyőn. */
export type ProblemLayout =
  /** Két operandus egymás alatt, vonal, alatta a rubrikák (írásbeli összeadás, kivonás). */
  | 'stacked'
  /** `352 · 6` egy sorban, vonal, alatta a rubrikák (írásbeli szorzás). */
  | 'productRow'
  /** `456 : 8 =` és a rubrikák ugyanabban a sorban (osztás, egyjegyű feladatok). */
  | 'equationRow';

/** Merre halad a kijelölés beírás után. Írásbeli összeadásnál jobbról balra, egyébként balról jobbra. */
export type EntryDirection = 'rtl' | 'ltr';

export interface ModeInfo {
  operation: MathOperation;
  /** Rövid cím az alkategória-választóhoz és a gyakorlás fejlécéhez. */
  title: string;
  /** Egy mondat arról, mit kérdez a feladat. */
  description: string;
  layout: ProblemLayout;
  /** Hány rubrikába kell beírni az eredményt. */
  answerCellCount: number;
  bonusTiming: BonusTiming;
  /** Alappont helyes válaszért; a sebességbónusz maximuma is ennyi. Számjegyszám szerint 3, 6, 10. */
  basePoints: number;
  entryDirection: EntryDirection;
  /**
   * Igaz, ha a típusban az üres hely lehet operandus is (a játékos beállítása dönti el, hogy tényleg
   * véletlen-e: 50% eredmény, 25-25% operandus). Hamis: mindig az eredmény.
   */
  randomBlank: boolean;
}

export const MODE_INFO: Record<PracticeMode, ModeInfo> = {
  'addition-single': {
    operation: 'addition',
    title: 'Egyjegyűek',
    description: 'Egyjegyű számok összege fejben, 2-től 9-ig.',
    layout: 'equationRow',
    answerCellCount: 2,
    bonusTiming: INSTANT_TIMING,
    basePoints: 3,
    entryDirection: 'ltr',
    randomBlank: true,
  },
  'addition-double': {
    operation: 'addition',
    title: 'Kétjegyűek',
    description: 'Két kétjegyű szám összege, füzetszerűen.',
    layout: 'stacked',
    answerCellCount: 3,
    bonusTiming: QUICK_TIMING,
    basePoints: 6,
    entryDirection: 'rtl',
    randomBlank: true,
  },
  'addition-written': {
    operation: 'addition',
    title: 'Háromjegyűek',
    description: 'Két háromjegyű szám összege, füzetszerűen.',
    layout: 'stacked',
    answerCellCount: 4,
    bonusTiming: QUICK_TIMING,
    basePoints: 10,
    entryDirection: 'rtl',
    randomBlank: true,
  },
  'subtraction-single': {
    operation: 'subtraction',
    title: 'Egyjegyűek',
    description: 'Egyjegyűt vonunk ki, a különbség is egyjegyű.',
    layout: 'equationRow',
    answerCellCount: 1,
    bonusTiming: INSTANT_TIMING,
    basePoints: 3,
    entryDirection: 'ltr',
    randomBlank: true,
  },
  'subtraction-double': {
    operation: 'subtraction',
    title: 'Kétjegyűek',
    description: 'Két kétjegyű szám különbsége, füzetszerűen.',
    layout: 'stacked',
    answerCellCount: 2,
    bonusTiming: QUICK_TIMING,
    basePoints: 6,
    entryDirection: 'rtl',
    randomBlank: true,
  },
  'subtraction-written': {
    operation: 'subtraction',
    title: 'Háromjegyűek',
    description: 'Két háromjegyű szám különbsége, füzetszerűen.',
    layout: 'stacked',
    answerCellCount: 3,
    bonusTiming: QUICK_TIMING,
    basePoints: 10,
    entryDirection: 'rtl',
    randomBlank: true,
  },
  'multiplication-table': {
    operation: 'multiplication',
    title: 'Szorzótábla',
    description: 'Egyjegyű számok szorzata fejben, 2-től 9-ig.',
    layout: 'equationRow',
    answerCellCount: 2,
    bonusTiming: INSTANT_TIMING,
    basePoints: 6,
    entryDirection: 'ltr',
    randomBlank: true,
  },
  'multiplication-written': {
    operation: 'multiplication',
    title: 'Háromjegyűek',
    description: 'Háromjegyű szám szorzása egyjegyűvel.',
    layout: 'productRow',
    answerCellCount: 4,
    bonusTiming: PATIENT_TIMING,
    basePoints: 10,
    entryDirection: 'rtl',
    randomBlank: false,
  },
  'division-table': {
    operation: 'division',
    title: 'Szorzótábla',
    description: 'Egyjegyű számok szorzatából visszaszámolás, 2-től 9-ig.',
    layout: 'equationRow',
    answerCellCount: 1,
    bonusTiming: INSTANT_TIMING,
    basePoints: 6,
    entryDirection: 'ltr',
    randomBlank: true,
  },
  'division-written': {
    operation: 'division',
    title: 'Háromjegyűek',
    description: 'Háromjegyű szám osztása egyjegyűvel, maradék nélkül.',
    layout: 'equationRow',
    answerCellCount: 3,
    bonusTiming: PATIENT_TIMING,
    basePoints: 10,
    entryDirection: 'ltr',
    randomBlank: false,
  },
};

/** Egy művelet alkategóriái a felsorolás sorrendjében. */
export function modesOf(operation: MathOperation): PracticeMode[] {
  return PRACTICE_MODES.filter((mode) => MODE_INFO[mode].operation === operation);
}

export function isPracticeMode(value: unknown): value is PracticeMode {
  return typeof value === 'string' && (PRACTICE_MODES as readonly string[]).includes(value);
}
