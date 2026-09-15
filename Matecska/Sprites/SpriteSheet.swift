import SwiftUI
import UIKit

/// Egy vízszintes sprite-csík 16×16-os kockákra vágva. A vágás egyszer történik, az eredmény cache-elt.
final class SpriteSheet {
    static let frameSize = 16

    let name: String
    private let frames: [CGImage]

    private static var cache: [String: SpriteSheet] = [:]

    static func named(_ name: String) -> SpriteSheet {
        if let cached = cache[name] { return cached }
        let sheet = SpriteSheet(name: name)
        cache[name] = sheet
        return sheet
    }

    private init(name: String) {
        self.name = name
        guard let cgImage = UIImage(named: name)?.cgImage else {
            self.frames = []
            return
        }
        let size = SpriteSheet.frameSize
        let count = cgImage.width / size
        self.frames = (0..<count).compactMap { index in
            cgImage.cropping(to: CGRect(x: index * size, y: 0, width: size, height: size))
        }
    }

    var frameCount: Int { frames.count }

    func image(_ index: Int) -> Image? {
        guard frames.indices.contains(index) else { return nil }
        return Image(decorative: frames[index], scale: 1)
    }
}

/// Egyetlen sprite-kocka pixelesen (interpoláció nélkül) skálázva.
struct SpriteFrameView: View {
    let sheet: SpriteSheet
    let index: Int
    var flipped = false

    var body: some View {
        Group {
            if let image = sheet.image(index) {
                image
                    .interpolation(.none)
                    .resizable()
                    .aspectRatio(1, contentMode: .fit)
                    .scaleEffect(x: flipped ? -1 : 1, y: 1)
            } else {
                Color.clear.aspectRatio(1, contentMode: .fit)
            }
        }
    }
}
