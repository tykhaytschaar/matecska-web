import SwiftUI

@main
struct MatecskaApp: App {
    @State private var store = ProfileStore()

    var body: some Scene {
        WindowGroup {
            HomeView()
                .environment(store)
        }
    }
}
