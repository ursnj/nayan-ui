//! Browser styles are compiled to declarative rules at build time. Cascade, text measurement,
//! flex/grid layout, scrolling, hit testing and painting run here, beside the native UI renderer.
use super::*;
use std::collections::BTreeMap;
use taffy::prelude as tf;
mod control;
mod entrance;
mod layout;
mod paint;
mod state;
mod text;
mod transform;
mod values;
use values::{number, split, vars};

pub(super) struct EntrancePlayback {
    started: f64,
    last_visible: f64,
    replay: bool,
}

#[derive(Clone)]
struct BoxNode {
    node: Node,
    tag: String,
    parent: Option<usize>,
    children: Vec<usize>,
    index: usize,
    css: BTreeMap<String, String>,
    variables: BTreeMap<String, String>,
    paint: style::Style,
    rect: Rect,
    content: Rect,
    fixed: bool,
    inline: bool,
    rules: Vec<usize>,
    styled: Option<Node>,
    entrance: Option<entrance::Entrance>,
}

pub(super) struct Document {
    rules: Vec<Value>,
    index: HashMap<String, Vec<usize>>,
    boxes: Vec<BoxNode>,
    dirty: bool,
    viewport: Vec2,
    dark: bool,
    hovered: Option<usize>,
    height: f32,
    visible: HashSet<String>,
    scroll_to: Option<String>,
    scroll_offset: Option<f32>,
    state_rules: HashSet<usize>,
    state_matches: Vec<(usize, usize, bool)>,
    #[cfg(test)]
    layout_passes: usize,
}

impl Document {
    pub fn load(value: &Value) -> Result<Self, String> {
        let rules = value["rules"]
            .as_array()
            .filter(|r| r.len() <= 50000)
            .ok_or("Invalid UI stylesheet")?
            .clone();
        let mut index: HashMap<String, Vec<usize>> = HashMap::new();
        for (i, rule) in rules.iter().enumerate() {
            let key = rule["parts"]
                .as_array()
                .and_then(|p| p.last())
                .and_then(|p| p["tests"].as_array())
                .and_then(|tests| tests.iter().find(|test| test[0] == "id" || test[0] == "class" || test[0] == "tag"))
                .map(|test| format!("{}:{}", test[0].as_str().unwrap_or(""), test[1].as_str().unwrap_or("")))
                .unwrap_or_else(|| "*".into());
            index.entry(key).or_default().push(i);
        }
        fn dynamic(value: &Value) -> bool {
            value.as_array().is_some_and(|parts| {
                (parts.first().is_some_and(|v| v == "pseudo")
                    && parts.get(1).is_some_and(|v| {
                        matches!(
                            v.as_str(),
                            Some("hover" | "active" | "focus" | "focus-visible" | "focus-within" | "checked")
                        )
                    }))
                    || (parts.first().is_some_and(|v| v == "attr") && parts.get(1).is_some_and(|v| v == "data-scrolled" || v == "open"))
                    || parts.iter().any(dynamic)
            }) || value.as_object().is_some_and(|object| object.values().any(dynamic))
        }
        let state_rules = rules
            .iter()
            .enumerate()
            .filter_map(|(i, rule)| dynamic(&rule["parts"]).then_some(i))
            .collect();
        Ok(Self {
            rules,
            index,
            boxes: Vec::new(),
            dirty: true,
            viewport: Vec2::ZERO,
            dark: false,
            hovered: None,
            height: 0.,
            visible: HashSet::new(),
            scroll_to: None,
            scroll_offset: None,
            state_rules,
            state_matches: Vec::new(),
            #[cfg(test)]
            layout_passes: 0,
        })
    }
    pub(super) fn scroll(&mut self, id: Option<&str>, offset: Option<f32>) {
        self.scroll_to = id.map(str::to_owned);
        self.scroll_offset = offset;
    }
    pub fn invalidate(&mut self) {
        self.dirty = true;
    }
    pub(super) fn inspect(&self) -> Value {
        json!({"viewport":[self.viewport.x,self.viewport.y],"height":self.height,"boxes":self.boxes.iter().map(|b| json!({"id":b.node.id,"kind":b.node.kind,"tag":b.tag,"className":b.node.props["className"],"text":text(&b.node),"props":b.node.props,"parent":b.parent.map(|i|&self.boxes[i].node.id),"inline":b.inline,"rect":[b.rect.left(),b.rect.top(),b.rect.width(),b.rect.height()],"content":[b.content.left(),b.content.top(),b.content.width(),b.content.height()],"css":b.css})).collect::<Vec<_>>()})
    }

