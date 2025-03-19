use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WebviewWindow,
};

fn center_cursor(window: &WebviewWindow) -> Result<(), Box<dyn std::error::Error>> {
    // Get the window's current size
    let size = window.inner_size()?;

    // Calculate the center position
    let center_x = size.width as f64 / 2.0;
    let center_y = size.height as f64 / 2.0;

    // Set the cursor position to the center of the window
    window.set_cursor_position(tauri::Position::Logical(tauri::LogicalPosition::new(
        center_x, center_y,
    )))?;

    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::Focused(focused) => {
                // hide window whenever it loses focus
                if !focused {
                    window.hide().unwrap();
                }
            }
            _ => {}
        })
        .setup(|app| {
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let open_i = MenuItem::with_id(app, "open", "Open", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&open_i, &quit_i])?;
            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_tray_icon_event(|tray, event| match event {
                    TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } => {
                        // println!("left click pressed and released");
                        // in this example, let's show and focus the main window when the tray is clicked
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = center_cursor(&window);
                        }
                    }
                    _ => {
                        // println!("unhandled event {event:?}");
                    }
                })
                .on_menu_event(|app: &tauri::AppHandle, event| match event.id.as_ref() {
                    "quit" => {
                        // println!("quit menu item was clicked");
                        app.exit(0);
                    }
                    "open" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                            let _ = center_cursor(&window);
                        }
                    }
                    _ => {
                        // println!("menu item {:?} not handled", event.id);
                    }
                })
                .icon(app.default_window_icon().unwrap().clone())
                .build(app)?;
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
