import Testing
@testable import Matecska

struct ScoringTests {
    @Test("Összeadás/kivonás: 3 mp-ig teljes bónusz, 10 mp-re elfogy", arguments: [
        (0.0, 20), (3.0, 20), (6.5, 15), (10.0, 10), (15.0, 10),
    ])
    func quickTiming(elapsed: Double, expected: Int) {
        let s = Scoring.points(correct: true, elapsed: elapsed, timing: .quick)
        #expect(s.base == 10)
        #expect(s.penalty == 0)
        #expect(s.total == expected)
    }

    @Test("Szorzás/osztás: 5 mp-ig teljes bónusz, 15 mp-re elfogy", arguments: [
        (0.0, 20), (5.0, 20), (10.0, 15), (15.0, 10), (20.0, 10),
    ])
    func patientTiming(elapsed: Double, expected: Int) {
        let s = Scoring.points(correct: true, elapsed: elapsed, timing: .patient)
        #expect(s.total == expected)
    }

    @Test("A műveletek a megfelelő időzítést kapják")
    func operationTiming() {
        #expect(MathOperation.addition.bonusTiming == .quick)
        #expect(MathOperation.subtraction.bonusTiming == .quick)
        #expect(MathOperation.multiplication.bonusTiming == .patient)
        #expect(MathOperation.division.bonusTiming == .patient)
    }

    @Test("Helytelen válasz: levonás, nincs alap és bónusz")
    func wrongAnswer() {
        let s = Scoring.points(correct: false, elapsed: 1, timing: .quick)
        #expect(s == ScoreBreakdown(base: 0, bonus: 0, penalty: 5))
        #expect(s.total == -5)
    }

    @Test("A bónuszarány 1-ről 0-ra csökken a teljes és a nulla időpont között")
    func bonusFraction() {
        #expect(Scoring.bonusFraction(elapsed: 0, timing: .quick) == 1)
        #expect(Scoring.bonusFraction(elapsed: 3, timing: .quick) == 1)
        #expect(abs(Scoring.bonusFraction(elapsed: 6.5, timing: .quick) - 0.5) < 0.0001)
        #expect(Scoring.bonusFraction(elapsed: 10, timing: .quick) == 0)
        #expect(Scoring.bonusFraction(elapsed: 4, timing: .patient) == 1)
        #expect(abs(Scoring.bonusFraction(elapsed: 10, timing: .patient) - 0.5) < 0.0001)
        #expect(Scoring.bonusFraction(elapsed: 99, timing: .patient) == 0)
    }
}
