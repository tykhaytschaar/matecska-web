import Foundation

/// Egy válasz pontszámának összetevői.
struct ScoreBreakdown: Equatable {
    let base: Int
    let bonus: Int
    let penalty: Int

    var total: Int { base + bonus - penalty }

    static let zero = ScoreBreakdown(base: 0, bonus: 0, penalty: 0)
}

/// A sebességbónusz időzítése: eddig teljes a bónusz, és ekkortól nincs már.
struct BonusTiming: Equatable {
    let fullBonusUntil: TimeInterval
    let noBonusAfter: TimeInterval

    /// Összeadás, kivonás: 3 másodpercig teljes, 10 másodpercre fogy el.
    static let quick = BonusTiming(fullBonusUntil: 3, noBonusAfter: 10)
    /// Szorzás, osztás: türelmesebb, 5 másodpercig teljes, 15 másodpercre fogy el.
    static let patient = BonusTiming(fullBonusUntil: 5, noBonusAfter: 15)
}

/// Pontozási szabályok.
/// Helyes válasz: alap pont + sebességbónusz, ami a művelet időzítése szerint
/// egy ideig maximális, majd lineárisan csökken nullára.
/// Helytelen válasz: levonás (az alap pont fele).
enum Scoring {
    static let basePoints = 10
    static let maxBonus = 10
    static let wrongAnswerPenalty = 5

    static func points(correct: Bool, elapsed: TimeInterval, timing: BonusTiming) -> ScoreBreakdown {
        guard correct else {
            return ScoreBreakdown(base: 0, bonus: 0, penalty: wrongAnswerPenalty)
        }
        return ScoreBreakdown(base: basePoints, bonus: bonus(elapsed: elapsed, timing: timing), penalty: 0)
    }

    /// A még elérhető bónusz aránya 0…1 között; a bónuszcsík ezt rajzolja.
    static func bonusFraction(elapsed: TimeInterval, timing: BonusTiming) -> Double {
        if elapsed <= timing.fullBonusUntil { return 1 }
        if elapsed >= timing.noBonusAfter { return 0 }
        return 1 - (elapsed - timing.fullBonusUntil) / (timing.noBonusAfter - timing.fullBonusUntil)
    }

    static func bonus(elapsed: TimeInterval, timing: BonusTiming) -> Int {
        Int((Double(maxBonus) * bonusFraction(elapsed: elapsed, timing: timing)).rounded())
    }
}
