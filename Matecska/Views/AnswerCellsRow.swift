import SwiftUI

/// A válasz rubrikái egy sorban.
struct AnswerCellsRow: View {
    let session: PracticeSession
    let cellSize: CGFloat
    let spacing: CGFloat

    var body: some View {
        HStack(spacing: spacing) {
            ForEach(0..<session.cellCount, id: \.self) { index in
                AnswerCell(
                    digit: session.cells[index],
                    isSelected: !session.isSubmitted && index == session.selectedIndex,
                    isCorrect: session.outcome?.isCorrect,
                    size: cellSize
                )
                .onTapGesture { session.select(index) }
            }
        }
    }
}

struct AnswerCell: View {
    let digit: Int?
    let isSelected: Bool
    /// `nil` beküldés előtt, utána a válasz helyessége.
    let isCorrect: Bool?
    let size: CGFloat

    private var shape: RoundedRectangle {
        RoundedRectangle(cornerRadius: Theme.cellCornerRadius, style: .continuous)
    }

    var body: some View {
        shape
            .fill(fillColor)
            .overlay(shape.strokeBorder(borderColor, lineWidth: isSelected ? 3 : 2))
            .overlay {
                if let digit {
                    Text(String(digit))
                        .font(Theme.digitFont)
                        .foregroundStyle(textColor)
                }
            }
            .frame(width: size, height: size)
            .contentShape(Rectangle())
            .accessibilityLabel(digit.map { "\($0)" } ?? "üres rubrika")
            .accessibilityAddTraits(isSelected ? .isSelected : [])
    }

    private var fillColor: Color {
        switch isCorrect {
        case true?: return .green.opacity(0.15)
        case false?: return .red.opacity(0.15)
        case nil: return isSelected ? Color.flame.opacity(0.15) : Color.card
        }
    }

    private var borderColor: Color {
        switch isCorrect {
        case true?: return .green
        case false?: return .red
        case nil: return isSelected ? .flame : Color.ink.opacity(0.35)
        }
    }

    private var textColor: Color {
        switch isCorrect {
        case true?: return .green
        case false?: return .red
        case nil: return .ink
        }
    }
}
