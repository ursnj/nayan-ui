//! CommonMark/GFM to ordinary engine nodes. Parse once per tree commit, never per frame.
use crate::components::Node;
use serde_json::{Value, json};
use pulldown_cmark::{CodeBlockKind, Event, Options, Parser, Tag};

const MAX_SOURCE: usize = 1_048_576;
const MAX_NODES: usize = 4000;

fn normalize_style(style: &mut Value) {
    if let Some(height) = style["lineHeight"].as_f64() {
        style["lineHeight"] = json!(format!("{height}px"));
    }
}
fn node(tag: &str, kind: &str, mut style: Value) -> Node {
    normalize_style(&mut style);
    Node {
        id: String::new(),
        kind: kind.into(),
        props: json!({"tag":tag,"style":style}),
        children: vec![],
    }
}
fn paragraph() -> Node {
    node("p", "NText", json!({"margin":0,"fontSize":16,"lineHeight":26}))
}
fn inline(tag: &str, style: Value) -> Node {
    node(tag, "NText", style)
}
fn literal(text: impl Into<String>) -> Node {
    Node {
        id: String::new(),
        kind: "NText".into(),
        props: json!({"text":text.into()}),
        children: vec![],
    }
}
fn safe_url(url: &str, image: bool) -> Option<&str> {
    let url = url.trim();
    if url.chars().any(char::is_control) {
        return None;
    }
    if let Some((scheme, _)) = url.split_once(':') {
        if !matches!(scheme.to_ascii_lowercase().as_str(), "http" | "https")
            && (image || !matches!(scheme.to_ascii_lowercase().as_str(), "mailto" | "tel"))
        {
            return None;
        }
    }
    Some(url)
}
fn text_of(node: &Node) -> String {
    node.props["text"]
        .as_str()
        .map(str::to_owned)
        .unwrap_or_else(|| node.children.iter().map(text_of).collect())
}
struct Frame {
    node: Node,
    item_marker: Option<String>,
    image: bool,
}

