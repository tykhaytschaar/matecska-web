import SwiftUI

/// Főképernyő: pontszám, a kiválasztott karakter, műveletválasztó és a gyűjtemény.
struct HomeView: View {
    @Environment(ProfileStore.self) private var store

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                hud
                Spacer(minLength: 0)
                CharacterSpriteView(character: store.profile.selectedCharacter)
                    .frame(width: 144, height: 144)
                Text("Mit gyakoroljunk?")
                    .font(Theme.titleFont)
                    .foregroundStyle(Color.ink)
                operationGrid
                Spacer(minLength: 0)
                NavigationLink(value: Destination.collection) {
                    Label("Gyűjtemény", systemImage: "square.grid.2x2.fill")
                }
                .buttonStyle(ChunkyButtonStyle(fill: .bar))
            }
            .padding(24)
            .background(Color.paper.ignoresSafeArea())
            .navigationDestination(for: Destination.self) { destination in
                switch destination {
                case .practice(let operation): PracticeView(operation: operation)
                case .collection: CollectionView()
                }
            }
        }
        .tint(Color.flame)
    }

    private var hud: some View {
        HStack {
            Text("MATECSKA")
                .font(.system(.headline, design: .rounded).weight(.heavy))
                .tracking(2)
                .foregroundStyle(Color.ink)
            Spacer()
            PointsBadge(points: store.profile.totalPoints)
        }
    }

    private var operationGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            ForEach(MathOperation.allCases) { operation in
                NavigationLink(value: Destination.practice(operation)) {
                    VStack(spacing: 6) {
                        Text(operation.symbol)
                            .font(.system(size: 40, weight: .bold, design: .rounded))
                            .foregroundStyle(Color.flame)
                        Text(operation.title)
                            .font(.system(.headline, design: .rounded))
                            .foregroundStyle(Color.ink)
                    }
                    .frame(maxWidth: .infinity)
                    .card(padding: 14)
                }
                .buttonStyle(.plain)
            }
        }
    }

    enum Destination: Hashable {
        case practice(MathOperation)
        case collection
    }
}

#Preview {
    HomeView()
        .environment(ProfileStore(fileURL: nil))
}
