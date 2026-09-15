import Foundation

/// Gyűjthető karakter. Egy karakter egy sprite-csíkhoz tartozik; a képkocka-indexek
/// a GameBoy-os matecska projekt sprite-tábláját követik.
struct GameCharacter: Identifiable, Equatable {
    struct Frames: Equatable {
        let idle: [Int]
        let happy: [Int]
        let yuck: [Int]
        /// Kockánkénti (x, y) eltolás pixelben a happy/yuck animációhoz (16 px-es kockára vetítve).
        let happyOffsets: [(x: Int, y: Int)]
        let yuckOffsets: [(x: Int, y: Int)]

        static func == (lhs: Frames, rhs: Frames) -> Bool {
            lhs.idle == rhs.idle && lhs.happy == rhs.happy && lhs.yuck == rhs.yuck
        }
    }

    let id: String
    let name: String
    /// Ár pontban; 0 = alapból megvan.
    let price: Int
    let spriteSheetName: String
    let frames: Frames

    static let cat = GameCharacter(
        id: "cat",
        name: "Matecska",
        price: 0,
        spriteSheetName: "CatSprites",
        frames: Frames(
            idle: [0, 1],
            happy: [7, 8, 8, 7],
            yuck: [9, 10, 9, 10],
            happyOffsets: [(0, 0), (0, -2), (0, -4), (0, 0)],
            yuckOffsets: [(0, 0), (-1, 0), (0, 0), (1, 0)]
        )
    )

    /// Minden létező karakter. Új karakter bevezetése: egy elem ide, plusz a sprite-csíkja az asset katalógusba.
    static let catalog: [GameCharacter] = [.cat]

    static func find(_ id: String) -> GameCharacter? {
        catalog.first { $0.id == id }
    }
}
