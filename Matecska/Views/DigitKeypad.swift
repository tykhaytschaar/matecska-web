import SwiftUI

/// Tíz számjegy-gomb telefonbillentyűzet-elrendezésben, plusz törlés.
struct DigitKeypad: View {
    let isEnabled: Bool
    let onDigit: (Int) -> Void
    let onDelete: () -> Void

    private let rows: [[Int]] = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]

    var body: some View {
        VStack(spacing: 12) {
            ForEach(rows, id: \.self) { row in
                HStack(spacing: 12) {
                    ForEach(row, id: \.self) { digit in
                        digitButton(digit)
                    }
                }
            }
            HStack(spacing: 12) {
                Color.clear
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                digitButton(0)
                Button(action: onDelete) {
                    Image(systemName: "delete.left")
                        .font(.title2)
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                }
                .buttonStyle(.bordered)
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
                .frame(height: 56)
        }
        .buttonStyle(.bordered)
    }
}

#Preview {
    DigitKeypad(isEnabled: true, onDigit: { _ in }, onDelete: {})
        .padding()
}
