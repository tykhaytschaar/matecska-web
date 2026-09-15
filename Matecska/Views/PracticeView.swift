import SwiftUI

/// Gyakorlás egy művelettel: feladat, rubrikák, billentyűzet, beküldés és visszajelzés.
struct PracticeView: View {
    @Environment(ProfileStore.self) private var store
    @State private var session: PracticeSession
    @State private var mood: CharacterSpriteView.Mood = .idle

    init(operation: MathOperation) {
        _session = State(initialValue: PracticeSession(operation: operation))
    }

    var body: some View {
        VStack(spacing: 16) {
            Spacer(minLength: 0)
            ProblemView(session: session)
            BonusBar(session: session)
                .frame(maxWidth: 280)
            // Mindig foglalt hely: az eredmény megjelenése nem tolja el a feladatot.
            resultBanner
                .frame(height: Self.bannerHeight)
            Spacer(minLength: 0)
            DigitKeypad(
                isEnabled: !session.isSubmitted,
                onDigit: { session.enter(digit: $0) },
                onDelete: { session.deleteDigit() }
            )
            actionButton
        }
        .padding(.horizontal, 24)
        .padding(.bottom, 16)
        .background(Color.paper.ignoresSafeArea())
        .navigationTitle(session.operation.title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                HStack(spacing: 10) {
                    CharacterSpriteView(character: store.profile.selectedCharacter, mood: mood)
                        .frame(width: 36, height: 36)
                    PointsBadge(points: store.profile.totalPoints, compact: true)
                }
            }
        }
        .animation(.easeInOut(duration: 0.2), value: session.outcome)
        .animation(.easeInOut(duration: 0.15), value: session.selectedIndex)
    }

    private static let bannerHeight: CGFloat = 88

    // MARK: - Eredmény

    @ViewBuilder
    private var resultBanner: some View {
        switch session.outcome {
        case nil:
            EmptyView()
        case .correct(let score):
            VStack(spacing: 4) {
                Label("Helyes!  +\(score.total) pont", systemImage: "checkmark.circle.fill")
                    .font(.title3.weight(.bold))
                Text(score.bonus > 0 ? "\(score.base) alap + \(score.bonus) gyorsasági bónusz" : "\(score.base) alap pont")
                    .font(.subheadline)
                    .opacity(0.9)
            }
            .foregroundStyle(.white)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity)
            .padding(.horizontal, 20)
            .padding(.vertical, 10)
            .frame(maxHeight: Self.bannerHeight)
            .background(.green, in: Theme.cardShape)
        case .wrong(let correctAnswer, let score):
            VStack(spacing: 6) {
                Label("Helytelen  −\(score.penalty) pont", systemImage: "xmark.circle.fill")
                    .font(.title3.weight(.bold))
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text("A helyes válasz:")
                        .font(.body)
                    Text(String(correctAnswer))
                        .font(.system(size: 28, weight: .bold, design: .rounded).monospacedDigit())
                }
            }
            .foregroundStyle(.white)
            .multilineTextAlignment(.center)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity)
            .padding(.horizontal, 20)
            .padding(.vertical, 10)
            .frame(maxHeight: Self.bannerHeight)
            .background(.red, in: Theme.cardShape)
        }
    }

    // MARK: - Gomb

    @ViewBuilder
    private var actionButton: some View {
        if session.isSubmitted {
            Button {
                mood = .idle
                session.nextExercise()
            } label: {
                Label("Következő", systemImage: "arrow.right")
            }
            .buttonStyle(ChunkyButtonStyle(fill: .flame))
        } else {
            Button(action: submit) {
                Label("Beküldés", systemImage: "paperplane.fill")
            }
            .buttonStyle(ChunkyButtonStyle(fill: session.canSubmit ? .flame : Color.ink.opacity(0.25)))
            .disabled(!session.canSubmit)
        }
    }

    private func submit() {
        guard let outcome = session.submit() else { return }
        mood = outcome.isCorrect ? .happy : .yuck
        withAnimation {
            store.record(outcome.score, correct: outcome.isCorrect, for: session.operation)
        }
    }
}

#Preview {
    NavigationStack {
        PracticeView(operation: .division)
    }
    .environment(ProfileStore(fileURL: nil))
}
