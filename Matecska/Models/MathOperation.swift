import Foundation

/// A gyakorolható írásbeli alapműveletek.
/// `CodingKeyRepresentable`: így a művelet-kulcsú szótárak JSON-objektumként (nem tömbként) mentődnek.
enum MathOperation: String, CaseIterable, Codable, Identifiable, CodingKeyRepresentable {
    case addition
    case subtraction
    case multiplication
    case division

    var id: String { rawValue }

    var title: String {
        switch self {
        case .addition: return "Összeadás"
        case .subtraction: return "Kivonás"
        case .multiplication: return "Szorzás"
        case .division: return "Osztás"
        }
    }

    /// Magyar iskolai jelölés: a szorzás pont, az osztás kettőspont.
    var symbol: String {
        switch self {
        case .addition: return "+"
        case .subtraction: return "−"
        case .multiplication: return "·"
        case .division: return ":"
        }
    }

    var layout: ProblemLayout {
        switch self {
        case .addition, .subtraction: return .stacked
        case .multiplication: return .productRow
        case .division: return .equationRow
        }
    }

    /// A sebességbónusz időzítése: a szorzás és az osztás türelmesebb.
    var bonusTiming: BonusTiming {
        switch self {
        case .addition, .subtraction: return .quick
        case .multiplication, .division: return .patient
        }
    }

    /// Hány rubrikába kell beírni a választ.
    var answerCellCount: Int {
        switch self {
        case .addition, .multiplication: return 4
        case .subtraction, .division: return 3
        }
    }
}

/// A feladat elrendezése a képernyőn.
enum ProblemLayout {
    /// Két operandus egymás alatt, vonal, alatta a rubrikák (összeadás, kivonás).
    case stacked
    /// `352 · 6` egy sorban, vonal, alatta a rubrikák (szorzás).
    case productRow
    /// `456 : 8 =` és a rubrikák ugyanabban a sorban (osztás).
    case equationRow
}
