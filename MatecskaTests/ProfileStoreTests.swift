import Foundation
import Testing
@testable import Matecska

struct ProfileStoreTests {
    private func tempURL() -> URL {
        FileManager.default.temporaryDirectory
            .appendingPathComponent("MatecskaTests-\(UUID().uuidString)", isDirectory: true)
            .appendingPathComponent("profile.json")
    }

    @Test("Alapból dummy profil: 0 pont, macska birtokban és kiválasztva")
    func defaults() {
        let store = ProfileStore(fileURL: nil)
        #expect(store.profile.name == "Játékos")
        #expect(store.profile.totalPoints == 0)
        #expect(store.profile.owns(.cat))
        #expect(store.profile.selectedCharacter == .cat)
    }

    @Test("Pont könyvelése és statisztika, az összpont nem megy nulla alá")
    func recordAndFloor() {
        let store = ProfileStore(fileURL: nil)
        store.record(ScoreBreakdown(base: 0, bonus: 0, penalty: 5), correct: false, for: .addition)
        #expect(store.profile.totalPoints == 0)
        store.record(ScoreBreakdown(base: 10, bonus: 7, penalty: 0), correct: true, for: .addition)
        #expect(store.profile.totalPoints == 17)
        store.record(ScoreBreakdown(base: 0, bonus: 0, penalty: 5), correct: false, for: .addition)
        #expect(store.profile.totalPoints == 12)
        #expect(store.profile.stats[.addition] == .init(solved: 3, correct: 1))
    }

    @Test("Mentés és visszatöltés körút")
    func persistenceRoundTrip() throws {
        let url = tempURL()
        defer { try? FileManager.default.removeItem(at: url.deletingLastPathComponent()) }

        let store = ProfileStore(fileURL: url)
        store.record(ScoreBreakdown(base: 10, bonus: 3, penalty: 0), correct: true, for: .division)
        #expect(FileManager.default.fileExists(atPath: url.path))

        let reloaded = ProfileStore(fileURL: url)
        #expect(reloaded.profile == store.profile)
        #expect(reloaded.profile.totalPoints == 13)
        #expect(reloaded.profile.stats[.division]?.correct == 1)
    }

    @Test("Karakter feloldása pontért és kiválasztása")
    func unlockAndSelect() {
        let store = ProfileStore(fileURL: nil)
        let premium = GameCharacter(id: "test", name: "Teszt", price: 30, spriteSheetName: "CatSprites", frames: GameCharacter.cat.frames)
        #expect(!store.unlock(premium), "kevés pont")
        store.record(ScoreBreakdown(base: 10, bonus: 10, penalty: 0), correct: true, for: .addition)
        store.record(ScoreBreakdown(base: 10, bonus: 10, penalty: 0), correct: true, for: .addition)
        #expect(store.unlock(premium))
        #expect(store.profile.totalPoints == 10)
        #expect(store.profile.owns(premium))
        store.select(premium)
        #expect(store.profile.selectedCharacterID == "test")
    }
}
