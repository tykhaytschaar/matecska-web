import SwiftUI

/// Pontszám-kijelző a HUD-sávban.
struct PointsBadge: View {
    let points: Int
    var compact = false

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: "star.fill")
                .foregroundStyle(Color.gold)
            Text(points, format: .number)
                .font(.system(compact ? .headline : .title2, design: .rounded).weight(.bold).monospacedDigit())
                .contentTransition(.numericText())
        }
        .foregroundStyle(.white)
        .padding(.horizontal, compact ? 12 : 16)
        .padding(.vertical, compact ? 6 : 10)
        .background(Color.bar, in: Capsule())
        .accessibilityLabel("\(points) pont")
    }
}