    fn collect(&mut self, nodes: &[Node], parent: Option<usize>, inlined: bool, inherited_owner: Option<&Node>) -> Vec<usize> {
        let mut ids = Vec::new();
        for (position, original) in nodes.iter().enumerate() {
            let compound;
            let node = if original.kind == "NSelect" && original.props["label"].as_str().is_some_and(|label| !label.is_empty()) {
                let mut control = original.clone();
                let label = control.props["label"].take();
                if !control.props["accessibilityLabel"].is_string() {
                    control.props["accessibilityLabel"] = label.clone();
                }
                compound = Node {
                    id: format!("__engine:select:{}:field", original.id),
                    kind: "NView".into(),
                    props: json!({"className":original.props["containerClassName"],"style":{"display":"flex","flexDirection":"column","gap":4,"width":"100%"}}),
                    children: vec![
                        Node {
                            id: format!("__engine:select:{}:label", original.id),
                            kind: "NText".into(),
                            props: json!({"tag":"label","htmlFor":original.id,"text":label,"className":original.props["labelClassName"]}),
                            children: vec![],
                        },
                        control,
                    ],
                };
                &compound
            } else {
                original
            };
            let mut node = node.clone();
            let own_links = (node.props["linkify"] == true).then(|| Node {
                id: node.id.clone(),
                kind: node.kind.clone(),
                props: json!({"linkClassName":node.props["linkClassName"],"linkStyle":node.props["linkStyle"]}),
                children: vec![],
            });
            let owner = if node.kind == "NLink" {
                None
            } else {
                own_links.as_ref().or(inherited_owner)
            };
            if let Some(owner) = owner {
                let direct = ["text", "label"].into_iter().find(|key| node.props[*key].is_string());
                if let Some(key) = direct {
                    let value = node.props[key].as_str().unwrap().to_string();
                    let links = linkify::links(&value);
                    if !links.is_empty() {
                        node.props[key] = Value::Null;
                        let mut offset = 0;
                        let mut children = Vec::new();
                        for link in links {
                            if link.start > offset {
                                children.push(Node {
                                    id: format!("{}:text:{offset}", node.id),
                                    kind: "NText".into(),
                                    props: json!({"text":&value[offset..link.start]}),
                                    children: vec![],
                                });
                            }
                            let mut target = linkify::target(
                                owner,
                                &node,
                                value[..link.start].chars().count(),
                                &value[link.start..link.end],
                                &link.href,
                            );
                            target.props["className"] = json!(format!("nyn-linkify {}", owner.props["linkClassName"].as_str().unwrap_or("")));
                            target.props["style"] = owner.props["linkStyle"].clone();
                            children.push(target);
                            offset = link.end;
                        }
                        if offset < value.len() {
                            children.push(Node {
                                id: format!("{}:text:{offset}", node.id),
                                kind: "NText".into(),
                                props: json!({"text":&value[offset..]}),
                                children: vec![],
                            });
                        }
                        node.children = children;
                    }
                }
            }
            let id = self.boxes.len();
            let tag = node.props["tag"]
                .as_str()
                .unwrap_or(match node.kind.as_str() {
                    "NText" => "span",
                    "NButton" => "button",
                    "NLink" => "a",
                    "NImage" => "img",
                    "NIcon" => "svg",
                    "NInput" => "input",
                    "NTextarea" => "textarea",
                    "NSelect" => "select",
                    "NTheme" => "body",
                    _ => "div",
                })
                .to_string();
            let children = node.children.clone();
            node.props["_styleId"] = json!(node.id);
            self.boxes.push(BoxNode {
                entrance: entrance::Entrance::read(&node.props["entrance"]),
                node,
                tag,
                parent,
                children: Vec::new(),
                index: position,
                css: BTreeMap::new(),
                variables: BTreeMap::new(),
                paint: style::Style::default(),
                rect: Rect::NOTHING,
                content: Rect::NOTHING,
                fixed: false,
                inline: inlined,
                rules: Vec::new(),
                styled: None,
            });
            let children = self.collect(&children, Some(id), false, owner);
            self.boxes[id].children = children.clone();
            self.boxes[id].node.children = children.iter().map(|i| self.boxes[*i].node.clone()).collect();
            ids.push(id);
        }
        ids
    }

