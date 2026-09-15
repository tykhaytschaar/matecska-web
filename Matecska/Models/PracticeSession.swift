import Foundation
import Observation

/// Egy gyakorlás állapota: az aktuális feladat, a beírt számjegyek, a kijelölt rubrika,
/// az eltelt idő és a beküldés eredménye.
@Observable
final class PracticeSession {
    enum Outcome: Equatable {
        case correct(ScoreBreakdown)
        case wrong(correctAnswer: Int, score: ScoreBreakdown)

        var score: ScoreBreakdown {
            switch self {
            case .correct(let score): return score
            case .wrong(_, let score): return score
            }
        }

        var isCorrect: Bool {
            if case .correct = self { return true }
            return false
        }
    }

    let operation: MathOperation
    private(set) var exercise: Exercise
    /// A 0. index a bal szélső, az utolsó a jobb szélső (egyes helyiérték).
    private(set) var cells: [Int?]
    private(set) var selectedIndex: Int
    private(set) var outcome: Outcome?
    private(set) var startedAt: Date
    private(set) var submittedAt: Date?

    private let clock: () -> Date

    init(operation: MathOperation, exercise: Exercise? = nil, clock: @escaping () -> Date = Date.init) {
        self.operation = operation
        self.clock = clock
        self.exercise = exercise ?? .random(for: operation)
        self.cells = Array(repeating: nil, count: operation.answerCellCount)
        self.selectedIndex = operation.answerCellCount - 1
        self.startedAt = clock()
    }

    var cellCount: Int { operation.answerCellCount }
    var isSubmitted: Bool { outcome != nil }

    /// A bal szélső rubrika üresen maradhat (ha az eredmény rövidebb), a többit ki kell tölteni.
    var canSubmit: Bool {
        !isSubmitted && cells.dropFirst().allSatisfy { $0 != nil }
    }

    /// A beírt számjegyekből képzett szám; az üres rubrika nullának számít.
    var enteredValue: Int {
        cells.reduce(0) { $0 * 10 + ($1 ?? 0) }
    }

    /// A feladat megjelenése óta eltelt idő (beküldés után rögzül).
    func elapsed(at now: Date? = nil) -> TimeInterval {
        (submittedAt ?? now ?? clock()).timeIntervalSince(startedAt)
    }

    func select(_ index: Int) {
        guard !isSubmitted, cells.indices.contains(index) else { return }
        selectedIndex = index
    }

    /// Beírja a számjegyet a kijelölt rubrikába, és balra lép a következőre.
    func enter(digit: Int) {
        guard !isSubmitted, (0...9).contains(digit) else { return }
        cells[selectedIndex] = digit
        if selectedIndex > 0 {
            selectedIndex -= 1
        }
    }

    /// Törli a kijelölt rubrikát; ha az már üres, az eggyel jobbra lévőt törli és oda lép.
    func deleteDigit() {
        guard !isSubmitted else { return }
        if cells[selectedIndex] == nil, selectedIndex < cellCount - 1 {
            selectedIndex += 1
        }
        cells[selectedIndex] = nil
    }

    @discardableResult
    func submit() -> Outcome? {
        guard canSubmit else { return nil }
        let now = clock()
        submittedAt = now
        let correct = enteredValue == exercise.answer
        let score = Scoring.points(correct: correct, elapsed: now.timeIntervalSince(startedAt), timing: operation.bonusTiming)
        outcome = correct ? .correct(score) : .wrong(correctAnswer: exercise.answer, score: score)
        return outcome
    }

    func nextExercise(_ exercise: Exercise? = nil) {
        self.exercise = exercise ?? .random(for: operation)
        cells = Array(repeating: nil, count: cellCount)
        selectedIndex = cellCount - 1
        outcome = nil
        submittedAt = nil
        startedAt = clock()
    }
}
