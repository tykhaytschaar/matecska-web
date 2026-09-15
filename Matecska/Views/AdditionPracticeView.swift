import SwiftUI

struct AdditionPracticeView: View {
    @State private var model = AdditionPracticeModel()

    private let cellSize: CGFloat = 60
    private let cellSpacing: CGFloat = 10

    var body: some View {
        VStack(spacing: 28) {
            Spacer(minLength: 0)
            problemColumn
            resultBanner
                .frame(minHeight: 96)
            Spacer(minLength: 0)
            DigitKeypad(
                isEnabled: !model.isSubmitted,
                onDigit: { model.enter(digit: $0) },
                onDelete: { model.deleteDigit() }
            )
            actionButton
        }
        .padding(24)
        .animation(.easeInOut(duration: 0.2), value: model.outcome)
        .animation(.easeInOut(duration: 0.15), value: model.selectedIndex)
    }

    // MARK: - Feladat

    private var problemColumn: some View {
        VStack(alignment: .trailing, spacing: cellSpacing) {
            operandRow(model.exercise.first, prefix: nil)
            operandRow(model.exercise.second, prefix: "+")
            Rectangle()
                .fill(.primary)
                .frame(width: rowWidth, height: 3)
            answerRow
        }
    }

    private var rowWidth: CGFloat {
        CGFloat(AdditionPracticeModel.cellCount) * cellSize
            + CGFloat(AdditionPracticeModel.cellCount - 1) * cellSpacing
    }

    private func operandRow(_ value: Int, prefix: String?) -> some View {
        let digits = Array(String(value))
        let padding = AdditionPracticeModel.cellCount - digits.count
        return HStack(spacing: cellSpacing) {
            ForEach(0..<AdditionPracticeModel.cellCount, id: \.self) { index in
                let digitIndex = index - padding
                Group {
                    if digitIndex >= 0 {
                        Text(String(digits[digitIndex]))
                    } else if index == padding - 1, let prefix {
                        Text(prefix).foregroundStyle(.secondary)
                    } else {
                        Text(" ")
                    }
                }
                .font(digitFont)
                .frame(width: cellSize, height: cellSize)
            }
        }
    }

    private var answerRow: some View {
        HStack(spacing: cellSpacing) {
            ForEach(0..<AdditionPracticeModel.cellCount, id: \.self) { index in
                AnswerCell(
                    digit: model.cells[index],
                    isSelected: !model.isSubmitted && index == model.selectedIndex,
                    outcome: model.outcome,
                    size: cellSize,
                    font: digitFont
                )
                .onTapGesture { model.select(index) }
            }
        }
    }

    private var digitFont: Font {
        .system(size: 40, weight: .semibold, design: .rounded).monospacedDigit()
    }

    // MARK: - Eredmény

    @ViewBuilder
    private var resultBanner: some View {
        switch model.outcome {
        case nil:
            EmptyView()
        case .correct:
            Label("Helyes!", systemImage: "checkmark.circle.fill")
                .font(.title2.weight(.semibold))
                .foregroundStyle(.white)
                .padding(.horizontal, 24)
                .padding(.vertical, 14)
                .background(.green, in: Capsule())
        case .wrong(let correctAnswer):
            VStack(spacing: 6) {
                Label("Helytelen", systemImage: "xmark.circle.fill")
                    .font(.title2.weight(.semibold))
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text("A helyes válasz:")
                        .font(.body)
                    Text(String(correctAnswer))
                        .font(.system(size: 32, weight: .bold, design: .rounded).monospacedDigit())
                }
            }
            .foregroundStyle(.white)
            .multilineTextAlignment(.center)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity)
            .padding(.horizontal, 24)
            .padding(.vertical, 14)
            .background(.red, in: RoundedRectangle(cornerRadius: 20))
        }
    }

    // MARK: - Gomb

    @ViewBuilder
    private var actionButton: some View {
        if model.isSubmitted {
            Button {
                model.nextExercise()
            } label: {
                Label("Következő", systemImage: "arrow.right")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
        } else {
            Button {
                model.submit()
            } label: {
                Label("Beküldés", systemImage: "paperplane.fill")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .disabled(!model.canSubmit)
        }
    }
}

// MARK: - Rubrika

private struct AnswerCell: View {
    let digit: Int?
    let isSelected: Bool
    let outcome: AdditionPracticeModel.Outcome?
    let size: CGFloat
    let font: Font

    var body: some View {
        RoundedRectangle(cornerRadius: 12)
            .fill(fillColor)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .strokeBorder(borderColor, lineWidth: isSelected ? 3 : 1.5)
            )
            .overlay {
                if let digit {
                    Text(String(digit))
                        .font(font)
                        .foregroundStyle(textColor)
                }
            }
            .frame(width: size, height: size)
            .contentShape(Rectangle())
            .accessibilityLabel(digit.map { "\($0)" } ?? "üres rubrika")
            .accessibilityAddTraits(isSelected ? .isSelected : [])
    }

    private var fillColor: Color {
        switch outcome {
        case .correct: return .green.opacity(0.15)
        case .wrong: return .red.opacity(0.15)
        case nil: return isSelected ? Color.accentColor.opacity(0.12) : Color(.secondarySystemBackground)
        }
    }

    private var borderColor: Color {
        switch outcome {
        case .correct: return .green
        case .wrong: return .red
        case nil: return isSelected ? .accentColor : Color(.separator)
        }
    }

    private var textColor: Color {
        switch outcome {
        case .correct: return .green
        case .wrong: return .red
        case nil: return .primary
        }
    }
}

#Preview {
    AdditionPracticeView()
}