    fn expanded(doc: &ComponentDocument, node: &Node) -> bool {
        doc.values
            .get(&node.id)
            .and_then(Value::as_bool)
            .or_else(|| {
                ["expanded", "isExpanded", "open", "defaultExpanded", "defaultValue"]
                    .iter()
                    .find_map(|key| node.props[*key].as_bool())
            })
            .unwrap_or(false)
    }
    fn inline_content(&mut self, doc: &ComponentDocument) {
        for i in 0..self.boxes.len() {
            if self.boxes[i].tag == "details" && !Self::expanded(doc, &self.boxes[i].node) {
                for child in self.boxes[i].children.clone() {
                    if self.boxes[child].tag != "summary" {
                        self.boxes[child].css.insert("display".into(), "none".into());
                    }
                }
            }
            let display = self.boxes[i].css.get("display").map(String::as_str).unwrap_or("");
            let rich = matches!(self.boxes[i].node.kind.as_str(), "NText" | "NLink" | "NView" | "NButton")
                && !matches!(display, "flex" | "inline-flex" | "grid" | "inline-grid")
                && !self.boxes[i].children.is_empty()
                && self.boxes[i].children.iter().all(|c| {
                    let child = &self.boxes[*c];
                    matches!(child.node.kind.as_str(), "NText" | "NLink")
                        && matches!(child.tag.as_str(), "span" | "a" | "strong" | "em" | "b" | "i" | "small" | "code" | "br")
                        && !child
                            .css
                            .get("display")
                            .is_some_and(|d| matches!(d.as_str(), "block" | "flex" | "grid" | "inline-flex" | "inline-grid"))
                });
            let inline = self.boxes[i].inline || rich;
            let children = self.boxes[i].children.clone();
            for child in children {
                self.boxes[child].inline = inline;
            }
        }
    }

