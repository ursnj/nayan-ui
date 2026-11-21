//! SQLite browser worker bindings and OPFS session lifecycle.

use wasm_bindgen::prelude::*;

#[cfg(feature = "sqlite")]
thread_local! {
    static SQLITE: std::cell::RefCell<crate::sqlite::Session> = Default::default();
    static SQLITE_POOL: std::cell::RefCell<Option<sqlite_wasm_vfs::sahpool::OpfsSAHPoolUtil>> = const { std::cell::RefCell::new(None) };
}

#[wasm_bindgen]
pub async fn sqlite_open(name: Option<String>) -> Result<u32, JsValue> {
    #[cfg(feature = "sqlite")]
    {
        let value = match name {
            Some(name) => {
                let (connection, pool) = crate::sqlite::open_opfs(&name).await.map_err(|error| JsValue::from_str(&error))?;
                SQLITE_POOL.set(Some(pool));
                SQLITE.with_borrow_mut(|session| session.open(connection))
            }
            None => SQLITE.with_borrow_mut(|session| session.request(crate::sqlite::Command::Open { name: None })),
        };
        return value
            .map(|value| value.as_u64().unwrap() as u32)
            .map_err(|error| JsValue::from_str(&error));
    }
    #[cfg(not(feature = "sqlite"))]
    {
        let _ = name;
        Err(JsValue::from_str("SQLite was disabled in this engine build"))
    }
}

#[wasm_bindgen]
pub fn sqlite_request(command: &str) -> String {
    #[cfg(feature = "sqlite")]
    return crate::sqlite::response(crate::sqlite::parse(command.as_bytes()).and_then(|command| {
        let closing = matches!(&command, crate::sqlite::Command::Close { .. });
        let result = SQLITE.with_borrow_mut(|session| session.request(command))?;
        if closing && let Some(pool) = SQLITE_POOL.take() {
            pool.pause().map_err(|error| error.to_string())?;
        }
        Ok(result)
    }));
    #[cfg(not(feature = "sqlite"))]
    {
        let _ = command;
        serde_json::json!({"ok": false, "error": "SQLite was disabled in this engine build"}).to_string()
    }
}
