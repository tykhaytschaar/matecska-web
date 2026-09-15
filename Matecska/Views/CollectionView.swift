import SwiftUI

/// A megszerzett karakterek gyűjteménye; itt lehet választani közülük.
struct CollectionView: View {
    @Environment(ProfileStore.self) private var store

    var body: some View {
        ScrollView {
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                ForEach(GameCharacter.catalog) { character in
                    characterCard(character)
                }
                comingSoonCard
            }
            .padding(24)
        }
        .background(Color.paper.ignoresSafeArea())
        .navigationTitle("Gyűjtemény")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                PointsBadge(points: store.profile.totalPoints, compact: true)
            }
        }
    }

    private func characterCard(_ character: GameCharacter) -> some View {
        let owned = store.profile.owns(character)
        let selected = store.profile.selectedCharacterID == character.id
        return Button {
            store.select(character)
        } label: {
            VStack(spacing: 10) {
                CharacterSpriteView(character: character, mood: selected ? .happy : .idle)
                    .frame(width: 96, height: 96)
                    .saturation(owned ? 1 : 0)
                    .opacity(owned ? 1 : 0.5)
                Text(character.name)
                    .font(.system(.headline, design: .rounded))
                    .foregroundStyle(Color.ink)
                if owned {
                    Label(selected ? "Kiválasztva" : "Választ", systemImage: selected ? "checkmark.circle.fill" : "circle")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(selected ? Color.flame : Color.ink.opacity(0.6))
                } else {
                    Label("\(character.price) pont", systemImage: "lock.fill")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Color.ink.opacity(0.6))
                }
            }
            .frame(maxWidth: .infinity)
            .card()
            .overlay(Theme.cardShape.strokeBorder(Color.flame, lineWidth: selected ? 3 : 0))
        }
        .buttonStyle(.plain)
        .disabled(!owned)
    }

    private var comingSoonCard: some View {
        VStack(spacing: 10) {
            Image(systemName: "sparkles")
                .font(.system(size: 40))
                .foregroundStyle(Color.gold)
                .frame(width: 96, height: 96)
            Text("Hamarosan")
                .font(.system(.headline, design: .rounded))
                .foregroundStyle(Color.ink.opacity(0.6))
            Text("Új karakterek pontért")
                .font(.subheadline)
                .foregroundStyle(Color.ink.opacity(0.5))
        }
        .frame(maxWidth: .infinity)
        .padding(16)
        .background(Color.card.opacity(0.5), in: Theme.cardShape)
        .overlay(Theme.cardShape.strokeBorder(Color.ink.opacity(0.3), style: StrokeStyle(lineWidth: 2, dash: [8, 6])))
    }
}

#Preview {
    NavigationStack { CollectionView() }
        .environment(ProfileStore(fileURL: nil))
}
