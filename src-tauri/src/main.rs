// Hides the extra console window when the app is built for release on Windows.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tartiba_lib::run()
}
