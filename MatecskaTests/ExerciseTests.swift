import Testing
@testable import Matecska

struct ExerciseTests {
    /// Determinisztikus generátor, hogy a teszt ismételhető legyen.
    struct SeededGenerator: RandomNumberGenerator {
        var state: UInt64
        mutating func next() -> UInt64 {
            state = state &* 6364136223846793005 &+ 1442695040888963407
            return state
        }
    }

    @Test("Összeadás: két háromjegyű, az eredmény négy rubrikába fér")
    func addition() {
        var g = SeededGenerator(state: 1)
        for _ in 0..<1000 {
            let e = Exercise.random(for: .addition, using: &g)
            #expect((100...999).contains(e.first) && (100...999).contains(e.second))
            #expect(e.answer == e.first + e.second)
            #expect(e.answer < 10_000)
        }
    }

    @Test("Kivonás: eredmény nemnegatív, három rubrika")
    func subtraction() {
        var g = SeededGenerator(state: 2)
        for _ in 0..<1000 {
            let e = Exercise.random(for: .subtraction, using: &g)
            #expect((100...999).contains(e.first) && (100...999).contains(e.second))
            #expect(e.answer >= 0 && e.answer < 1000)
            #expect(e.answer == e.first - e.second)
        }
    }

    @Test("Szorzás egyjegyűvel: szorzó 2…9, eredmény négy rubrikába fér")
    func multiplication() {
        var g = SeededGenerator(state: 3)
        for _ in 0..<1000 {
            let e = Exercise.random(for: .multiplication, using: &g)
            #expect((100...999).contains(e.first) && (2...9).contains(e.second))
            #expect(e.answer == e.first * e.second && e.answer < 10_000)
        }
    }

    @Test("Osztás egyjegyűvel: háromjegyű osztandó, maradék nélkül, három rubrika")
    func division() {
        var g = SeededGenerator(state: 4)
        for _ in 0..<1000 {
            let e = Exercise.random(for: .division, using: &g)
            #expect((100...999).contains(e.first), "osztandó: \(e.first)")
            #expect((2...9).contains(e.second))
            #expect(e.first % e.second == 0)
            #expect(e.answer == e.first / e.second && e.answer < 1000)
        }
    }

    @Test("A válasz mindig belefér a művelet rubrikaszámába")
    func answerFitsCells() {
        var g = SeededGenerator(state: 5)
        for op in MathOperation.allCases {
            for _ in 0..<500 {
                let e = Exercise.random(for: op, using: &g)
                #expect(String(e.answer).count <= op.answerCellCount, "\(op): \(e.answer)")
            }
        }
    }
}
