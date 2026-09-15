import SwiftUI

/// Vékony csík, ami mutatja, mennyi sebességbónusz jár még. Beküldés után megáll.
struct BonusBar: View {
    let session: PracticeSession

    var body: some View {
        TimelineView(.animation(minimumInterval: 0.1, paused: session.isSubmitted)) { context in
            let timing = session.operation.bonusTiming
            let elapsed = session.elapsed(at: context.date)
            let fraction = Scoring.bonusFraction(elapsed: elapsed, timing: timing)
            HStack(spacing: 8) {
                Image(systemName: "bolt.fill")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(fraction > 0 ? Color.flame : Color.ink.opacity(0.3))
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        Capsule().fill(Color.ink.opacity(0.12))
                        Capsule()
                            .fill(Color.flame)
                            .frame(width: geometry.size.width * fraction)
                    }
                }
                .frame(height: 8)
                Text("+\(Scoring.bonus(elapsed: elapsed, timing: timing))")
                    .font(.caption.weight(.bold).monospacedDigit())
                    .foregroundStyle(fraction > 0 ? Color.flame : Color.ink.opacity(0.3))
                    .frame(width: 32, alignment: .trailing)
            }
        }
        .accessibilityHidden(true)
    }
}
