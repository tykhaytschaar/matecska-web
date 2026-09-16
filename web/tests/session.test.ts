import { describe, expect, it } from 'vitest';
import { makeExercise, type BlankSlot } from '../src/core/exercise';
import { MODE_INFO, PRACTICE_MODES, type PracticeMode } from '../src/core/operation';
import {
  canSubmit, createSession, deleteDigit, elapsedSeconds, enteredValue, enterDigit, isValidEntry, nextExercise, selectCell, selectScratch, submit,
} from '../src/core/session';

function session(mode: PracticeMode, a: number, b: number, blank: BlankSlot = 'result', now = 0) {
  return createSession(mode, now, makeExercise(mode, a, b, blank));
}

function enterAll(state: ReturnType<typeof session>, digits: number[]) {
  return digits.reduce((s, d) => enterDigit(s, d), state);
}

describe('gyakorlás-állapot', () => {
  it('kezdetben a jobb szélső rubrika van kijelölve, és üresen nem küldhető be', () => {
    const s = session('addition-written', 352, 636);
    expect(s.operation).toBe('addition');
    expect(s.selectedIndex).toBe(3);
    expect(canSubmit(s)).toBe(false);
    expect(s.cells.every((c) => c === null)).toBe(true);
  });

  it('beírás után balra lép, a bal szélen megáll', () => {
    let s = session('addition-written', 352, 636);
    s = enterDigit(s, 8); expect(s.selectedIndex).toBe(2);
    s = enterAll(s, [8, 9]); expect(s.selectedIndex).toBe(0);
    s = enterDigit(s, 1);
    expect(s.selectedIndex).toBe(0); expect(s.cells[0]).toBe(1);
  });

  it.each([
    [[1, 5, null], true, 15],
    [[null, null, 1], true, 1],
    [[9, 8, 8, null], true, 988],
    [[4, null, 5], false, 0],
    [[null, null, null], false, 0],
    [[1, null, null, 2], false, 0],
  ] as const)('érvényesség és érték: %j → érvényes %s, érték %s', (cells, valid, value) => {
    expect(isValidEntry(cells)).toBe(valid);
    const s = { ...session('addition-written', 100, 100), cells: [...cells] };
    expect(canSubmit(s)).toBe(valid);
    if (valid) expect(enteredValue(s)).toBe(value);
  });

  it('osztás: balról jobbra halad, az utolsó rubrika üresen maradhat', () => {
    let s = session('division-written', 150, 10); // 15 — de az osztó egyjegyű a játékban; itt csak a bevitel irányát teszteljük
    expect(s.selectedIndex).toBe(0);
    s = enterDigit(s, 1); expect(s.selectedIndex).toBe(1);
    s = enterDigit(s, 5); expect(s.selectedIndex).toBe(2);
    expect(s.cells).toEqual([1, 5, null]);
    expect(canSubmit(s)).toBe(true);
    expect(enteredValue(s)).toBe(15);
    s = enterDigit(s, 7); expect(s.selectedIndex).toBe(2);
    s = deleteDigit(s); expect(s.cells).toEqual([1, 5, null]); expect(s.selectedIndex).toBe(2);
    s = deleteDigit(s); expect(s.cells).toEqual([1, null, null]); expect(s.selectedIndex).toBe(1);
  });

  it('segédrács csak írásbeli osztásnál: annyi sor, ahány jegyű a hányados, három oszlop', () => {
    expect(session('addition-written', 352, 636).scratch).toEqual([]);
    expect(session('multiplication-written', 352, 6).scratch).toEqual([]);
    expect(session('division-table', 42, 6).scratch).toEqual([]);
    expect(session('division-written', 486, 6).scratch).toEqual([[null, null, null], [null, null, null]]); // 81
    expect(session('division-written', 684, 6).scratch.length).toBe(3); // 114
  });

  it('segédrács: kijelölés, beírás balról jobbra, törlés, és nem érinti a beküldést', () => {
    let s = session('division-written', 456, 8); // 57
    s = selectScratch(s, 0, 1);
    expect(s.scratchSelection).toEqual({ row: 0, col: 1 });
    s = enterDigit(s, 5); s = enterDigit(s, 6);
    expect(s.scratch[0]).toEqual([null, 5, 6]);
    expect(s.scratchSelection).toEqual({ row: 0, col: 2 }); // a sor végén megáll
    s = enterDigit(s, 9);
    expect(s.scratch[0]).toEqual([null, 5, 9]);
    s = deleteDigit(s); expect(s.scratch[0]).toEqual([null, 5, null]);
    s = deleteDigit(s); expect(s.scratch[0]).toEqual([null, null, null]); expect(s.scratchSelection?.col).toBe(1);
    expect(s.cells).toEqual([null, null, null]); // a válasz rubrikái érintetlenek
    expect(canSubmit(s)).toBe(false);
    s = selectCell(s, 0);
    expect(s.scratchSelection).toBeNull();
    s = enterAll(s, [5, 7]);
    s = selectScratch(s, 1, 2); s = enterDigit(s, 0);
    expect(canSubmit(s)).toBe(true);
    const done = submit(s, 1);
    expect(done.outcome?.kind).toBe('correct');
    expect(enterDigit(done, 3)).toBe(done);
  });

  it('osztás: háromjegyű osztandó, egyjegyű osztó, kétjegyű hányados beküldve az utolsó üres rubrikával', () => {
    let s = session('division-written', 456, 8); // 57
    s = enterAll(s, [5, 7]);
    expect(s.cells).toEqual([5, 7, null]);
    expect(submit(s, 1).outcome?.kind).toBe('correct');
  });

  it('helyes válasz üres bal szélső rubrikával (üres = 0), teljes bónusszal', () => {
    let s = enterAll(session('addition-written', 352, 636), [8, 8, 9]); // 988
    expect(canSubmit(s)).toBe(true);
    s = submit(s, 2);
    expect(s.outcome).toEqual({ kind: 'correct', score: { base: 10, bonus: 10, penalty: 0 } });
    expect(elapsedSeconds(s, 999)).toBe(2);
  });

  it('lassú helyes válasz: nincs bónusz', () => {
    const s = submit(enterAll(session('subtraction-written', 500, 123), [7, 7, 3]), 20); // 377, 3 + 10 mp után elfogy a bónusz
    expect(s.outcome?.kind).toBe('correct');
    expect(s.outcome?.score.bonus).toBe(0);
  });

  it('ezres átvitel kihagyva: helytelen, helyes válasz és levonás; utána nem módosítható', () => {
    let s = submit(enterAll(session('addition-written', 750, 640), [0, 9, 3]), 1); // 1390
    expect(s.outcome).toEqual({ kind: 'wrong', correctAnswer: 1390, score: { base: 0, bonus: 0, penalty: 1 } });
    const after = enterDigit(s, 1);
    expect(after.cells[0]).toBeNull();
    expect(deleteDigit(after)).toBe(after);
  });

  it('következő feladat tiszta állapotot ad, ugyanabban a típusban, és újraindítja az órát', () => {
    let s = submit(enterAll(session('addition-written', 750, 640), [0, 9, 3]), 1);
    s = nextExercise(s, 30, makeExercise('addition-written', 100, 100));
    expect(s.mode).toBe('addition-written');
    expect(s.outcome).toBeNull();
    expect(s.cells.every((c) => c === null)).toBe(true);
    expect(s.selectedIndex).toBe(3);
    expect(elapsedSeconds(s, 30)).toBe(0);
    const t = nextExercise(session('multiplication-table', 6, 7), 5);
    expect(t.mode).toBe('multiplication-table');
    expect(t.exercise.mode).toBe('multiplication-table');
  });

  it('kézi kijelölés és törlés', () => {
    let s = enterDigit(selectCell(session('addition-written', 100, 100), 1), 5);
    expect(s.cells[1]).toBe(5); expect(s.selectedIndex).toBe(0);
    s = deleteDigit(s);
    expect(s.cells[1]).toBeNull(); expect(s.selectedIndex).toBe(1);
  });

  it.each(PRACTICE_MODES)('rubrikaszám és kezdő kijelölés típus szerint, ha az eredmény az üres hely: %s', (mode) => {
    const info = MODE_INFO[mode];
    const written = mode.endsWith('written');
    const a = written ? 300 : 6;
    const b = written && info.operation !== 'multiplication' && info.operation !== 'division' ? 200 : 5;
    const s = createSession(mode, 0, makeExercise(mode, a, b));
    expect(s.cells.length).toBe(info.answerCellCount);
    expect(s.selectedIndex).toBe(info.entryDirection === 'ltr' ? 0 : info.answerCellCount - 1);
  });

  it('operandus az üres hely: három rubrika, az operandus a helyes válasz', () => {
    let s = session('addition-written', 352, 636, 'first');
    expect(s.cells.length).toBe(3);
    expect(s.exercise.answer).toBe(352);
    s = submit(enterAll(s, [2, 5, 3]), 1);
    expect(s.outcome?.kind).toBe('correct');

    let t = session('subtraction-written', 805, 347, 'second');
    expect(t.cells.length).toBe(3);
    t = submit(enterAll(t, [8, 4, 3]), 1); // 348, rossz
    expect(t.outcome).toEqual({ kind: 'wrong', correctAnswer: 347, score: { base: 0, bonus: 0, penalty: 1 } });
  });

  it('írásbeli osztás és szorzás helyes válasza, türelmesebb bónusszal', () => {
    const d = submit(enterAll(session('division-written', 456, 8), [5, 7]), 5); // 57, balról jobbra
    expect(d.outcome?.kind).toBe('correct');
    expect(d.outcome?.score.bonus).toBe(10);
    const m = submit(enterAll(session('multiplication-written', 352, 6), [2, 1, 1, 2]), 10); // 2112
    expect(m.outcome?.kind).toBe('correct');
    expect(m.outcome?.score.bonus).toBe(5);
  });

  it('egyjegyű összeadás: balról jobbra, kétjegyű összeg két rubrikában', () => {
    let s = session('addition-single', 7, 5); // 12
    expect(s.cells.length).toBe(2);
    expect(s.selectedIndex).toBe(0);
    s = enterDigit(s, 1); expect(s.selectedIndex).toBe(1);
    s = enterDigit(s, 2); expect(s.selectedIndex).toBe(1);
    expect(s.cells).toEqual([1, 2]);
    expect(submit(s, 0.5).outcome?.kind).toBe('correct');
  });

  it('egyjegyű összeg egy jeggyel: a jobb rubrika üresen marad, mégis helyes', () => {
    const s = enterDigit(session('addition-single', 2, 3), 5); // [5, _] → 5
    expect(s.cells).toEqual([5, null]);
    expect(canSubmit(s)).toBe(true);
    expect(submit(s, 0).outcome?.kind).toBe('correct');
  });

  it('egyjegyű kivonás: kétjegyű kisebbítendő két rubrikában, ha az az üres hely', () => {
    let s = session('subtraction-single', 12, 5, 'first'); // _ − 5 = 7
    expect(s.cells.length).toBe(2);
    expect(s.selectedIndex).toBe(0);
    s = submit(enterAll(s, [1, 2]), 0);
    expect(s.outcome?.kind).toBe('correct');
    const r = submit(enterDigit(session('subtraction-single', 12, 5), 7), 0); // 12 − 5 = _
    expect(r.cells.length).toBe(1);
    expect(r.outcome?.kind).toBe('correct');
  });

  it('szorzótábla és visszafelé: operandus az üres hely, egy rubrika', () => {
    let m = session('multiplication-table', 6, 7, 'second'); // 6 · _ = 42
    expect(m.cells.length).toBe(1);
    m = submit(enterDigit(m, 7), 0);
    expect(m.outcome?.kind).toBe('correct');

    let d = session('division-table', 42, 6, 'first'); // _ : 6 = 7
    expect(d.cells.length).toBe(2);
    expect(d.selectedIndex).toBe(0);
    d = submit(enterAll(d, [4, 2]), 0);
    expect(d.outcome?.kind).toBe('correct');

    const q = submit(enterDigit(session('division-table', 42, 6), 8), 0); // rossz
    expect(q.outcome).toEqual({ kind: 'wrong', correctAnswer: 7, score: { base: 0, bonus: 0, penalty: 1 } });
  });

  it('egyjegyű feladatoknál a bónusz azonnal fogy: 0 mp-nél teljes, 1 mp-nél 9, 10 mp-nél 0', () => {
    const full = (t: number) => submit(enterAll(session('multiplication-table', 6, 7), [4, 2]), t); // 42
    expect(full(0).outcome?.kind).toBe('correct');
    expect(full(0).outcome?.score.bonus).toBe(10);
    expect(full(0.99).outcome?.score.bonus).toBe(10);
    expect(full(1).outcome?.score.bonus).toBe(9);
    expect(full(4.2).outcome?.score.bonus).toBe(6);
    expect(full(10).outcome?.score.bonus).toBe(0);
  });
});
