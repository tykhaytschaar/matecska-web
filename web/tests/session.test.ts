import { describe, expect, it } from 'vitest';
import { makeExercise } from '../src/core/exercise';
import { OPERATION_INFO, OPERATIONS, type MathOperation } from '../src/core/operation';
import {
  canSubmit, createSession, deleteDigit, elapsedSeconds, enteredValue, enterDigit, isValidEntry, nextExercise, selectCell, selectScratch, submit,
} from '../src/core/session';

function session(op: MathOperation, a: number, b: number, now = 0) {
  return createSession(op, now, makeExercise(op, a, b));
}

function enterAll(state: ReturnType<typeof session>, digits: number[]) {
  return digits.reduce((s, d) => enterDigit(s, d), state);
}

describe('gyakorlás-állapot', () => {
  it('kezdetben a jobb szélső rubrika van kijelölve, és üresen nem küldhető be', () => {
    const s = session('addition', 352, 636);
    expect(s.selectedIndex).toBe(3);
    expect(canSubmit(s)).toBe(false);
    expect(s.cells.every((c) => c === null)).toBe(true);
  });

  it('beírás után balra lép, a bal szélen megáll', () => {
    let s = session('addition', 352, 636);
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
    const s = { ...createSession('addition', 0, makeExercise('addition', 100, 100)), cells: [...cells] };
    expect(canSubmit(s)).toBe(valid);
    if (valid) expect(enteredValue(s)).toBe(value);
  });

  it('osztás: balról jobbra halad, az utolsó rubrika üresen maradhat', () => {
    let s = session('division', 150, 10); // 15 — de az osztó egyjegyű a játékban; itt csak a bevitel irányát teszteljük
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

  it('segédrács csak osztásnál: annyi sor, ahány jegyű a hányados, három oszlop', () => {
    expect(session('addition', 352, 636).scratch).toEqual([]);
    expect(session('multiplication', 352, 6).scratch).toEqual([]);
    expect(session('division', 486, 6).scratch).toEqual([[null, null, null], [null, null, null]]); // 81
    expect(session('division', 684, 6).scratch.length).toBe(3); // 114
  });

  it('segédrács: kijelölés, beírás balról jobbra, törlés, és nem érinti a beküldést', () => {
    let s = session('division', 456, 8); // 57
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
    let s = session('division', 456, 8); // 57
    s = enterAll(s, [5, 7]);
    expect(s.cells).toEqual([5, 7, null]);
    expect(submit(s, 1).outcome?.kind).toBe('correct');
  });

  it('helyes válasz üres bal szélső rubrikával (üres = 0), teljes bónusszal', () => {
    let s = enterAll(session('addition', 352, 636), [8, 8, 9]); // 988
    expect(canSubmit(s)).toBe(true);
    s = submit(s, 2);
    expect(s.outcome).toEqual({ kind: 'correct', score: { base: 10, bonus: 10, penalty: 0 } });
    expect(elapsedSeconds(s, 999)).toBe(2);
  });

  it('lassú helyes válasz: nincs bónusz', () => {
    const s = submit(enterAll(session('subtraction', 500, 123), [7, 7, 3]), 20); // 377, 3 + 10 mp után elfogy a bónusz
    expect(s.outcome?.kind).toBe('correct');
    expect(s.outcome?.score.bonus).toBe(0);
  });

  it('ezres átvitel kihagyva: helytelen, helyes válasz és levonás; utána nem módosítható', () => {
    let s = submit(enterAll(session('addition', 750, 640), [0, 9, 3]), 1); // 1390
    expect(s.outcome).toEqual({ kind: 'wrong', correctAnswer: 1390, score: { base: 0, bonus: 0, penalty: 1 } });
    const after = enterDigit(s, 1);
    expect(after.cells[0]).toBeNull();
    expect(deleteDigit(after)).toBe(after);
  });

  it('következő feladat tiszta állapotot ad, és újraindítja az órát', () => {
    let s = submit(enterAll(session('addition', 750, 640), [0, 9, 3]), 1);
    s = nextExercise(s, 30, makeExercise('addition', 100, 100));
    expect(s.outcome).toBeNull();
    expect(s.cells.every((c) => c === null)).toBe(true);
    expect(s.selectedIndex).toBe(3);
    expect(elapsedSeconds(s, 30)).toBe(0);
  });

  it('kézi kijelölés és törlés', () => {
    let s = enterDigit(selectCell(session('addition', 100, 100), 1), 5);
    expect(s.cells[1]).toBe(5); expect(s.selectedIndex).toBe(0);
    s = deleteDigit(s);
    expect(s.cells[1]).toBeNull(); expect(s.selectedIndex).toBe(1);
  });

  it.each(OPERATIONS)('rubrikaszám művelet szerint, ha az eredmény az üres hely: %s', (op) => {
    const s = createSession(op, 0, makeExercise(op, 300, op === 'addition' || op === 'subtraction' ? 200 : 5));
    expect(s.cells.length).toBe(OPERATION_INFO[op].answerCellCount);
    expect(s.selectedIndex).toBe(op === 'division' ? 0 : OPERATION_INFO[op].answerCellCount - 1);
  });

  it('operandus az üres hely: három rubrika, az operandus a helyes válasz', () => {
    let s = createSession('addition', 0, makeExercise('addition', 352, 636, 'first'));
    expect(s.cells.length).toBe(3);
    expect(s.exercise.answer).toBe(352);
    s = submit(enterAll(s, [2, 5, 3]), 1);
    expect(s.outcome?.kind).toBe('correct');

    let t = createSession('subtraction', 0, makeExercise('subtraction', 805, 347, 'second'));
    expect(t.cells.length).toBe(3);
    t = submit(enterAll(t, [8, 4, 3]), 1); // 348, rossz
    expect(t.outcome).toEqual({ kind: 'wrong', correctAnswer: 347, score: { base: 0, bonus: 0, penalty: 1 } });
  });

  it('osztás és szorzás helyes válasza, türelmesebb bónusszal', () => {
    const d = submit(enterAll(session('division', 456, 8), [5, 7]), 5); // 57, balról jobbra
    expect(d.outcome?.kind).toBe('correct');
    expect(d.outcome?.score.bonus).toBe(10);
    const m = submit(enterAll(session('multiplication', 352, 6), [2, 1, 1, 2]), 10); // 2112
    expect(m.outcome?.kind).toBe('correct');
    expect(m.outcome?.score.bonus).toBe(5);
  });
});