pub fn parse(source: &str) -> Result<Vec<Node>, String> {
    if source.len() > MAX_SOURCE {
        return Err("Markdown exceeds 1 MiB".into());
    }
    let mut stack = vec![Frame {
        node: node("div", "NView", json!({})),
        item_marker: None,
        image: false,
    }];
    let mut lists = Vec::<Option<u64>>::new();
    let mut header = false;
    let mut count = 0;
    let options = Options::ENABLE_TABLES | Options::ENABLE_STRIKETHROUGH | Options::ENABLE_TASKLISTS;
    for event in Parser::new_ext(source, options) {
        count += 1;
        if count > MAX_NODES || stack.len() > 40 {
            return Err("Markdown exceeds the document size or nesting limit".into());
        }
        match event {
            Event::Start(tag) => {
                let mut marker = None;
                let mut image = false;
                let mut n = match tag {
                    Tag::Paragraph => paragraph(),
                    Tag::Heading { level, .. } => node(
                        &level.to_string(),
                        "NText",
                        json!({"margin":0,"marginTop":8,"fontSize":match level as u8 {1=>32,2=>26,3=>22,4=>20,_=>18},"lineHeight":match level as u8 {1=>43,2=>35,3=>30,4=>27,_=>25},"fontWeight":700}),
                    ),
                    Tag::BlockQuote(_) => node(
                        "blockquote",
                        "NView",
                        json!({"display":"flex","flexDirection":"column","gap":8,"margin":0,"padding":12,"borderRadius":8,"backgroundColor":"var(--surface-secondary)"}),
                    ),
                    Tag::CodeBlock(kind) => {
                        let mut n = node(
                            "pre",
                            "NText",
                            json!({"margin":0,"padding":12,"fontSize":14,"lineHeight":22,"fontFamily":"monospace","whiteSpace":"pre-wrap","overflowWrap":"anywhere","borderRadius":8,"backgroundColor":"var(--surface-secondary)"}),
                        );
                        if let CodeBlockKind::Fenced(language) = kind {
                            n.props["data-language"] = json!(language.split_whitespace().next().unwrap_or(""));
                        }
                        n
                    }
                    Tag::List(start) => {
                        lists.push(start);
                        let mut n = node(
                            if start.is_some() { "ol" } else { "ul" },
                            "NView",
                            json!({"display":"flex","flexDirection":"column","gap":6,"margin":0,"padding":0,"listStyleType":"none"}),
                        );
                        if let Some(start) = start {
                            n.props["start"] = json!(start);
                        }
                        n
                    }
                    Tag::Item => {
                        marker = Some(match lists.last_mut() {
                            Some(Some(index)) => {
                                let shown = format!("{index}.");
                                *index += 1;
                                shown
                            }
                            _ => "•".into(),
                        });
                        node(
                            "div",
                            "NView",
                            json!({"display":"flex","flexDirection":"column","gap":4,"flex":1,"minWidth":0}),
                        )
                    }
                    Tag::Emphasis => inline("em", json!({"fontStyle":"italic"})),
                    Tag::Strong => inline("strong", json!({"fontWeight":700})),
                    Tag::Strikethrough => inline("del", json!({"textDecorationLine":"line-through"})),
                    Tag::Link { dest_url, title, .. } => {
                        let mut n = node("a", "NLink", json!({"color":"var(--accent)","textDecorationLine":"underline"}));
                        if let Some(href) = safe_url(&dest_url, false) {
                            n.props["href"] = json!(href);
                        } else {
                            n.kind = "NText".into();
                            n.props["tag"] = json!("span");
                            n.props["style"] = json!({});
                        }
                        if !title.is_empty() {
                            n.props["_markdownTitle"] = json!(title.as_ref());
                        }
                        n
                    }
                    Tag::Image { dest_url, title, .. } => {
                        image = true;
                        let mut n = node("img", "NImage", json!({"maxWidth":"100%","width":"100%","height":220,"borderRadius":8}));
                        if let Some(src) = safe_url(&dest_url, true) {
                            n.props["src"] = json!(src);
                        }
                        n.props["_markdownTitle"] = json!(title.as_ref());
                        n.props["contentFit"] = json!("contain");
                        n
                    }
                    Tag::Table(_) => {
                        let mut n = node(
                            "div",
                            "NView",
                            json!({"display":"flex","flexDirection":"column","margin":0,"width":"100%"}),
                        );
                        n.props["role"] = json!("table");
                        n
                    }
                    Tag::TableHead => {
                        header = true;
                        let mut n = node("div", "NView", json!({"display":"flex","flexDirection":"row","gap":0}));
                        n.props["role"] = json!("row");
                        n
                    }
                    Tag::TableRow => {
                        let mut n = node("div", "NView", json!({"display":"flex","flexDirection":"row","gap":0}));
                        n.props["role"] = json!("row");
                        n
                    }
                    Tag::TableCell => {
                        let mut n = node(
                            "div",
                            "NText",
                            json!({"display":"block","flex":1,"minWidth":0,"padding":8,"fontSize":14,"lineHeight":22,"fontWeight":if header {700}else{400},"borderWidth":1,"borderColor":"var(--border)"}),
                        );
                        n.props["role"] = json!(if header { "columnheader" } else { "cell" });
                        n
                    }
                    _ => node("div", "NView", json!({"margin":0,"padding":0})),
                };
                if n.props["style"]["backgroundColor"].is_string() {
                    n.props["className"] = json!("bg-[var(--surface-secondary)]");
                }
                if n.props["style"]["fontFamily"] == "monospace" {
                    n.props["className"] = json!(format!("{} font-mono", n.props["className"].as_str().unwrap_or("")));
                }
                if n.kind == "NLink" {
                    n.props["className"] = json!("text-[var(--accent)] underline");
                }
                if n.props["role"] == "cell" || n.props["role"] == "columnheader" {
                    n.props["className"] = json!("border-[var(--border)]");
                }
                stack.push(Frame {
                    node: n,
                    item_marker: marker,
                    image,
                });
            }
            Event::End(tag) => {
                if stack.len() == 1 {
                    continue;
                }
                let mut frame = stack.pop().unwrap();
                if frame.image {
                    frame.node.props["alt"] = json!(text_of(&frame.node));
                    frame.node.props["accessibilityLabel"] = frame.node.props["alt"].clone();
                    frame.node.children.clear();
                    if frame.node.props["src"].is_null() {
                        frame.node = literal(frame.node.props["alt"].as_str().unwrap_or(""));
                    }
                }
                if let Some(marker) = frame.item_marker {
                    // Tight CommonMark lists omit paragraph events. Keep their inline runs
                    // together, rather than treating bold labels and following text as blocks.
                    let mut blocks = Vec::new();
                    let mut run = paragraph();
                    for child in frame.node.children {
                        let inline = matches!(child.kind.as_str(), "NText" | "NLink")
                            && !matches!(child.props["tag"].as_str(), Some("p" | "pre" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6"));
                        if inline {
                            run.children.push(child);
                        } else {
                            if !run.children.is_empty() {
                                blocks.push(run);
                                run = paragraph();
                            }
                            blocks.push(child);
                        }
                    }
                    if !run.children.is_empty() {
                        blocks.push(run);
                    }
                    frame.node.children = blocks;
                    let mut row = node(
                        "li",
                        "NView",
                        json!({"display":"flex","flexDirection":"row","gap":8,"margin":0,"padding":0,"alignItems":"flex-start"}),
                    );
                    let mut bullet = node("span", "NText", json!({"minWidth":22,"flexShrink":0,"fontSize":16,"lineHeight":26}));
                    bullet.props["aria-hidden"] = json!(true);
                    bullet.children.push(literal(marker));
                    row.children = vec![bullet, frame.node];
                    frame.node = row;
                }
                if matches!(tag, pulldown_cmark::TagEnd::List(_)) {
                    lists.pop();
                }
                if matches!(tag, pulldown_cmark::TagEnd::TableHead) {
                    header = false;
                }
                let parent = &mut stack.last_mut().unwrap().node.children;
                if frame.node.props["tag"] == "p" && frame.node.children.iter().any(|child| child.kind == "NImage") {
                    // Images occupy their own block on both platforms; native text runs cannot
                    // paint an image embedded in a paragraph's glyph layout.
                    let mut paragraph = frame.node.clone();
                    paragraph.children.clear();
                    for child in frame.node.children {
                        if child.kind == "NImage" {
                            if !paragraph.children.is_empty() {
                                parent.push(paragraph.clone());
                                paragraph.children.clear();
                            }
                            parent.push(child);
                        } else {
                            paragraph.children.push(child);
                        }
                    }
                    if !paragraph.children.is_empty() {
                        parent.push(paragraph);
                    }
                } else {
                    parent.push(frame.node);
                }
            }
            Event::Text(text) => stack.last_mut().unwrap().node.children.push(literal(text.into_string())),
            Event::Code(code) => {
                let mut n = inline("code", json!({"fontFamily":"monospace","fontSize":14}));
                n.props["className"] = json!("font-mono");
                n.children.push(literal(code.into_string()));
                stack.last_mut().unwrap().node.children.push(n);
            }
            Event::SoftBreak => stack.last_mut().unwrap().node.children.push(literal(" ")),
            Event::HardBreak => stack.last_mut().unwrap().node.children.push(literal("\n")),
            Event::Rule => {
                let n = node("hr", "NDivider", json!({"margin":0}));
                stack.last_mut().unwrap().node.children.push(n);
            }
            Event::TaskListMarker(checked) => {
                if let Some(frame) = stack.iter_mut().rev().find(|f| f.item_marker.is_some()) {
                    frame.item_marker = Some(if checked { "[x]" } else { "[ ]" }.into());
                }
            }
            Event::Html(html) | Event::InlineHtml(html) => {
                if !html.trim_start().starts_with("<!--") {
                    let text = literal(html.into_string());
                    if stack.len() == 1 {
                        let mut paragraph = paragraph();
                        paragraph.children.push(text);
                        stack.last_mut().unwrap().node.children.push(paragraph);
                    } else {
                        stack.last_mut().unwrap().node.children.push(text);
                    }
                }
            }
            Event::InlineMath(text) | Event::DisplayMath(text) => stack.last_mut().unwrap().node.children.push(literal(text.into_string())),
            _ => {}
        }
    }
    let mut nodes = stack.remove(0).node.children;
    assign_ids(&mut nodes, "markdown");
    Ok(nodes)
}
fn assign_ids(nodes: &mut [Node], prefix: &str) {
    for (index, node) in nodes.iter_mut().enumerate() {
        node.id = format!("{prefix}:{index}");
        assign_ids(&mut node.children, &node.id);
    }
}

pub fn expand(nodes: &mut [Node]) -> Result<(), String> {
    for n in nodes {
        if n.kind == "NMarkdown" {
            let mut children = if let Some(document) = n.props.get("document").filter(|value| value.is_array()) {
                serde_json::from_value::<Vec<Node>>(document.clone()).map_err(|error| error.to_string())?
            } else {
                parse(n.props["source"].as_str().unwrap_or(""))?
            };
            assign_ids(&mut children, &format!("{}:markdown", n.id));
            fn customize(nodes: &mut [Node], props: &Value) {
                for node in nodes {
                    let tag = node.props["tag"].as_str().unwrap_or("").to_owned();
                    if let Some(style) = props["styles"][&tag].as_object() {
                        node.props["style"].as_object_mut().unwrap().extend(style.clone());
                    }
                    if let Some(class) = props["classNames"][&tag].as_str() {
                        node.props["className"] = json!(format!("{} {class}", node.props["className"].as_str().unwrap_or("")));
                    }
                    if node.props["style"].is_object() {
                        normalize_style(&mut node.props["style"]);
                    }
                    customize(&mut node.children, props);
                }
            }
            customize(&mut children, &n.props);
            n.kind = "NView".into();
            n.props["source"] = Value::Null;
            n.props["document"] = Value::Null;
            let mut style = json!({"display":"flex","flexDirection":"column","gap":n.props["blockSpacing"].as_f64().unwrap_or(12.).clamp(0.,64.),"width":"100%","minWidth":0,"fontSize":16,"lineHeight":26});
            if let Some(custom) = n.props["style"].as_object() {
                style.as_object_mut().unwrap().extend(custom.clone());
            }
            normalize_style(&mut style);
            n.props["style"] = style;
            n.children = children;
        } else {
            expand(&mut n.children)?;
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    fn find<'a>(nodes: &'a [Node], tag: &str) -> Option<&'a Node> {
        nodes.iter().find_map(|node| {
            if node.props["tag"] == tag {
                Some(node)
            } else {
                find(&node.children, tag)
            }
        })
    }
    #[test]
    fn commonmark_preserves_inline_formatting_lists_code_and_gfm_tables() {
        let nodes = parse("## Hello **world**\n\nA [link](https://example.org) and *emphasis*, ~~old~~, `code`.\n\n3. First\n4. Second\n\n- [x] Done\n\n```rs\nlet x = 1;\n```\n\n| A | B |\n|---|---|\n| 1 | 2 |").unwrap();
        assert!(find(&nodes, "h2").is_some());
        assert!(find(&nodes, "strong").is_some());
        assert_eq!(find(&nodes, "a").unwrap().props["href"], "https://example.org");
        assert_eq!(find(&nodes, "ol").unwrap().props["start"], 3);
        assert!(find(&nodes, "pre").is_some());
        assert!(nodes.iter().any(|node| node.props["role"] == "table"));

        assert_eq!(nodes[0].props["style"]["marginTop"], 8);
    }
    #[test]
    fn raw_html_and_unsafe_links_never_become_executable_nodes() {
        let nodes = parse("[bad](javascript:alert%281%29) ![bad](data:text/html,test)\n\n<script>alert(1)</script>").unwrap();
        assert!(find(&nodes, "a").is_none());
        assert!(find(&nodes, "img").is_none());
        assert!(nodes.iter().all(|node| node.props["tag"] != "script"));
    }
    #[test]
    fn images_keep_alt_text_and_are_laid_out_outside_native_text_runs() {
        let nodes = parse("Before ![A **safe** image](https://example.org/image.png) after.").unwrap();
        assert_eq!(nodes.len(), 3);
        assert_eq!(nodes[1].kind, "NImage");
        assert_eq!(nodes[1].props["alt"], "A safe image");
        assert_eq!(text_of(&nodes[0]), "Before ");
        assert_eq!(text_of(&nodes[2]), " after.");
    }
    #[test]
    fn tight_list_items_group_mixed_inline_content_and_preserve_nested_lists() {
        let nodes = parse("- **Flights** — A description with [a link](https://example.org).\n  - Nested item\n- Another item").unwrap();
        let content = &nodes[0].children[0].children[1];
        assert_eq!(content.children[0].props["tag"], "p");
        assert_eq!(text_of(&content.children[0]), "Flights — A description with a link.");
        assert_eq!(content.children[1].props["tag"], "ul");
    }
    #[test]
    fn expansion_rebases_ids_and_bounds_document_size() {
        let mut nodes: Vec<Node> = serde_json::from_value(
            json!([{"id":"a","kind":"NMarkdown","props":{"source":"Hello"}},{"id":"b","kind":"NMarkdown","props":{"source":"Hello"}}]),
        )
        .unwrap();
        expand(&mut nodes).unwrap();
        assert_ne!(nodes[0].children[0].id, nodes[1].children[0].id);
        assert!(parse(&"x".repeat(MAX_SOURCE + 1)).is_err());
    }
}

