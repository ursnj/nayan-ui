//! SQLite connection policy and wire format shared by the native and browser workers.
use rusqlite::{
    Batch, Connection, OpenFlags, Statement as PreparedStatement, TransactionBehavior,
    fallible_iterator::FallibleIterator,
    hooks::{AuthAction, AuthContext, Authorization},
    params_from_iter,
    types::{Value as SqlValue, ValueRef},
};
use serde::Deserialize;
use serde_json::{Value, json};
use std::{
    collections::HashMap,
    sync::{
        Arc,
        atomic::{AtomicBool, Ordering},
    },
};

pub const MAX_REQUEST: usize = 16 * 1024 * 1024;
const MAX_SAFE_INTEGER: i64 = 9_007_199_254_740_991;
const FLAGS: OpenFlags = OpenFlags::SQLITE_OPEN_READ_WRITE.union(OpenFlags::SQLITE_OPEN_CREATE);

#[derive(Deserialize)]
#[serde(tag = "op", rename_all = "camelCase")]
pub enum Command {
    Open { name: Option<String> },
    Close { handle: u32 },
    Run { handle: u32, statement: Statement },
    Query { handle: u32, statement: Statement },
    Batch { handle: u32, statements: Vec<Statement> },
}

#[derive(Deserialize)]
pub struct Statement {
    sql: String,
    params: Vec<Value>,
}

pub fn parse(raw: &[u8]) -> Result<Command, String> {
    if raw.len() > MAX_REQUEST {
        return Err("SQLite command exceeds 16 MiB".into());
    }
    serde_json::from_slice(raw).map_err(|error| error.to_string())
}

pub fn response(value: Result<Value, String>) -> String {
    match value {
        Ok(value) => json!({"ok": true, "value": value}),
        Err(error) => json!({"ok": false, "error": error}),
    }
    .to_string()
}

pub fn database_name(name: &str) -> Result<String, String> {
    if name.is_empty() || name.len() > 128 || name.contains('\0') {
        return Err("SQLite database name must contain 1–128 UTF-8 bytes and no NUL".into());
    }
    Ok(crate::fingerprint::fingerprint(&[name.as_bytes()]))
}

fn parameter(value: Value) -> Result<SqlValue, String> {
    match value {
        Value::Null => Ok(SqlValue::Null),
        Value::Number(value) => {
            if let Some(integer) = value.as_i64() {
                if (-MAX_SAFE_INTEGER..=MAX_SAFE_INTEGER).contains(&integer) {
                    return Ok(SqlValue::Integer(integer));
                }
                return Err("Use bigint for SQLite integers outside JavaScript's safe range".into());
            }
            value.as_f64().map(SqlValue::Real).ok_or_else(|| "Invalid SQLite number".into())
        }
        Value::String(value) => Ok(SqlValue::Text(value)),
        Value::Object(mut value) if value.len() == 1 => {
            if let Some(Value::String(integer)) = value.remove("integer") {
                return integer
                    .parse::<i64>()
                    .map(SqlValue::Integer)
                    .map_err(|_| "SQLite integer is outside the signed 64-bit range".into());
            }
            if let Some(bytes) = value.remove("blob") {
                return serde_json::from_value::<Vec<u8>>(bytes)
                    .map(SqlValue::Blob)
                    .map_err(|_| "Invalid SQLite blob".into());
            }
            Err("Invalid SQLite parameter".into())
        }
        _ => Err("Invalid SQLite parameter".into()),
    }
}

fn cell(value: ValueRef<'_>) -> Result<Value, String> {
    Ok(match value {
        ValueRef::Null => Value::Null,
        ValueRef::Integer(value) if (-MAX_SAFE_INTEGER..=MAX_SAFE_INTEGER).contains(&value) => json!(value),
        ValueRef::Integer(value) => json!({"integer": value.to_string()}),
        ValueRef::Real(value) if value.is_finite() => json!(value),
        ValueRef::Real(value) => json!({"real": if value.is_sign_negative() { "-Infinity" } else { "Infinity" }}),
        ValueRef::Text(value) => json!(std::str::from_utf8(value).map_err(|_| "SQLite returned invalid UTF-8 text")?),
        ValueRef::Blob(value) => json!({"blob": value}),
    })
}

struct Database {
    connection: Connection,
    transaction_control: Arc<AtomicBool>,
}