    fn test(&self, tests: &[Value], i: usize, doc: &ComponentDocument) -> bool {
        let item = &self.boxes[i];
        let n = &item.node;
        tests.iter().all(|test| match test[0].as_str().unwrap_or("") {
            "tag" => test[1].as_str() == Some(&item.tag) || (item.parent.is_none() && test[1] == "html"),
            "id" => test[1].as_str() == Some(&n.id),
            "class" => {
                n.props["className"]
                    .as_str()
                    .unwrap_or("")
                    .split_whitespace()
                    .any(|c| Some(c) == test[1].as_str())
                    || (item.parent.is_none() && ((test[1] == "dark" && self.dark) || (test[1] == "light" && !self.dark)))
            }
            "attr" => {
                let key = test[1].as_str().unwrap_or("");
                let expected = test[3].as_str().unwrap_or("");
                let actual = if key == "open" && item.tag == "details" {
                    if Self::expanded(doc, n) { "true".into() } else { String::new() }
                } else if key == "data-theme" && item.parent.is_none() {
                    if self.dark { "dark".into() } else { "light".into() }
                } else if key == "data-scrolled" {
                    if doc.root_scroll > 8. { "true".into() } else { "false".into() }
                } else if let Some(v) = n.props.get(key) {
                    if v.is_string() { v.as_str().unwrap().to_string() } else { v.to_string() }
                } else {
                    String::new()
                };
                match test[2].as_str().unwrap_or("") {
                    "" => !actual.is_empty(),
                    "=" => actual == expected,
                    "^=" => actual.starts_with(expected),
                    "$=" => actual.ends_with(expected),
                    "*=" => actual.contains(expected),
                    "~=" => actual.split_whitespace().any(|p| p == expected),
                    _ => false,
                }
            }
            "where" | "is" | "not" => {
                let matched = test[1].as_array().is_some_and(|options| options.iter().any(|s| self.selector(s, i, doc)));
                if test[0] == "not" { !matched } else { matched }
            }
            "pseudo" => match test[1].as_str().unwrap_or("") {
                "root" => item.parent.is_none(),
                "hover" => self.hovered.is_some_and(|h| h == i || self.ancestor(h, i)),
                "active" => doc.pointer_down && self.hovered == Some(i),
                "disabled" => flag(&n.props, &["disabled", "isDisabled"]),
                "enabled" => !flag(&n.props, &["disabled", "isDisabled"]),
                "checked" => flag(&n.props, &["checked", "isSelected"]) || doc.values.get(&n.id).is_some_and(|v| v == true),
                "focus" | "focus-visible" | "focus-within" => doc
                    .previous_semantics
                    .iter()
                    .any(|s| s.id == n.id && doc.context.memory(|m| m.has_focus(s.focus_id))),
                "first-child" => item.index == 0,
                "last-child" => item.parent.is_some_and(|p| self.boxes[p].children.last() == Some(&i)),
                "first-of-type" => item
                    .parent
                    .is_some_and(|p| self.boxes[p].children.iter().find(|c| self.boxes[**c].tag == item.tag) == Some(&i)),
                "nth-child" | "nth-of-type" => {
                    let index = if test[1] == "nth-of-type" {
                        item.parent
                            .map(|p| {
                                self.boxes[p]
                                    .children
                                    .iter()
                                    .take_while(|c| **c != i)
                                    .filter(|c| self.boxes[**c].tag == item.tag)
                                    .count()
                            })
                            .unwrap_or(0)
                    } else {
                        item.index
                    } + 1;
                    match test[2].as_str().unwrap_or("").trim() {
                        "even" => index % 2 == 0,
                        "odd" => index % 2 == 1,
                        value => value.parse::<usize>().ok() == Some(index),
                    }
                }
                "empty" => item.children.is_empty() && text(n).is_empty(),
                _ => false,
            },
            // Pseudo-elements are decorative and are painted separately from real controls.
            "pseudo-element" => false,
            _ => false,
        })
    }
    fn ancestor(&self, mut child: usize, parent: usize) -> bool {
        while let Some(p) = self.boxes[child].parent {
            if p == parent {
                return true;
            }
            child = p;
        }
        false
    }
    fn selector(&self, rule: &Value, i: usize, doc: &ComponentDocument) -> bool {
        fn matches(sheet: &Document, parts: &[Value], position: usize, i: usize, doc: &ComponentDocument) -> bool {
            if !parts[position]["tests"].as_array().is_some_and(|tests| sheet.test(tests, i, doc)) {
                return false;
            }
            if position == 0 {
                return true;
            }
            match parts[position]["relation"].as_str().unwrap_or(" ") {
                ">" => sheet.boxes[i].parent.is_some_and(|p| matches(sheet, parts, position - 1, p, doc)),
                "+" | "~" => sheet.boxes[i].parent.is_some_and(|p| {
                    let siblings = &sheet.boxes[p].children;
                    let index = sheet.boxes[i].index;
                    if parts[position]["relation"] == "+" {
                        index > 0 && matches(sheet, parts, position - 1, siblings[index - 1], doc)
                    } else {
                        siblings[..index].iter().any(|p| matches(sheet, parts, position - 1, *p, doc))
                    }
                }),
                _ => {
                    let mut parent = sheet.boxes[i].parent;
                    while let Some(p) = parent {
                        if matches(sheet, parts, position - 1, p, doc) {
                            return true;
                        }
                        parent = sheet.boxes[p].parent;
                    }
                    false
                }
            }
        }
        rule["parts"]
            .as_array()
            .filter(|p| !p.is_empty())
            .is_some_and(|parts| matches(self, parts, parts.len() - 1, i, doc))
    }
    fn media(&self, media: &Value, doc: &ComponentDocument) -> bool {
        media.as_array().is_none_or(|conditions| {
            conditions.iter().all(|condition| {
                let condition = condition.as_str().unwrap_or("");
                if condition.contains("print") {
                    return false;
                }
                if condition.contains("prefers-reduced-motion") {
                    return doc.reduced_motion;
                }
                if condition.contains("prefers-color-scheme") {
                    return condition.contains(if self.dark { "dark" } else { "light" });
                }
                condition.split("and").all(|part| {
                    let part = part.trim().trim_matches(|c| c == '(' || c == ')');
                    for (prefix, min) in [("min-width:", true), ("max-width:", false)] {
                        if let Some(value) = part.strip_prefix(prefix) {
                            return number(value, self.viewport.x, self.viewport, 16.)
                                .is_none_or(|v| if min { self.viewport.x >= v } else { self.viewport.x <= v });
                        }
                    }
                    if let Some((lhs, rhs)) = part.split_once(">=") {
                        return !lhs.contains("width") || number(rhs, self.viewport.x, self.viewport, 16.).is_none_or(|v| self.viewport.x >= v);
                    }
                    if let Some((lhs, rhs)) = part.split_once('<') {
                        return !lhs.contains("width") || number(rhs, self.viewport.x, self.viewport, 16.).is_none_or(|v| self.viewport.x < v);
                    }
                    true
                })
            })
        })
    }
    fn cascade(&mut self, doc: &ComponentDocument) {
        self.state_matches.clear();
        for i in 0..self.boxes.len() {
            let mut candidates = self.index.get("*").cloned().unwrap_or_default();
            let mut keys = vec![format!("tag:{}", self.boxes[i].tag), format!("id:{}", self.boxes[i].node.id)];
            keys.extend(
                self.boxes[i].node.props["className"]
                    .as_str()
                    .unwrap_or("")
                    .split_whitespace()
                    .map(|s| format!("class:{s}")),
            );
            if self.boxes[i].parent.is_none() {
                keys.extend(["tag:html".into(), format!("class:{}", if self.dark { "dark" } else { "light" })]);
            }
            for key in keys {
                if let Some(ids) = self.index.get(&key) {
                    candidates.extend(ids);
                }
            }
            candidates.sort_unstable();
            candidates.dedup();
            candidates.retain(|r| self.media(&self.rules[*r]["media"], doc));
            for rule in candidates.iter().filter(|r| self.state_rules.contains(r)) {
                self.state_matches.push((i, *rule, self.selector(&self.rules[*rule], i, doc)));
            }
            self.boxes[i].rules = candidates;
            self.cascade_node(i, doc);
        }
    }

