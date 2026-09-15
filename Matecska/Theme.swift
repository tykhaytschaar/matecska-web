import SwiftUI

// A színek az Assets.xcassets-ből jönnek; az Xcode generálja a Color.paper, .ink, .card, .bar, .gold, .heart, .flame szimbólumokat.

enum Theme {
    static let cornerRadius: CGFloat = 20
    static let cellCornerRadius: CGFloat = 12

    static var digitFont: Font {
        .system(size: 40, weight: .semibold, design: .rounded).monospacedDigit()
    }

    static var titleFont: Font {
        .system(.title, design: .rounded).weight(.bold)
    }

    static var cardShape: RoundedRectangle {
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
    }
}

/// Keretes kártya a GameBoy-változat keretes dobozainak hangulatában.
struct CardStyle: ViewModifier {
    var padding: CGFloat = 16

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(Color.card, in: Theme.cardShape)
            .overlay(Theme.cardShape.strokeBorder(Color.ink.opacity(0.9), lineWidth: 2))
    }
}

extension View {
    func card(padding: CGFloat = 16) -> some View {
        modifier(CardStyle(padding: padding))
    }
}

/// Nagy, telt gomb a főképernyő menüjéhez és a fő akciókhoz.
struct ChunkyButtonStyle: ButtonStyle {
    var fill: Color = .flame
    var foreground: Color = .white

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(.title3, design: .rounded).weight(.bold))
            .foregroundStyle(foreground)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(fill, in: Theme.cardShape)
            .overlay(Theme.cardShape.strokeBorder(Color.ink.opacity(0.9), lineWidth: 2))
            .opacity(configuration.isPressed ? 0.8 : 1)
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(.easeOut(duration: 0.1), value: configuration.isPressed)
    }
}
