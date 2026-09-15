import Foundation

/// Egy írásbeli összeadás feladat: két háromjegyű szám.
struct AdditionExercise: Equatable {
    let first: Int
    let second: Int

    var sum: Int { first + second }

    static func random() -> AdditionExercise {
        AdditionExercise(
            first: Int.random(in: 100...999),
            second: Int.random(in: 100...999)
        )
    }
}
