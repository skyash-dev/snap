use dotenvy_macro::dotenv;
use readability::{extract, ExtractOptions};
use reqwest;
use scraper::{Html, Selector};
use std::io::Cursor;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WebviewWindow,
};
use tauri_plugin_aptabase::EventTracker;
use tauri_plugin_sql::{Migration, MigrationKind};
use url::Url;

#[tauri::command]
async fn fetch_clean_content(url: String) -> Result<String, String> {
    let response = reqwest::get(&url).await.map_err(|e| e.to_string())?;
    let html = response.text().await.map_err(|e| e.to_string())?;
    let parsed_url = Url::parse(&url).map_err(|e| e.to_string())?;

    let mut html_cursor = Cursor::new(html.into_bytes());

    let options = ExtractOptions::default();
    let article = extract(&mut html_cursor, &parsed_url, options).map_err(|e| e.to_string())?;

    // Use scraper to strip HTML tags
    let document = Html::parse_document(&article.content);
    let selector = Selector::parse("body").unwrap(); // Select body content

    let plain_text = document
        .select(&selector)
        .map(|element| element.text().collect::<Vec<_>>().join(" "))
        .collect::<String>();

    Ok(plain_text)
}

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
    let migrations = vec![Migration {
        version: 1,
        description: "create snaps table",
        sql: "
            CREATE TABLE IF NOT EXISTS snaps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            content_type TEXT NOT NULL,
            tags TEXT,
            created_at TEXT NOT NULL,
            embedding TEXT
        );
            ",
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:snap.db", migrations)
                .build(),
        )
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
            let _ = app.track_event("app_started", None);

            #[cfg(desktop)]
            {
                use tauri_plugin_autostart::MacosLauncher;
                use tauri_plugin_autostart::ManagerExt;

                let _ = app.handle().plugin(tauri_plugin_autostart::init(
                    MacosLauncher::LaunchAgent,
                    Some(vec!["--flag1", "--flag2"]),
                ));

                // Get the autostart manager
                let autostart_manager = app.autolaunch();
                // Enable autostart
                let _ = autostart_manager.enable();

                use tauri_plugin_global_shortcut::{
                    Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState,
                };

                let ctrl_alt_s_shortcut =
                    Shortcut::new(Some(Modifiers::CONTROL | Modifiers::ALT), Code::KeyS);
                app.handle().plugin(
                    tauri_plugin_global_shortcut::Builder::new()
                        .with_handler(move |_app, shortcut, event| {
                            // println!("{:?}", shortcut);
                            if shortcut == &ctrl_alt_s_shortcut {
                                match event.state() {
                                    ShortcutState::Pressed => {}
                                    ShortcutState::Released => {
                                        if let Some(window) = _app.get_webview_window("main") {
                                            let _ = window.show();
                                            let _ = window.set_focus();
                                            let _ = center_cursor(&window);
                                        }
                                    }
                                }
                            }
                        })
                        .build(),
                )?;

                app.global_shortcut().register(ctrl_alt_s_shortcut)?;
            }

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
        .plugin(tauri_plugin_aptabase::Builder::new(dotenv!("APTABASE_KEY")).build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![fetch_clean_content])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
