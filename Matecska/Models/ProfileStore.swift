import Foundation
import Observation

/// A profil betöltése, módosítása és mentése. JSON fájl az Application Support mappában.
@Observable
final class ProfileStore {
    private(set) var profile: PlayerProfile
    private let fileURL: URL?

    /// - Parameter fileURL: hova mentsen; `nil` esetén csak memóriában él (tesztekhez, előnézethez).
    init(fileURL: URL? = ProfileStore.defaultFileURL) {
        self.fileURL = fileURL
        self.profile = ProfileStore.load(from: fileURL) ?? .dummy()
    }

    static var defaultFileURL: URL? {
        guard let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first else {
            return nil
        }
        return base.appendingPathComponent("Matecska", isDirectory: true).appendingPathComponent("profile.json")
    }

    // MARK: - Műveletek

    /// Egy beküldött válasz pontjának és statisztikájának könyvelése. Az összpont nem megy nulla alá.
    func record(_ score: ScoreBreakdown, correct: Bool, for operation: MathOperation) {
        profile.totalPoints = max(0, profile.totalPoints + score.total)
        var stats = profile.stats[operation] ?? .init()
        stats.solved += 1
        if correct { stats.correct += 1 }
        profile.stats[operation] = stats
        save()
    }

    func select(_ character: GameCharacter) {
        guard profile.owns(character) else { return }
        profile.selectedCharacterID = character.id
        save()
    }

    /// Karakter megvásárlása pontért. Későbbi funkció, a logika már kész.
    @discardableResult
    func unlock(_ character: GameCharacter) -> Bool {
        guard !profile.owns(character), profile.totalPoints >= character.price else { return false }
        profile.totalPoints -= character.price
        profile.ownedCharacterIDs.insert(character.id)
        save()
        return true
    }

    // MARK: - Mentés

    private static func load(from url: URL?) -> PlayerProfile? {
        guard let url, let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(PlayerProfile.self, from: data)
    }

    private func save() {
        guard let fileURL else { return }
        do {
            try FileManager.default.createDirectory(at: fileURL.deletingLastPathComponent(), withIntermediateDirectories: true)
            let encoder = JSONEncoder()
            encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
            try encoder.encode(profile).write(to: fileURL, options: .atomic)
        } catch {
            assertionFailure("Profil mentése sikertelen: \(error)")
        }
    }
}
