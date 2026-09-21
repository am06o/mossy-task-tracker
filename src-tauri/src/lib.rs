use serde::Serialize;
use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::DialogExt;

fn default_data() -> Value {
    serde_json::json!({ "projects": [] })
}

fn is_valid_data(value: &Value) -> bool {
    value.get("projects").map(|p| p.is_array()).unwrap_or(false)
}

fn data_dir(app: &AppHandle) -> PathBuf {
    let dir = app
        .path()
        .app_data_dir()
        .expect("failed to resolve app data dir");
    let _ = fs::create_dir_all(&dir);
    dir
}

fn data_file(app: &AppHandle) -> PathBuf {
    data_dir(app).join("data.json")
}

fn backup_file(app: &AppHandle) -> PathBuf {
    data_dir(app).join("data.backup.json")
}

// 예전 Electron 버전은 %APPDATA%/mossy 에 data.json을 저장했다(userData 기본값 = productName).
// Tauri는 %APPDATA%/<identifier> 를 쓰므로 새 위치에 파일이 없을 때 한 번만 옛 위치를 찾아본다.
fn legacy_data_file(app: &AppHandle) -> Option<PathBuf> {
    let roaming = data_dir(app).parent()?.to_path_buf();
    Some(roaming.join("mossy").join("data.json"))
}

fn read_data_file(path: &PathBuf) -> Option<Value> {
    let raw = fs::read_to_string(path).ok()?;
    let parsed = serde_json::from_str::<Value>(&raw).ok()?;
    if is_valid_data(&parsed) {
        Some(parsed)
    } else {
        None
    }
}

#[tauri::command]
fn load_data(app: AppHandle) -> Value {
    let file = data_file(&app);
    if let Some(data) = read_data_file(&file) {
        return data;
    }

    if let Some(legacy) = legacy_data_file(&app) {
        if let Some(data) = read_data_file(&legacy) {
            if let Ok(pretty) = serde_json::to_string_pretty(&data) {
                let _ = fs::write(&file, pretty);
            }
            return data;
        }
    }

    default_data()
}

#[tauri::command]
fn save_data(app: AppHandle, data: Value) -> bool {
    let file = data_file(&app);
    if file.exists() {
        let _ = fs::copy(&file, backup_file(&app));
    }
    match serde_json::to_string_pretty(&data) {
        Ok(pretty) => fs::write(&file, pretty).is_ok(),
        Err(_) => false,
    }
}

#[derive(Serialize)]
struct ExportResult {
    ok: bool,
    #[serde(rename = "filePath", skip_serializing_if = "Option::is_none")]
    file_path: Option<String>,
}

#[tauri::command]
fn export_backup(app: AppHandle, data: Value, default_file_name: String) -> ExportResult {
    let picked = app
        .dialog()
        .file()
        .set_title("데이터 내보내기")
        .add_filter("JSON", &["json"])
        .set_file_name(&default_file_name)
        .blocking_save_file();

    let Some(picked) = picked else {
        return ExportResult { ok: false, file_path: None };
    };
    let Ok(path) = picked.into_path() else {
        return ExportResult { ok: false, file_path: None };
    };

    let Ok(pretty) = serde_json::to_string_pretty(&data) else {
        return ExportResult { ok: false, file_path: None };
    };
    match fs::write(&path, pretty) {
        Ok(()) => ExportResult {
            ok: true,
            file_path: Some(path.to_string_lossy().into_owned()),
        },
        Err(_) => ExportResult { ok: false, file_path: None },
    }
}

#[derive(Serialize)]
struct ImportResult {
    ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    data: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

#[tauri::command]
fn import_backup(app: AppHandle) -> ImportResult {
    let picked = app
        .dialog()
        .file()
        .set_title("데이터 불러오기")
        .add_filter("JSON", &["json"])
        .blocking_pick_file();

    let Some(picked) = picked else {
        return ImportResult { ok: false, data: None, error: None };
    };
    let Ok(path) = picked.into_path() else {
        return ImportResult { ok: false, data: None, error: Some("invalid-file".into()) };
    };

    match read_data_file(&path) {
        Some(data) => ImportResult { ok: true, data: Some(data), error: None },
        None => ImportResult { ok: false, data: None, error: Some("invalid-file".into()) },
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            load_data,
            save_data,
            export_backup,
            import_backup
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