impl Database {
    fn new(mut connection: Connection) -> rusqlite::Result<Self> {
        connection.pragma_update(None, "foreign_keys", true)?;
        let transaction_control = Arc::new(AtomicBool::new(false));
        let internal = transaction_control.clone();
        connection.authorizer(Some(move |ctx: AuthContext<'_>| match ctx.action {
            AuthAction::Attach { .. } | AuthAction::Detach { .. } => Authorization::Deny,
            AuthAction::Transaction { .. } | AuthAction::Savepoint { .. } if !internal.load(Ordering::Relaxed) => Authorization::Deny,
            AuthAction::Pragma {
                pragma_name,
                pragma_value: Some(_),
            } if ![
                "application_id",
                "user_version",
                "table_info",
                "table_xinfo",
                "index_list",
                "index_info",
                "index_xinfo",
                "foreign_key_list",
                "foreign_key_check",
                "integrity_check",
                "quick_check",
            ]
            .iter()
            .any(|name| pragma_name.eq_ignore_ascii_case(name)) =>
            {
                Authorization::Deny
            }
            AuthAction::Pragma { pragma_name, .. }
                if ["optimize", "wal_checkpoint", "incremental_vacuum", "shrink_memory"]
                    .iter()
                    .any(|name| pragma_name.eq_ignore_ascii_case(name)) =>
            {
                Authorization::Deny
            }
            _ => Authorization::Allow,
        }))?;
        Ok(Self {
            connection,
            transaction_control,
        })
    }

    fn run(connection: &Connection, statement: Statement) -> Result<Value, String> {
        let params = statement.params.into_iter().map(parameter).collect::<Result<Vec<_>, _>>()?;
        let before = connection.total_changes();
        let mut prepared = prepare(connection, &statement.sql)?;
        if prepared.column_count() != 0 {
            return Err("run requires a SQL statement that returns no rows".into());
        }
        let changes = prepared.execute(params_from_iter(params)).map_err(|error| error.to_string())?;
        Ok(json!({"changes": if connection.total_changes() == before { 0 } else { changes }}))
    }

    fn query(&self, statement: Statement) -> Result<Value, String> {
        let params = statement.params.into_iter().map(parameter).collect::<Result<Vec<_>, _>>()?;
        let mut prepared = prepare(&self.connection, &statement.sql)?;
        if !prepared.readonly() || prepared.column_count() == 0 {
            return Err("query requires a read-only SQL statement that returns rows".into());
        }
        let columns = prepared.column_names().map(str::to_owned).collect::<Vec<_>>();
        let mut curs = prepared.query(params_from_iter(params)).map_err(|error| error.to_string())?;
        let mut rows = Vec::new();
        while let Some(row) = curs.next().map_err(|error| error.to_string())? {
            let mut values = Vec::with_capacity(columns.len());
            for i in 0..columns.len() {
                values.push(cell(row.get_ref(i).map_err(|error| error.to_string())?)?);
            }
            rows.push(values);
        }
        Ok(json!({ "columns": columns, "rows": rows }))
    }

    fn batch(&mut self, statements: Vec<Statement>) -> Result<Value, String> {
        self.transaction_control.store(true, Ordering::Relaxed);
        let transaction = self.connection.transaction_with_behavior(TransactionBehavior::Immediate);
        self.transaction_control.store(false, Ordering::Relaxed);
        let transaction = transaction.map_err(|error| error.to_string())?;
        let results = statements
            .into_iter()
            .map(|statement| Self::run(&transaction, statement))
            .collect::<Result<Vec<_>, _>>();
        self.transaction_control.store(true, Ordering::Relaxed);
        let result = match results {
            Ok(results) => transaction.commit().map(|()| json!(results)).map_err(|error| error.to_string()),
            Err(error) => {
                drop(transaction); // Roll back the entire batch, including schema changes.
                Err(error)
            }
        };
        self.transaction_control.store(false, Ordering::Relaxed);
        result
    }
}

fn prepare<'a>(connection: &'a Connection, sql: &str) -> Result<PreparedStatement<'a>, String> {
    let mut statements = Batch::new(connection, sql);
    let statement = statements.next().map_err(|error| error.to_string())?.ok_or("SQL statement is empty")?;
    if statements.next().map_err(|error| error.to_string())?.is_some() {
        return Err("Expected a single SQL statement".into());
    }
    Ok(statement)
}

#[derive(Default)]
pub struct Session {
    next_handle: u32,
    databases: HashMap<u32, Database>,
}

impl Session {
    pub fn open(&mut self, connection: Connection) -> Result<Value, String> {
        let db = Database::new(connection).map_err(|error| error.to_string())?;
        let handle = self.next_handle.checked_add(1).ok_or("SQLite connection IDs exhausted")?;
        self.next_handle = handle;
        self.databases.insert(handle, db);
        Ok(json!(handle))
    }

