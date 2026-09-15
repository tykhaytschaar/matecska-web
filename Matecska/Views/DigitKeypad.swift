import SwiftUI

/// Tíz számjegy-gomb telefonbillentyűzet-elrendezésben, plusz törlés.
struct DigitKeypad: View {
    let isEnabled: Bool
    let onDigit: (Int) -> Void
    let onDelete: () -> Void

    private let rows: [[Int]] = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]

    var body: some View {
        VStack(spacing: 10) {
            ForEach(rows, id: \.self) { row in
                HStack(spacing: 10) {
                    ForEach(row, id: \.self) { digit in
                        digitButton(digit)
                    }
                }
            }
            HStack(spacing: 10) {
                Color.clear
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
                digitButton(0)
                Button(action: onDelete) {
                    Image(systemName: "delete.left")
                        .font(.title2)
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                }
                .buttonStyle(KeypadButtonStyle())
                .accessibilityLabel("Törlés")
            }
        }
        .disabled(!isEnabled)
        .frame(maxWidth: 360)
    }

    private func digitButton(_ digit: Int) -> some View {
        Button {
            onDigit(digit)
        } label: {
            Text(String(digit))
                .font(.system(size: 28, weight: .medium, design: .rounded))
                .frame(maxWidth: .infinity)
                .frame(height: 52)
        }
        .buttonStyle(KeypadButtonStyle())
    }
}

/// Világos kártya-stílusú billentyű, tinta színű felirattal.
private struct KeypadButtonStyle: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundStyle(isEnabled ? Color.ink : Color.ink.opacity(0.3))
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(configuration.isPressed ? Color.flame.opacity(0.25) : Color.card)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .strokeBorder(Color.ink.opacity(isEnabled ? 0.35 : 0.15), lineWidth: 2)
            )
    }
}

#Preview {
    DigitKeypad(isEnabled: true, onDigit: { _ in }, onDelete: {})
        .padding()
}
