//! URL recognition is shared by the native and stylesheet text renderers.
use super::*;

pub(super) struct Link {
    pub start: usize,
    pub end: usize,
    pub href: String,
}

pub(super) fn links(text: &str) -> Vec<Link> {
    fn local(c: char) -> bool {
        c.is_alphanumeric() || matches!(c, '.' | '_' | '%' | '+' | '-')
    }
    fn trim(mut value: &str) -> &str {
        loop {
            let shortened = value.trim_end_matches(['.', ',', ':', ';', '!', '?', '"', '\'']);
            if shortened.len() != value.len() {
                value = shortened;
                continue;
            }
            let closing = [(')', '('), (']', '['), ('}', '{')]
                .into_iter()
                .find(|(close, open)| value.ends_with(*close) && value.matches(*close).count() > value.matches(*open).count());
            if let Some((close, _)) = closing {
                value = &value[..value.len() - close.len_utf8()];
            } else {
                return value;
            }
        }
    }
    let mut found = Vec::new();
    let mut offset = 0;
    while offset < text.len() {
        let rest = &text[offset..];
        let c = rest.chars().next().unwrap();
        let boundary = offset == 0 || !text[..offset].chars().next_back().is_some_and(|c| local(c) || c == '@');
        let protocol = ["https://", "http://", "www."]
            .iter()
            .find(|prefix| rest.get(..prefix.len()).is_some_and(|s| s.eq_ignore_ascii_case(prefix)));
        if boundary && protocol.is_some() {
            let end = rest
                .find(|c: char| c.is_whitespace() || matches!(c, '<' | '>' | '"' | '\''))
                .unwrap_or(rest.len());
            let value = trim(&rest[..end]);
            if value.len() > protocol.unwrap().len() {
                found.push(Link {
                    start: offset,
                    end: offset + value.len(),
                    href: if value.get(..4).is_some_and(|s| s.eq_ignore_ascii_case("www.")) {
                        format!("https://{value}")
                    } else {
                        value.to_owned()
                    },
                });
                offset += value.len();
                continue;
            }
        } else if boundary && local(c) {
            let local_end = rest.find(|c| !local(c)).unwrap_or(rest.len());
            if rest.as_bytes().get(local_end) == Some(&b'@') {
                let domain_start = local_end + 1;
                let domain_end = domain_start
                    + rest[domain_start..]
                        .find(|c: char| !c.is_alphanumeric() && c != '.' && c != '-')
                        .unwrap_or(rest.len() - domain_start);
                let address = trim(&rest[..domain_end]);
                let domain = &address[domain_start.min(address.len())..];
                if local_end > 0
                    && domain
                        .rsplit_once('.')
                        .is_some_and(|(host, tld)| !host.is_empty() && tld.chars().count() >= 2 && tld.chars().all(char::is_alphabetic))
                {
                    found.push(Link {
                        start: offset,
                        end: offset + address.len(),
                        href: format!("mailto:{address}"),
                    });
                    offset += address.len();
                    continue;
                }
            }
        }
        offset += c.len_utf8();
    }
    found
}

pub(super) fn target(owner: &Node, source: &Node, start: usize, value: &str, href: &str) -> Node {
    Node {
        id: format!("{}:url:{start}", source.id),
        kind: "NLink".into(),
        props: json!({"text":value,"href":href,"_linkifyOwner":owner.id}),
        children: vec![],
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn recognizes_web_email_unicode_and_balanced_punctuation() {
        let text = "Visit (HTTPS://example.com/a(b)), www.example.org! Email café+hi@example.co.in. No @host or bad@host.";
        let links = links(text);
        assert_eq!(
            links.iter().map(|link| link.href.as_str()).collect::<Vec<_>>(),
            ["HTTPS://example.com/a(b)", "https://www.example.org", "mailto:café+hi@example.co.in"]
        );
        assert_eq!(&text[links[0].start..links[0].end], "HTTPS://example.com/a(b)");
    }
}

#[cfg(test)]
mod render_tests {
    use super::*;
    #[test]
    fn native_and_css_links_are_clickable_and_report_the_original_owner() {
        for css in [false, true] {
            let mut doc = ComponentDocument::default();
            if css {
                doc.command(&json!({"action":"stylesheet","stylesheet":{"rules":[]}})).unwrap();
            }
            doc.set_tree(&json!([{"id":"about","kind":"NText","props":{"linkify":true},"children":[
                {"id":"text","kind":"NText","props":{"text":"Visit www.example.com, email hi@example.com. Or HTTPS://example.org/a(b)."}},
                {"id":"existing","kind":"NLink","props":{"href":"/custom","text":"https://keep-original.example"}}
            ]}]))
            .unwrap();
            for _ in 0..3 {
                doc.frame(260., 600., 1.).drop_without_applying_deltas();
            }
            let values: Vec<_> = doc.semantics.iter().filter(|n| n.kind == "NLink").map(|n| n.value.clone()).collect();
            for href in ["https://www.example.com", "mailto:hi@example.com", "HTTPS://example.org/a(b)", "/custom"] {
                assert!(values.contains(&json!(href)), "Missing {href}, css={css}: {values:?}");
            }
            let link = doc.semantics.iter().find(|n| n.value == "mailto:hi@example.com").unwrap().id.clone();
            doc.command(&json!({"action":"activate","id":link})).unwrap();
            doc.frame(260., 600., 1.).drop_without_applying_deltas();
            assert!(
                doc.events.iter().any(|event| event["id"] == "about"
                    && event["value"]["href"] == "mailto:hi@example.com"
                    && event["value"]["text"] == "hi@example.com"),
                "css={css}: {:?}",
                doc.events
            );
        }
    }
}
