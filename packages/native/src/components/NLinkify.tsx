import React, { useMemo } from 'react';
import { Linking, type StyleProp, Text, type TextStyle } from 'react-native';
import { cn, useThemeColor } from 'heroui-native';

export interface NLinkifyProps {
  children: React.ReactNode;
  className?: string;
  numberOfLines?: number;
  linkStyle?: StyleProp<TextStyle>;
  onPress?: (url: string, text: string) => void;
}

const URL_REGEX = /(?:https?:\/\/|www\.)[^\s<>'"]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

function parseText(text: string): { type: 'text' | 'url' | 'email'; value: string }[] {
  const parts: { type: 'text' | 'url' | 'email'; value: string }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  URL_REGEX.lastIndex = 0;
  while ((match = URL_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    const value = match[0];
    const isEmail = value.includes('@') && !value.includes('://');
    parts.push({ type: isEmail ? 'email' : 'url', value });
    lastIndex = URL_REGEX.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts;
}

function getHref(part: { type: 'text' | 'url' | 'email'; value: string }): string {
  if (part.type === 'email') return `mailto:${part.value}`;
  if (part.value.startsWith('http')) return part.value;
  return `https://${part.value}`;
}

export const NLinkify = React.memo<NLinkifyProps>(({ children, className, numberOfLines, linkStyle, onPress }) => {
  const [accentColor] = useThemeColor(['accent']);

  const defaultLinkStyle = useMemo<TextStyle>(() => ({ color: accentColor, textDecorationLine: 'underline' as const }), [accentColor]);

  const handlePress = (href: string, text: string) => {
    if (onPress) {
      onPress(href, text);
    } else {
      Linking.openURL(href).catch(() => {});
    }
  };

  const renderNode = (node: React.ReactNode, key?: string): React.ReactNode => {
    if (typeof node === 'string') {
      const parts = parseText(node);
      if (parts.length === 1 && parts[0]!.type === 'text') return node;

      return parts.map((part, i) => {
        if (part.type === 'text') return part.value;
        const href = getHref(part);
        return (
          <Text key={`${key || 'link'}-${i}`} style={[defaultLinkStyle, linkStyle]} onPress={() => handlePress(href, part.value)}>
            {part.value}
          </Text>
        );
      });
    }

    if (React.isValidElement(node)) {
      const element = node as React.ReactElement<any>;
      const nodeChildren = element.props?.children;
      if (nodeChildren == null) return node;

      const processedChildren = Array.isArray(nodeChildren)
        ? nodeChildren.map((child, i) => renderNode(child, `${key || 'c'}-${i}`))
        : renderNode(nodeChildren, key);

      return React.cloneElement(element, { key: key || element.key }, processedChildren);
    }

    return node;
  };

  const rendered = Array.isArray(children) ? children.map((child, i) => renderNode(child, `root-${i}`)) : renderNode(children, 'root');

  return (
    <Text className={cn(className)} numberOfLines={numberOfLines}>
      {rendered}
    </Text>
  );
});

NLinkify.displayName = 'NLinkify';
