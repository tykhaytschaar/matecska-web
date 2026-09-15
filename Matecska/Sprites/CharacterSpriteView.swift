import SwiftUI

/// Animált karakter. A képkocka-sorozatok és az eltolások a GameBoy-változat animációs tábláit követik.
struct CharacterSpriteView: View {
    enum Mood: Equatable {
        case idle
        case happy
        case yuck
    }

    let character: GameCharacter
    var mood: Mood = .idle
    /// Kockaváltások másodpercenként.
    var framesPerSecond: Double = 6

    var body: some View {
        let sheet = SpriteSheet.named(character.spriteSheetName)
        TimelineView(.periodic(from: .now, by: 1 / framesPerSecond)) { context in
            let step = Int(context.date.timeIntervalSinceReferenceDate * framesPerSecond)
            let (frame, offset) = frameAndOffset(step: step)
            GeometryReader { geometry in
                let pixel = geometry.size.width / CGFloat(SpriteSheet.frameSize)
                SpriteFrameView(sheet: sheet, index: frame)
                    .offset(x: CGFloat(offset.x) * pixel, y: CGFloat(offset.y) * pixel)
            }
            .aspectRatio(1, contentMode: .fit)
        }
        .accessibilityLabel(character.name)
    }

    private func frameAndOffset(step: Int) -> (Int, (x: Int, y: Int)) {
        let frames = character.frames
        switch mood {
        case .idle:
            return (frames.idle[step % frames.idle.count], (0, 0))
        case .happy:
            let i = step % frames.happy.count
            return (frames.happy[i], frames.happyOffsets[i])
        case .yuck:
            let i = step % frames.yuck.count
            return (frames.yuck[i], frames.yuckOffsets[i])
        }
    }
}

#Preview {
    HStack(spacing: 24) {
        CharacterSpriteView(character: .cat, mood: .idle).frame(width: 96)
        CharacterSpriteView(character: .cat, mood: .happy).frame(width: 96)
        CharacterSpriteView(character: .cat, mood: .yuck).frame(width: 96)
    }
    .padding()
    .background(Color.paper)
}
