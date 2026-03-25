import React, { type ReactNode, useCallback, useEffect, useState } from 'react';
import { Linking, Platform, Text, type TextProps, type TextStyle, View, type ViewProps } from 'react-native';
// @ts-ignore
import linkifyIt from 'linkify-it';
// @ts-ignore
import mdurl from 'mdurl';
import { NText } from '@/components/NText';
import { useNTheme } from '@/hooks/useNTheme';

const defaultLinkify = linkifyIt();
const { OS } = Platform;

export interface LinkifyProps extends ViewProps {
  children: ReactNode;
  style?: TextStyle;
  linkify?: any;
  linkStyle?: TextStyle;
  linkText?: string | ((url: string) => string);
  onPress?: (url: string, text: string) => void;
  onLongPress?: (url: string, text: string) => void;
  injectViewProps?: (url: string) => object;
}

const Linkify = React.memo<LinkifyProps>(
  ({ children, style, linkify: customLinkify, linkStyle, linkText, onPress, onLongPress, injectViewProps = () => ({}), ...viewProps }) => {
    const { colors } = useNTheme();
    const defaultLinkStyle = { color: colors.primary };

    const [linkifyInstance, setLinkifyInstance] = useState(() => customLinkify || defaultLinkify);

    useEffect(() => {
      if (customLinkify && customLinkify !== linkifyInstance) {
        setLinkifyInstance(customLinkify);
      }
    }, [customLinkify, linkifyInstance]);

    const isTextNested = useCallback((component: React.ReactElement) => {
      if (!React.isValidElement(component)) throw new Error('Invalid component');
      // @ts-ignore
      return typeof component.props.children !== 'string';
    }, []);

    const processLinkify = useCallback(
      (component: React.ReactElement<TextProps>) => {
        const textContent = component.props.children as string;
        if (!textContent || typeof textContent !== 'string') return component;

        if (!linkifyInstance.pretest(textContent) || !linkifyInstance.test(textContent)) {
          return component;
        }

        let elements: ReactNode[] = [];
        let lastIndex = 0;

        try {
          linkifyInstance
            .tlds('app', true)
            .match(textContent)
            ?.forEach(({ index, lastIndex: endIndex, text, url }: any) => {
              const nonLinkedText = textContent.substring(lastIndex, index);
              if (nonLinkedText) elements.push(nonLinkedText);
              lastIndex = endIndex;

              const displayText = typeof linkText === 'function' ? linkText(url) : linkText || text;
              const clickHandlers = {
                onPress: onPress ? () => onPress(url, displayText) : undefined,
                onLongPress: OS !== 'web' && onLongPress ? () => onLongPress(url, displayText) : undefined
              };

              elements.push(
                <NText key={url + index} style={[component.props.style, linkStyle || defaultLinkStyle]} {...clickHandlers} {...injectViewProps(url)}>
                  {displayText}
                </NText>
              );
            });

          elements.push(textContent.substring(lastIndex));
          return React.cloneElement(component, {}, elements);
        } catch (err) {
          console.error('Error in processLinkify:', err);
          return component;
        }
      },
      [linkifyInstance, linkText, onPress, onLongPress, injectViewProps, linkStyle, defaultLinkStyle]
    );

    const parseComponent = useCallback(
      (component: React.ReactElement): React.ReactElement => {
        const props = component.props as any;
        if (!props?.children) return component;
        return React.cloneElement(
          component,
          {},
          React.Children.map(props.children, child => {
            if (typeof child === 'string' && linkifyInstance?.pretest?.(child)) {
              return processLinkify(<NText style={props.style}>{child}</NText>);
            }
            if (React.isValidElement(child) && child.type === Text && !isTextNested(child)) {
              return processLinkify(child as React.ReactElement<any>);
            }
            return parseComponent(child as React.ReactElement<any>);
          })
        );
      },
      [linkifyInstance, processLinkify, isTextNested]
    );

    if (!linkifyInstance) {
      console.error('Linkify instance is undefined.');
      return (
        <View {...viewProps} style={style}>
          {children}
        </View>
      );
    }

    return (
      <View {...viewProps} style={style}>
        {!onPress && !onLongPress && !linkStyle ? children : (parseComponent(<NText>{children}</NText>).props as any).children}
      </View>
    );
  }
);

Linkify.displayName = 'Linkify';

export interface NLinkifyProps extends LinkifyProps {
  linkDefault?: boolean;
}

export const NLinkify = React.memo<NLinkifyProps>(({ linkDefault, ...props }) => {
  const handleLink = useCallback((url: string) => {
    const urlObject = mdurl.parse(url);
    urlObject.protocol = urlObject.protocol.toLowerCase();
    const normalizedURL = mdurl.format(urlObject);

    Linking.canOpenURL(normalizedURL).then(supported => supported && Linking.openURL(normalizedURL));
  }, []);

  return <Linkify {...props} onPress={!linkDefault ? handleLink : props.onPress} />;
});

NLinkify.displayName = 'NLinkify';
