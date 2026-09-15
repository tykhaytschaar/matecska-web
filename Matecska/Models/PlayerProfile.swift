import Foundation

/// Egy játékos adatai. Most egyetlen, helyben tárolt („dummy”) profil van;
/// a fiókkezelés bevezetésekor ez a struktúra lesz a szerverrel cserélt adat.
struct PlayerProfile: Codable, Equatable {
    struct OperationStats: Codable, Equatable {
        var solved = 0
        var correct = 0
    }

    var id: UUID
    var name: String
    var totalPoints: Int
    var ownedCharacterIDs: Set<String>
    var selectedCharacterID: String
    var stats: [MathOperation: OperationStats]

    static func dummy() -> PlayerProfile {
        PlayerProfile(
            id: UUID(),
            name: "Játékos",
            totalPoints: 0,
            ownedCharacterIDs: [GameCharacter.cat.id],
            selectedCharacterID: GameCharacter.cat.id,
            stats: [:]
        )
    }

    var selectedCharacter: GameCharacter {
        GameCharacter.find(selectedCharacterID) ?? .cat
    }

    func owns(_ character: GameCharacter) -> Bool {
        ownedCharacterIDs.contains(character.id)
    }
}
