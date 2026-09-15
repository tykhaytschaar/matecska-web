import Foundation
import Observation

/// A gyakorlás állapota: feladat, a beírt számjegyek, a kijelölt rubrika és az eredmény.
@Observable
final class AdditionPracticeModel {
    enum Outcome: Equatable {
        case correct
        case wrong(correctAnswer: Int)
    }

    static let cellCount = 4

    private(set) var exercise: AdditionExercise
    /// Négy rubrika, a 0. index a bal szélső (ezres), a 3. a jobb szélső (egyes).
    private(set) var cells: [Int?]
    private(set) var selectedIndex: Int
    private(set) var outcome: Outcome?

    init(exercise: AdditionExercise = .random()) {
        self.exercise = exercise
        self.cells = Array(repeating: nil, count: Self.cellCount)
        self.selectedIndex = Self.cellCount - 1
    }

    var isSubmitted: Bool { outcome != nil }

    /// A három jobb oldali rubrikát kötelező kitölteni; a bal szélső (ezres) üresen maradhat,
    /// ha az összeg háromjegyű.
    var canSubmit: Bool {
        !isSubmitted && cells.dropFirst().allSatisfy { $0 != nil }
    }

    /// A beírt számjegyekből képzett szám; az üres rubrika nullának számít.
    var enteredValue: Int {
        cells.reduce(0) { $0 * 10 + ($1 ?? 0) }
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
        if cells[selectedIndex] == nil, selectedIndex < Self.cellCount - 1 {
            selectedIndex += 1
        }
        cells[selectedIndex] = nil
    }

    func submit() {
        guard canSubmit else { return }
        outcome = enteredValue == exercise.sum
            ? .correct
            : .wrong(correctAnswer: exercise.sum)
    }

    func nextExercise() {
        exercise = .random()
        cells = Array(repeating: nil, count: Self.cellCount)
        selectedIndex = Self.cellCount - 1
        outcome = nil
    }
}
