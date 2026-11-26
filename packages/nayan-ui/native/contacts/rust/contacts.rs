use serde::{Deserialize, Serialize};
use serde_json::{Value, json};

const TEXT_FIELDS: [&str; 5] = [
    "givenName",
    "middleName",
    "familyName",
    "company",
    "jobTitle",
];

#[derive(Default, Deserialize, Serialize)]
#[serde(default, rename_all = "camelCase", deny_unknown_fields)]
pub(crate) struct Query {
    search: String,
    offset: u32,
    limit: Option<u16>,
}

pub(crate) fn query(value: Value) -> Result<Query, String> {
    let query: Query =
        serde_json::from_value(value).map_err(|_| "Invalid contacts query".to_string())?;
    if query.search.len() > 1024 || !matches!(query.limit.unwrap_or(100), 1..=1000) {
        return Err(
            "Contacts search must fit in 1024 bytes and limit must be between 1 and 1000".into(),
        );
    }
    Ok(query)
}

fn text(value: &Value, max: usize) -> Option<&str> {
    value
        .as_str()
        .map(str::trim)
        .filter(|text| !text.is_empty() && text.len() <= max && !text.contains('\0'))
}

fn fields(data: &mut Value, creating: bool) -> Result<(), String> {
    let data = data
        .as_object_mut()
        .ok_or("Contact fields must be an object")?;
    for (name, value) in data.iter_mut() {
        if TEXT_FIELDS.contains(&name.as_str()) {
            if !value.is_null() {
                let clean = text(value, 1024).ok_or_else(|| format!("Invalid contact {name}"))?;
                *value = json!(clean);
            }
            continue;
        }
        let field = match name.as_str() {
            "phones" => "number",
            "emails" => "email",
            _ => return Err("Unknown contact field".into()),
        };
        let values = value
            .as_array_mut()
            .filter(|values| values.len() <= 50)
            .ok_or("A contact can contain up to 50 phones or emails")?;
        for entry in values {
            let address =
                text(&entry[field], 512).ok_or_else(|| format!("Invalid contact {field}"))?;
            let mut cleaned = json!({(field): address});
            if let Some(label) = entry.get("label") {
                cleaned["label"] = json!(text(label, 128).ok_or("Invalid contact label")?);
            }
            *entry = cleaned;
        }
    }
    if creating
        && !data
            .values()
            .any(|value| value.is_string() || value.as_array().is_some_and(|list| !list.is_empty()))
    {
        return Err(
            "Add a name, organization, phone number, or email before creating a contact".into(),
        );
    }
    Ok(())
}

pub fn prepare(mut command: Value) -> Result<Value, String> {
    let action = command["action"]
        .as_str()
        .ok_or("Missing contacts action")?;
    if matches!(
        action,
        "contacts.get" | "contacts.update" | "contacts.remove"
    ) && !command["id"]
        .as_str()
        .is_some_and(|id| !id.is_empty() && id.len() <= 2048 && !id.chars().any(char::is_control))
    {
        return Err("Invalid contact ID".into());
    }
    match action {
        "contacts.available" | "contacts.get" | "contacts.remove" => {}
        "contacts.list" => {
            let options = command.get("options").cloned().unwrap_or_else(|| json!({}));
            command["options"] =
                serde_json::to_value(query(options)?).expect("contacts query is serializable");
        }
        "contacts.create" | "contacts.update" => {
            let creating = action == "contacts.create";
            fields(&mut command["fields"], creating)?;
        }
        _ => return Err("Unknown contacts action".into()),
    }
    Ok(command)
}

fn name(contact: &Value) -> String {
    let names: Vec<_> = ["givenName", "middleName", "familyName"]
        .iter()
        .filter_map(|key| contact[*key].as_str())
        .collect();
    if names.is_empty() {
        return contact["company"]
            .as_str()
            .unwrap_or_default()
            .to_lowercase();
    }
    names.join(" ").to_lowercase()
}

pub(crate) fn page(rows: Vec<Value>, query: Query) -> Value {
    let needle = query.search.trim().to_lowercase();
    let digits: String = needle.chars().filter(char::is_ascii_digit).collect();
    let search_phone = !digits.is_empty()
        && needle
            .chars()
            .all(|c| c.is_ascii_digit() || "+-(). ".contains(c));
    let mut matching: Vec<_> = rows
        .into_iter()
        .filter_map(|contact| {
            let name = name(&contact);
            let matches = needle.is_empty()
                || name.contains(&needle)
                || ["company", "jobTitle"].iter().any(|field| {
                    contact[*field]
                        .as_str()
                        .is_some_and(|value| value.to_lowercase().contains(&needle))
                })
                || [("phones", "number"), ("emails", "email")]
                    .iter()
                    .any(|(field, key)| {
                        contact[*field].as_array().is_some_and(|values| {
                            values.iter().any(|entry| {
                                entry[*key].as_str().is_some_and(|value| {
                                    value.to_lowercase().contains(&needle)
                                        || (*field == "phones"
                                            && search_phone
                                            && value
                                                .chars()
                                                .filter(char::is_ascii_digit)
                                                .collect::<String>()
                                                .contains(&digits))
                                })
                            })
                        })
                    });
            matches.then_some((name, contact))
        })
        .collect();
    matching.sort_by(|(a, x), (b, y)| {
        a.cmp(b)
            .then_with(|| x["id"].as_str().cmp(&y["id"].as_str()))
    });
    let total = matching.len();
    let limit = usize::from(query.limit.unwrap_or(100));
    let offset = query.offset as usize;
    let data: Vec<_> = matching
        .into_iter()
        .skip(offset)
        .take(limit)
        .map(|(_, row)| row)
        .collect();
    json!({"data": data, "total": total, "hasNextPage": offset.saturating_add(data.len()) < total})
}

#[cfg(any(target_arch = "wasm32", test))]
pub(crate) fn local(mut rows: Vec<Value>, command: Value) -> Result<Value, String> {
    let command = prepare(command)?;
    let action = command["action"]
        .as_str()
        .expect("validated contacts action");
    let index = rows.iter().position(|row| row["id"] == command["id"]);
    let result = match action {
        "contacts.list" => {
            return Ok(json!({"value": page(rows, query(command["options"].clone())?)}));
        }
        "contacts.get" => return Ok(json!({"value": index.map(|index| &rows[index])})),
        "contacts.create" => {
            let mut row =
                json!({"id": uuid::Uuid::new_v4().to_string(), "phones": [], "emails": []});
            apply(&mut row, &command["fields"]);
            rows.push(row.clone());
            row
        }
        "contacts.update" => {
            let Some(index) = index else {
                return Ok(json!({"value": null}));
            };
            apply(&mut rows[index], &command["fields"]);
            rows[index].clone()
        }
        "contacts.remove" => {
            let Some(index) = index else {
                return Ok(json!({"value": false}));
            };
            rows.remove(index);
            json!(true)
        }
        _ => return Err("Unsupported local contacts action".into()),
    };
    Ok(json!({"value": result, "rows": rows}))
}

#[cfg(any(target_arch = "wasm32", test))]
fn apply(row: &mut Value, fields: &Value) {
    let row = row.as_object_mut().expect("contact rows are objects");
    for (name, value) in fields.as_object().expect("validated contact fields") {
        let value = value.clone();
        if value.is_null() {
            row.remove(name);
        } else {
            row.insert(name.clone(), value);
        }
    }
}

#[cfg(test)]
mod tests;
