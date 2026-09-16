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
 * Alkategóriák: egy műveleten belül a konkrét gyakorlástípus. A „written” az írásbeli
 * (háromjegyű) feladat, a „single” és „table” az egyjegyű, fejben számolós változat.
 */
export type PracticeMode =
  | 'addition-single'
  | 'addition-written'
  | 'subtraction-single'
  | 'subtraction-written'
  | 'multiplication-table'
  | 'multiplication-written'
  | 'division-table'
  | 'division-written';

export const PRACTICE_MODES: readonly PracticeMode[] = [
  'addition-single',
  'addition-written',
  'subtraction-single',
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
  entryDirection: EntryDirection;
  /** Igaz, ha az üres hely véletlen: 50% eredmény, 25-25% valamelyik operandus. Különben mindig az eredmény. */
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
    entryDirection: 'ltr',
    randomBlank: true,
  },
  'addition-written': {
    operation: 'addition',
    title: 'Írásbeli',
    description: 'Két háromjegyű szám összege, füzetszerűen.',
    layout: 'stacked',
    answerCellCount: 4,
    bonusTiming: QUICK_TIMING,
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
    entryDirection: 'ltr',
    randomBlank: true,
  },
  'subtraction-written': {
    operation: 'subtraction',
    title: 'Írásbeli',
    description: 'Két háromjegyű szám különbsége, füzetszerűen.',
    layout: 'stacked',
    answerCellCount: 3,
    bonusTiming: QUICK_TIMING,
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
    entryDirection: 'ltr',
    randomBlank: true,
  },
  'multiplication-written': {
    operation: 'multiplication',
    title: 'Írásbeli',
    description: 'Háromjegyű szám szorzása egyjegyűvel.',
    layout: 'productRow',
    answerCellCount: 4,
    bonusTiming: PATIENT_TIMING,
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
    entryDirection: 'ltr',
    randomBlank: true,
  },
  'division-written': {
    operation: 'division',
    title: 'Írásbeli',
    description: 'Háromjegyű szám osztása egyjegyűvel, maradék nélkül.',
    layout: 'equationRow',
    answerCellCount: 3,
    bonusTiming: PATIENT_TIMING,
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
