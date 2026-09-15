import Foundation

/// Egy konkrét feladat: művelet, operandusok és a helyes eredmény.
struct Exercise: Equatable {
    let operation: MathOperation
    let operands: [Int]
    let answer: Int

    init(operation: MathOperation, operands: [Int]) {
        self.operation = operation
        self.operands = operands
        self.answer = Exercise.evaluate(operation, operands)
    }

    var first: Int { operands[0] }
    var second: Int { operands[1] }

    private static func evaluate(_ operation: MathOperation, _ operands: [Int]) -> Int {
        let a = operands[0], b = operands[1]
        switch operation {
        case .addition: return a + b
        case .subtraction: return a - b
        case .multiplication: return a * b
        case .division: return a / b
        }
    }

    /// Véletlen feladat a megadott művelethez. Minden művelet háromjegyű „fő” számmal dolgozik,
    /// a szorzó és az osztó egyjegyű, az osztás maradék nélküli.
    static func random(for operation: MathOperation, using generator: inout some RandomNumberGenerator) -> Exercise {
        switch operation {
        case .addition:
            return Exercise(operation: .addition, operands: [
                Int.random(in: 100...999, using: &generator),
                Int.random(in: 100...999, using: &generator),
            ])
        case .subtraction:
            let a = Int.random(in: 100...999, using: &generator)
            let b = Int.random(in: 100...a, using: &generator)
            return Exercise(operation: .subtraction, operands: [a, b])
        case .multiplication:
            return Exercise(operation: .multiplication, operands: [
                Int.random(in: 100...999, using: &generator),
                Int.random(in: 2...9, using: &generator),
            ])
        case .division:
            let divisor = Int.random(in: 2...9, using: &generator)
            let minQuotient = (100 + divisor - 1) / divisor
            let maxQuotient = 999 / divisor
            let quotient = Int.random(in: minQuotient...maxQuotient, using: &generator)
            return Exercise(operation: .division, operands: [quotient * divisor, divisor])
        }
    }

    static func random(for operation: MathOperation) -> Exercise {
        var generator = SystemRandomNumberGenerator()
        return random(for: operation, using: &generator)
    }
}
