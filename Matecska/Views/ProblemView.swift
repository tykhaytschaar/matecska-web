import SwiftUI

/// A feladat kirajzolása a művelet elrendezése szerint, a rubrikákkal együtt.
struct ProblemView: View {
    let session: PracticeSession

    private let cellSize: CGFloat = 56
    private let spacing: CGFloat = 8

    private var exercise: Exercise { session.exercise }
    private var operation: MathOperation { session.operation }

    var body: some View {
        switch operation.layout {
        case .stacked: stacked
        case .productRow: productRow
        case .equationRow: equationRow
        }
    }

    // MARK: - Egymás alatt (összeadás, kivonás)

    private var stacked: some View {
        VStack(alignment: .trailing, spacing: spacing) {
            digitRow(exercise.first, prefix: nil)
            digitRow(exercise.second, prefix: operation.symbol)
            rule
            AnswerCellsRow(session: session, cellSize: cellSize, spacing: spacing)
        }
    }

    /// Oszlopok száma az egymás alatti elrendezésben: a rubrikák, de legalább annyi,
    /// hogy a leghosszabb operandus előtt az előjelnek is jusson egy oszlop.
    private var stackedColumns: Int {
        let longest = exercise.operands.map { String($0).count }.max() ?? 0
        return max(session.cellCount, longest + 1)
    }

    /// Egy szám jobbra igazítva, rubrikaszélességű oszlopokban; az előjel a szám elé kerül.
    private func digitRow(_ value: Int, prefix: String?) -> some View {
        let digits = Array(String(value))
        let padding = stackedColumns - digits.count
        return HStack(spacing: spacing) {
            ForEach(0..<stackedColumns, id: \.self) { index in
                let digitIndex = index - padding
                Group {
                    if digitIndex >= 0 {
                        Text(String(digits[digitIndex]))
                    } else if index == padding - 1, let prefix {
                        Text(prefix).foregroundStyle(Color.flame)
                    } else {
                        Text(" ")
                    }
                }
                .font(Theme.digitFont)
                .foregroundStyle(Color.ink)
                .frame(width: cellSize, height: cellSize)
            }
        }
    }

    // MARK: - Szorzás: `352 · 6` egy sorban, alatta a rubrikák

    private var productRow: some View {
        VStack(alignment: .trailing, spacing: spacing) {
            HStack(spacing: 14) {
                Text(String(exercise.first))
                Text(operation.symbol).foregroundStyle(Color.flame)
                Text(String(exercise.second))
            }
            .font(Theme.digitFont)
            .foregroundStyle(Color.ink)
            .frame(height: cellSize)
            rule
            AnswerCellsRow(session: session, cellSize: cellSize, spacing: spacing)
        }
    }

    // MARK: - Osztás: `456 : 8 =` és a rubrikák egy sorban

    private var equationRow: some View {
        let compactCell: CGFloat = 52
        return HStack(spacing: 10) {
            Text(String(exercise.first))
            Text(operation.symbol).foregroundStyle(Color.flame)
            Text(String(exercise.second))
            Text("=").foregroundStyle(Color.flame)
            AnswerCellsRow(session: session, cellSize: compactCell, spacing: 6)
        }
        .font(Theme.digitFont)
        .foregroundStyle(Color.ink)
        .minimumScaleFactor(0.7)
        .lineLimit(1)
    }

    private var rowWidth: CGFloat {
        let columns = operation.layout == .stacked ? stackedColumns : session.cellCount
        return CGFloat(columns) * cellSize + CGFloat(columns - 1) * spacing
    }

    private var rule: some View {
        Rectangle()
            .fill(Color.ink)
            .frame(width: rowWidth, height: 3)
    }
}
