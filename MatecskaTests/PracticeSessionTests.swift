import Foundation
import Testing
@testable import Matecska

struct PracticeSessionTests {
    /// Kézzel léptethető óra a sebességbónusz teszteléséhez.
    final class FakeClock {
        var now = Date(timeIntervalSinceReferenceDate: 0)
        func advance(_ seconds: TimeInterval) { now = now.addingTimeInterval(seconds) }
    }

    private func session(_ op: MathOperation, _ a: Int, _ b: Int, clock: FakeClock = FakeClock()) -> PracticeSession {
        PracticeSession(operation: op, exercise: Exercise(operation: op, operands: [a, b]), clock: { clock.now })
    }

    @Test("Kezdetben a jobb szélső rubrika van kijelölve, és üresen nem küldhető be")
    func initialState() {
        let s = session(.addition, 352, 636)
        #expect(s.selectedIndex == 3)
        #expect(!s.canSubmit)
        #expect(s.cells.allSatisfy { $0 == nil })
    }

    @Test("Beírás után balra lép, a bal szélen megáll")
    func entryMovesLeft() {
        let s = session(.addition, 352, 636)
        s.enter(digit: 8); #expect(s.selectedIndex == 2)
        s.enter(digit: 8); s.enter(digit: 9)
        #expect(s.selectedIndex == 0)
        s.enter(digit: 1)
        #expect(s.selectedIndex == 0 && s.cells[0] == 1)
    }

    @Test("Helyes válasz üres bal szélső rubrikával (üres = 0)")
    func correctWithEmptyLeadingCell() {
        let clock = FakeClock()
        let s = session(.addition, 352, 636, clock: clock) // 988
        [8, 8, 9].forEach { s.enter(digit: $0) }
        #expect(s.canSubmit)
        clock.advance(2)
        let outcome = s.submit()
        #expect(outcome == .correct(ScoreBreakdown(base: 10, bonus: 10, penalty: 0)))
        #expect(s.elapsed() == 2)
    }

    @Test("Lassú helyes válasz: nincs bónusz")
    func slowCorrect() {
        let clock = FakeClock()
        let s = session(.subtraction, 500, 123, clock: clock) // 377
        [7, 7, 3].forEach { s.enter(digit: $0) }
        clock.advance(12)
        #expect(s.submit()?.score.total == 10)
    }

    @Test("Ezres átvitel kihagyva: helytelen, a helyes válasz és a levonás megjelenik")
    func wrongAnswer() {
        let s = session(.addition, 750, 640) // 1390
        [0, 9, 3].forEach { s.enter(digit: $0) }
        let outcome = s.submit()
        #expect(outcome == .wrong(correctAnswer: 1390, score: ScoreBreakdown(base: 0, bonus: 0, penalty: 5)))
        s.enter(digit: 1)
        #expect(s.cells[0] == nil, "beküldés után nem módosítható")
    }

    @Test("Következő feladat tiszta állapotot ad, és újraindítja az órát")
    func nextResets() {
        let clock = FakeClock()
        let s = session(.addition, 750, 640, clock: clock)
        [0, 9, 3].forEach { s.enter(digit: $0) }
        s.submit()
        clock.advance(30)
        s.nextExercise()
        #expect(s.outcome == nil && s.cells.allSatisfy { $0 == nil } && s.selectedIndex == 3)
        #expect(s.elapsed() == 0)
    }

    @Test("Kézi kijelölés és törlés")
    func selectAndDelete() {
        let s = session(.addition, 100, 100)
        s.select(1); s.enter(digit: 5)
        #expect(s.cells[1] == 5 && s.selectedIndex == 0)
        s.deleteDigit()
        #expect(s.cells[1] == nil && s.selectedIndex == 1, "üres rubrikán törlés a jobbra lévőt törli")
    }

    @Test("Rubrikaszám művelet szerint", arguments: MathOperation.allCases)
    func cellCount(op: MathOperation) {
        let s = PracticeSession(operation: op)
        #expect(s.cellCount == op.answerCellCount)
        #expect(s.cells.count == op.answerCellCount)
        #expect(s.selectedIndex == op.answerCellCount - 1)
    }

    @Test("Osztás és szorzás helyes válasza, türelmesebb bónusszal")
    func divisionAndMultiplication() {
        let clock = FakeClock()
        let d = session(.division, 456, 8, clock: clock) // 57
        [7, 5].forEach { d.enter(digit: $0) }
        clock.advance(5)
        #expect(d.submit()?.score.total == 20, "osztásnál 5 mp-nél még teljes a bónusz")

        let m = session(.multiplication, 352, 6, clock: clock) // 2112
        [2, 1, 1, 2].forEach { m.enter(digit: $0) }
        clock.advance(10)
        #expect(m.submit()?.score.total == 15, "szorzásnál 10 mp-nél fél bónusz")
    }
}
