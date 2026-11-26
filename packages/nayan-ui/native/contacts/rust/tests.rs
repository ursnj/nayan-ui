use super::*;

#[test]
fn validates_options_and_sanitizes_contact_fields() {
    assert!(prepare(json!({"action":"contacts.list","options":{"limit":0}})).is_err());
    assert!(prepare(json!({"action":"contacts.list","options":{"offset":-1}})).is_err());
    assert!(prepare(json!({"action":"contacts.create","fields":{"phones":[]}})).is_err());
    assert!(prepare(json!({"action":"contacts.create","fields":{"emails":[null]}})).is_err());
    assert!(
        prepare(
            json!({"action":"contacts.create","fields":{"givenName":"Ada","id":"another-contact"}})
        )
        .is_err()
    );
    let command = prepare(json!({"action":"contacts.create","fields":{"givenName":" Ada ","phones":[{"number":" 555-1234 ","id":"ignored"}]}})).unwrap();
    assert_eq!(
        command["fields"],
        json!({"givenName":"Ada","phones":[{"number":"555-1234"}]})
    );
}

#[test]
fn searches_platform_rows_and_pages_deterministically() {
    let rows = vec![
        json!({"id":"2","givenName":"Ada","company":"Science","phones":[{"number":"+1 (555) 1234"}]}),
        json!({"id":"1","givenName":"Ada","emails":[{"email":"USER@example.org"}]}),
        json!({"id":"3","givenName":"Grace","company":"Other"}),
    ];
    let first = page(rows.clone(), query(json!({"limit":1})).unwrap());
    assert_eq!(first["data"][0]["id"], "1");
    assert_eq!(first["total"], 3);
    assert_eq!(first["hasNextPage"], true);
    for (needle, id) in [("USER@", "1"), ("5551234", "2"), ("science", "2")] {
        let result = page(rows.clone(), query(json!({"search":needle})).unwrap());
        assert_eq!(result["data"][0]["id"], id);
        assert_eq!(result["hasNextPage"], false);
    }
    assert_eq!(
        page(rows, query(json!({"offset":9})).unwrap())["data"],
        json!([])
    );
}

#[test]
fn creates_patches_and_removes_local_contacts_without_overwriting_omitted_fields() {
    let created = local(vec![], json!({"action":"contacts.create","fields":{"givenName":"Ada","company":"Science","phones":[{"number":"555"}]}})).unwrap();
    let id = created["value"]["id"].as_str().unwrap();
    assert!(uuid::Uuid::parse_str(id).is_ok());
    let rows = serde_json::from_value(created["rows"].clone()).unwrap();
    let updated = local(
        rows,
        json!({"action":"contacts.update","id":id,"fields":{"company":null,"phones":[]}}),
    )
    .unwrap();
    assert_eq!(
        updated["value"],
        json!({"id":id,"givenName":"Ada","phones":[],"emails":[]})
    );
    let rows: Vec<Value> = serde_json::from_value(updated["rows"].clone()).unwrap();
    assert_eq!(
        local(
            rows.clone(),
            json!({"action":"contacts.get","id":"missing"})
        )
        .unwrap()["value"],
        Value::Null
    );
    assert_eq!(
        local(rows, json!({"action":"contacts.remove","id":id})).unwrap(),
        json!({"value":true,"rows":[]})
    );
}
