import { describe, expect, it } from 'vitest';
import { makeExercise } from '../src/core/exercise';
import { OPERATION_INFO, OPERATIONS, type MathOperation } from '../src/core/operation';
import {
  canSubmit, createSession, deleteDigit, elapsedSeconds, enterDigit, nextExercise, selectCell, submit,
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

  it('helyes válasz üres bal szélső rubrikával (üres = 0), teljes bónusszal', () => {
    let s = enterAll(session('addition', 352, 636), [8, 8, 9]); // 988
    expect(canSubmit(s)).toBe(true);
    s = submit(s, 2);
    expect(s.outcome).toEqual({ kind: 'correct', score: { base: 10, bonus: 10, penalty: 0 } });
    expect(elapsedSeconds(s, 999)).toBe(2);
  });

  it('lassú helyes válasz: nincs bónusz', () => {
    const s = submit(enterAll(session('subtraction', 500, 123), [7, 7, 3]), 12); // 377
    expect(s.outcome?.kind).toBe('correct');
    expect(s.outcome?.score.bonus).toBe(0);
  });

  it('ezres átvitel kihagyva: helytelen, helyes válasz és levonás; utána nem módosítható', () => {
    let s = submit(enterAll(session('addition', 750, 640), [0, 9, 3]), 1); // 1390
    expect(s.outcome).toEqual({ kind: 'wrong', correctAnswer: 1390, score: { base: 0, bonus: 0, penalty: 5 } });
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

  it.each(OPERATIONS)('rubrikaszám művelet szerint: %s', (op) => {
    const s = createSession(op, 0);
    expect(s.cells.length).toBe(OPERATION_INFO[op].answerCellCount);
    expect(s.selectedIndex).toBe(OPERATION_INFO[op].answerCellCount - 1);
  });

  it('osztás és szorzás helyes válasza, türelmesebb bónusszal', () => {
    const d = submit(enterAll(session('division', 456, 8), [7, 5]), 5); // 57
    expect(d.outcome?.kind).toBe('correct');
    expect(d.outcome?.score.bonus).toBe(10);
    const m = submit(enterAll(session('multiplication', 352, 6), [2, 1, 1, 2]), 10); // 2112
    expect(m.outcome?.kind).toBe('correct');
    expect(m.outcome?.score.bonus).toBe(5);
  });
});