    fn cascade_node(&mut self, i: usize, doc: &ComponentDocument) {
        let mut candidates = self.boxes[i].rules.clone();
        candidates.retain(|r| self.selector(&self.rules[*r], i, doc));
        candidates.sort_by_key(|r| {
            (
                self.rules[*r]["layer"].as_u64().unwrap_or(4),
                self.rules[*r]["specificity"].as_u64().unwrap_or(0),
                *r,
            )
        });
        let mut variables = self.boxes[i].parent.map(|p| self.boxes[p].variables.clone()).unwrap_or_default();
        let mut css = BTreeMap::new();
        if let Some(parent) = self.boxes[i].parent {
            for property in [
                "color",
                "font-size",
                "font-weight",
                "font-family",
                "font-style",
                "text-decoration",
                "text-decoration-line",
                "line-height",
                "letter-spacing",
                "text-align",
                "white-space",
                "text-transform",
            ] {
                if let Some(value) = self.boxes[parent].css.get(property) {
                    css.insert(property.into(), value.clone());
                }
            }
        }
        let inherited = css.clone();
        if self.boxes[i].node.kind == "NLoading" && self.boxes[i].node.props["fill"] == true {
            for (property, value) in [("flex-grow", "1"), ("flex-basis", "0px"), ("min-height", "0px"), ("width", "100%")] {
                css.insert(property.into(), value.into());
            }
        }
        if let Some(color) = self.boxes[i].node.props["color"].as_str() {
            css.insert("color".into(), color.into());
        }
        let mut declarations = Vec::new();
        if self.boxes[i].node.props["_linkifyOwner"].is_string() {
            let color = doc.palette.get("accent");
            // Component defaults follow CSS resets and yield to utilities/custom link classes.
            declarations.push((
                (false, 2, 0, 0),
                "color".into(),
                format!("#{:02x}{:02x}{:02x}", color.r(), color.g(), color.b()),
            ));
            declarations.push(((false, 2, 0, 0), "text-decoration".into(), "none".into()));
        }
        for rule in candidates {
            if let Some(entries) = self.rules[rule]["declarations"].as_array() {
                for declaration in entries {
                    let important = declaration[2] == true;
                    let layer = self.rules[rule]["layer"].as_u64().unwrap_or(4).min(4);
                    declarations.push((
                        (
                            important,
                            if important { 4 - layer } else { layer },
                            self.rules[rule]["specificity"].as_u64().unwrap_or(0),
                            rule,
                        ),
                        declaration[0].as_str().unwrap_or("").to_string(),
                        declaration[1].as_str().unwrap_or("").to_string(),
                    ));
                }
            }
        }
        if let Some(inline) = self.boxes[i].node.props["style"].as_object() {
            for (name, value) in inline {
                let mut key = String::new();
                for ch in name.chars() {
                    if ch.is_ascii_uppercase() {
                        key.push('-');
                        key.push(ch.to_ascii_lowercase());
                    } else {
                        key.push(ch);
                    }
                }
                let value = if let Some(n) = value.as_f64() {
                    if matches!(
                        name.as_str(),
                        "opacity" | "flex" | "flexGrow" | "flexShrink" | "zIndex" | "fontWeight" | "aspectRatio" | "lineHeight"
                    ) {
                        n.to_string()
                    } else {
                        format!("{n}px")
                    }
                } else {
                    value.as_str().unwrap_or("").into()
                };
                declarations.push(((false, 4, 10000, usize::MAX), key, value));
            }
        }
        declarations.sort_by_key(|(priority, _, _)| *priority);
        for (_, name, value) in &declarations {
            if name.starts_with("--") {
                variables.insert(name.clone(), value.clone());
            }
        }
        for (_, name, value) in declarations {
            if !name.starts_with("--") {
                values::declare(&mut css, &name, &vars(&value, &variables));
            }
        }
        for (property, value) in css.clone() {
            if value == "inherit" || (value == "unset" && inherited.contains_key(&property)) {
                if let Some(value) = inherited.get(&property) {
                    css.insert(property, value.clone());
                } else {
                    css.remove(&property);
                }
            } else if matches!(value.as_str(), "initial" | "unset" | "revert" | "revert-layer") {
                css.remove(&property);
            }
        }
        if matches!(self.boxes[i].node.kind.as_str(), "NView" | "NPress") && self.boxes[i].node.props["tag"].is_null() && !css.contains_key("display")
        {
            css.insert("display".into(), "flex".into());
            css.entry("flex-direction".into()).or_insert_with(|| "column".into());
        }
        if !css.contains_key("color") {
            css.insert("color".into(), values::hex(doc.palette.get("foreground")));
        }
        let parent_font = inherited.get("font-size").and_then(|v| number(v, 16., self.viewport, 16.)).unwrap_or(16.);
        if let Some(size) = css.get("font-size").and_then(|v| number(v, parent_font, self.viewport, parent_font)) {
            css.insert("font-size".into(), format!("{size}px"));
        }
        if self.boxes[i].tag == "svg" || self.boxes[i].tag == "img" {
            for property in ["width", "height"] {
                let value = &self.boxes[i].node.props[property];
                if !css.contains_key(property) && value.is_number() {
                    css.insert(property.into(), format!("{}px", value));
                }
            }
            if self.boxes[i].tag == "svg" {
                let size = numeric(&self.boxes[i].node.props, &["size"], 24.);
                css.entry("width".into()).or_insert_with(|| format!("{size}px"));
                css.entry("height".into()).or_insert_with(|| format!("{size}px"));
            }
        }
        self.boxes[i].fixed = css.get("position").is_some_and(|v| v == "fixed");
        self.boxes[i].css = css;
        self.boxes[i].variables = variables;
    }
}

#[cfg(test)]
mod tests;