    pub fn request(&mut self, command: Command) -> Result<Value, String> {
        match command {
            Command::Open { name } => self.open(open_native_or_memory(name.as_deref())?),
            Command::Close { handle } => {
                self.databases.remove(&handle).ok_or("SQLite connection is closed")?;
                Ok(Value::Null)
            }
            Command::Run { handle, statement } => Database::run(&self.get(handle)?.connection, statement),
            Command::Query { handle, statement } => self.get(handle)?.query(statement),
            Command::Batch { handle, statements } => self.get(handle)?.batch(statements),
        }
    }

    fn get(&mut self, handle: u32) -> Result<&mut Database, String> {
        self.databases.get_mut(&handle).ok_or_else(|| "SQLite connection is closed".into())
    }
}

#[cfg(not(target_arch = "wasm32"))]
static DIRECTORY: std::sync::OnceLock<std::path::PathBuf> = std::sync::OnceLock::new();

#[cfg(not(target_arch = "wasm32"))]
pub fn set_directory(path: &str) {
    let _ = DIRECTORY.set(std::path::Path::new(path).join("nayan-engine-sqlite-v1"));
}

fn open_native_or_memory(name: Option<&str>) -> Result<Connection, String> {
    let Some(name) = name else {
        return Connection::open_in_memory().map_err(|error| error.to_string());
    };
    #[cfg(not(target_arch = "wasm32"))]
    {
        let name = database_name(name)?;
        let directory = DIRECTORY.get().ok_or("SQLite app-private directory is unavailable")?;
        std::fs::create_dir_all(directory).map_err(|error| error.to_string())?;
        Connection::open_with_flags(directory.join(format!("{name}.sqlite")), FLAGS).map_err(|error| error.to_string())
    }
    #[cfg(target_arch = "wasm32")]
    {
        let _ = name;
        Err("Open a named SQLite database through the OPFS worker".into())
    }
}

#[cfg(target_arch = "wasm32")]
pub async fn open_opfs(name: &str) -> Result<(Connection, sqlite_wasm_vfs::sahpool::OpfsSAHPoolUtil), String> {
    use sqlite_wasm_vfs::sahpool::{OpfsSAHPoolCfgBuilder, install};
    let directory = format!("nayan-engine-sqlite-v1/{}", database_name(name)?);
    let options = OpfsSAHPoolCfgBuilder::new().directory(&directory).build();
    let pool = install::<sqlite_wasm_rs::WasmOsCallback>(&options, false)
        .await
        .map_err(|error| error.to_string())?;
    let connection = Connection::open_with_flags_and_vfs("/database.sqlite", FLAGS, "opfs-sahpool").map_err(|error| error.to_string())?;
    Ok((connection, pool))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn named_databases_keep_their_original_fingerprint() {
        assert_eq!(
            database_name("notes-Δ").unwrap(),
            "a59f6be1ac9ab26ed82fc0cc397b43231952de00ea7703c857fbecf670c4f9df"
        );
    }

    #[test]
    fn sqlite_binds_values_preserves_column_order_and_rolls_back_batch_errors() {
        let mut session = Session::default();
        let mut request = |command: Value| session.request(serde_json::from_value(command).unwrap());
        let db = request(json!({"op": "open"})).unwrap();
        let run = |sql: &str, params: Value| json!({"op": "run", "handle": db, "statement": { "sql": sql, "params": params }});
        let query = |sql: &str| json!({"op": "query", "handle": db, "statement": { "sql": sql, "params": [] }});
        request(run("CREATE TABLE items (id INTEGER PRIMARY KEY, bytes BLOB)", json!([]))).unwrap();
        let integer = json!({"integer": "9223372036854775807"});
        let blob = json!({"blob": [0, 128, 255]});
        assert_eq!(
            request(run("INSERT INTO items VALUES (?, ?)", json!([integer, blob]))).unwrap(),
            json!({"changes": 1})
        );
        assert_eq!(
            request(query("SELECT id AS value, bytes AS value FROM items")).unwrap(),
            json!({"columns": ["value", "value"], "rows": [[integer, blob]]})
        );
        assert!(
            request(json!({"op": "batch", "handle": db, "statements": [
                {"sql": "INSERT INTO items (id) VALUES (4)", "params": []},
                {"sql": "INSERT INTO items (id) VALUES (4)", "params": []}
            ]}))
            .is_err()
        );
        assert!(request(run("SELECT 1; INSERT INTO items(id) VALUES (5)", json!([]))).is_err());
        assert!(request(query("DELETE FROM items RETURNING id")).is_err());
        assert_eq!(request(query("SELECT count(*) FROM items")).unwrap()["rows"], json!([[1]]));
        request(json!({"op": "close", "handle": db})).unwrap();
        assert!(request(query("SELECT 1")).is_err());
    }
}
