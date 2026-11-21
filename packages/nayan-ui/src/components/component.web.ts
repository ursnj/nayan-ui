import { type ComponentType, createElement, useContext } from 'react';
import { ComponentRenderContext } from './ThemeContext';
import type { ComponentProps } from './types';

/** Semantic HTML is a server/loading fallback; the active renderer always emits Rust host nodes. */
export function component<P = ComponentProps>(name: string): ComponentType<P> {
  const Control = (properties: P) => {
    const rendering = useContext(ComponentRenderContext);
    const props = properties as Record<string, any>;
    if (rendering) return createElement(name, props);
    const { tag, children, onPress, onChangeText, accessibilityLabel, source, src, ...rest } = props;
    const defaults: Record<string, string> = {
      NButton: 'button',
      NPress: 'button',
      NLink: 'a',
      NText: 'span',
      NInput: 'input',
      NSearchField: 'input',
      NTextarea: 'textarea',
      NImage: 'img',
      NIcon: 'span',
      NCheck: 'input',
      NSlider: 'input',
      NProgress: 'progress',
      NSelect: 'select',
      NDisclosure: 'details'
    };
    const element = tag ?? defaults[name] ?? 'div';
    const attributes: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (
        key === 'className' ||
        key === 'ref' ||
        key === 'target' ||
        key === 'rel' ||
        key === 'download' ||
        key === 'readOnly' ||
        key === 'required' ||
        key === 'tabIndex' ||
        key === 'min' ||
        key === 'max' ||
        key === 'step' ||
        key === 'rows' ||
        key === 'cols' ||
        key === 'pattern' ||
        key === 'autoComplete' ||
        key === 'autoFocus' ||
        key === 'inputMode' ||
        key === 'minLength' ||
        key === 'style' ||
        key === 'id' ||
        key === 'role' ||
        key === 'title' ||
        key === 'alt' ||
        key === 'href' ||
        key === 'width' ||
        key === 'height' ||
        key === 'name' ||
        key === 'value' ||
        key === 'defaultValue' ||
        key === 'placeholder' ||
        key === 'disabled' ||
        key === 'type' ||
        key === 'checked' ||
        key === 'maxLength' ||
        key.startsWith('aria-') ||
        key.startsWith('data-') ||
        (key.startsWith('on') &&
          ![
            'onValueChange',
            'onChangeOptions',
            'onChangeText',
            'onExpandedChange',
            'onSelectedChange',
            'onLoadStart',
            'onLoadEnd',
            'onVisibleChange',
            'onPress',
            'onClear'
          ].includes(key))
      )
        attributes[key] = value;
    }
    if (accessibilityLabel) attributes['aria-label'] = accessibilityLabel;
    if (props.selectable === false) attributes.style = { ...props.style, userSelect: 'none' };
    // Bootstrap HTML must paint before WASM exists. Inside a ComponentsRoot the early return above
    // keeps loading animation, geometry and accessibility owned by Rust.
    if (name === 'NLoading') {
      const size = Math.min(
        160,
        Math.max(
          8,
          typeof props.size === 'number' && Number.isFinite(props.size) ? props.size : ({ small: 20, large: 48 }[props.size as string] ?? 32)
        )
      );
      const stroke = Math.min(
        size * 0.25,
        Math.max(0.5, typeof props.strokeWidth === 'number' && Number.isFinite(props.strokeWidth) ? props.strokeWidth : size * 0.1)
      );
      const radius = (size - stroke) / 2;
      const color = ['accent', 'foreground', 'muted', 'success', 'warning', 'danger'].includes(props.color)
        ? `var(--${props.color})`
        : (props.color ?? 'var(--accent, currentColor)');
      return createElement(
        element,
        {
          ...attributes,
          'role': attributes.role ?? 'status',
          'aria-label': accessibilityLabel ?? props.label ?? 'Loading',
          'aria-busy': props.animating !== false,
          'style': {
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            ...(props.fill ? { flex: 1, alignSelf: 'stretch', width: '100%', minHeight: 0 } : {}),
            gap: 8,
            color,
            ...props.style
          }
        },
        createElement(
          'style',
          null,
          '@keyframes nayan-loading-turn{from{transform:rotate3d(0,0,1,0deg)}to{transform:rotate3d(0,0,1,360deg)}}@media(prefers-reduced-motion:reduce){[data-nayan-loading-ring]{animation:none!important;will-change:auto!important}}'
        ),
        createElement(
          'span',
          {
            'aria-hidden': true,
            'data-nayan-loading-ring': true,
            'style': {
              display: 'block',
              width: size,
              height: size,
              flexShrink: 0,
              transformOrigin: '50% 50%',
              backfaceVisibility: 'hidden',
              willChange: props.animating === false ? 'auto' : 'transform',
              animation: props.animating === false ? 'none' : 'nayan-loading-turn 1.2s linear infinite'
            }
          },
          createElement(
            'svg',
            { width: size, height: size, viewBox: `0 0 ${size} ${size}`, fill: 'none', style: { display: 'block' } },
            createElement('circle', { cx: size / 2, cy: size / 2, r: radius, stroke: 'currentColor', strokeWidth: stroke, opacity: 0.12 }),
            createElement('circle', {
              cx: size / 2,
              cy: size / 2,
              r: radius,
              stroke: 'currentColor',
              strokeWidth: stroke,
              strokeLinecap: 'round',
              pathLength: 100,
              strokeDasharray: '72 100',
              transform: `rotate(-90 ${size / 2} ${size / 2})`
            })
          )
        ),
        props.label ? createElement('span', null, props.label) : null
      );
    }
    if (onPress && !props.linkify) attributes.onClick = onPress;
    if (onChangeText) attributes.onChange = (event: { target: { value: string } }) => onChangeText(event.target.value);
    if (props.onValueChange && ['NInput', 'NSearchField', 'NTextarea'].includes(name))
      attributes.onChange = (event: { target: { value: string } }) => props.onValueChange(event.target.value);
    if (name === 'NSlider') {
      attributes.type = 'range';
      attributes.onChange = (event: { currentTarget: HTMLInputElement }) =>
        (props.onValueChange ?? props.onChange)?.(event.currentTarget.valueAsNumber);
    }
    if (name === 'NProgress') attributes['aria-label'] ??= props.label;
    if (name === 'NCheck') {
      attributes.type = 'checkbox';
      if (props.onChange) attributes.onChange = (event: { target: { checked: boolean } }) => props.onChange(event.target.checked);
    }
    if (element === 'form' && props.onSubmit)
      attributes.onSubmit = (event: { preventDefault: () => void; currentTarget: HTMLFormElement }) => {
        event.preventDefault();
        props.onSubmit(Object.fromEntries(new FormData(event.currentTarget)));
      };
    if (name === 'NSelect') {
      const items = (props.options ?? props.items ?? []).map(
        (item: string | { value: string; label: string; disabled?: boolean; isDisabled?: boolean }) =>
          typeof item === 'string' ? { label: item, value: item } : item
      );
      const multi = Boolean(props.isMulti || props.multiple);
      const key = (value: unknown) => String(value && typeof value === 'object' && 'value' in value ? value.value : (value ?? ''));
      attributes.multiple = multi;
      attributes.disabled = props.disabled || props.isDisabled || props.isLoading;
      attributes['aria-label'] ??= props.label ?? props.selectLabel ?? 'Select';
      const selected = props.value !== undefined ? props.value : props.selected;
      if (selected !== undefined) attributes.value = multi ? (selected ?? []).map(key) : key(selected);
      else delete attributes.value;
      if (props.defaultValue !== undefined) attributes.defaultValue = multi ? (props.defaultValue ?? []).map(key) : key(props.defaultValue);
      else if (selected === undefined) attributes.defaultValue = multi ? [] : '';
      attributes.onChange = (event: { currentTarget: HTMLSelectElement }) => {
        const values = Array.from(event.currentTarget.selectedOptions)
          .map((selected) => items.find((item: { value: string }) => String(item.value) === selected.value))
          .filter(Boolean);
        if (props.onChangeOptions) props.onChangeOptions(multi ? values : (values[0] ?? null));
        else if (props.onChange) props.onChange(multi ? values : (values[0] ?? null));
        else props.onValueChange?.(multi ? values.map(key) : key(values[0]));
      };
      return createElement(
        element,
        attributes,
        !multi ? createElement('option', { value: '', disabled: !props.isClearable }, props.placeholder ?? 'Select...') : null,
        ...items.map((item: { value: string; label: string; disabled?: boolean; isDisabled?: boolean }) =>
          createElement('option', { key: item.value, value: item.value, disabled: item.disabled || item.isDisabled }, item.label)
        )
      );
    }
    if (name === 'NImage') {
      const candidate = Array.isArray(source) ? source[0] : source;
      attributes.src = src ?? (typeof candidate === 'string' ? candidate : candidate?.uri);
      attributes.loading = props.priority ? 'eager' : props.loading;
      attributes.fetchPriority = props.priority ? 'high' : undefined;
      attributes.decoding = props.decoding ?? 'async';
    }
    if (name === 'NIcon')
      return createElement(
        'svg',
        {
          ...attributes,
          'width': props.size ?? 24,
          'height': props.size ?? 24,
          'viewBox': Array.isArray(props.viewBox) ? props.viewBox.join(' ') : `0 0 ${props.viewBox ?? 24} ${props.viewBox ?? 24}`,
          'fill': props.strokeWidth ? 'none' : (props.color ?? 'currentColor'),
          'stroke': props.strokeWidth ? (props.color ?? 'currentColor') : undefined,
          'strokeWidth': props.strokeWidth,
          'strokeLinecap': 'round',
          'strokeLinejoin': 'round',
          'aria-hidden': !accessibilityLabel
        },
        ...(typeof props.paths === 'string' ? [props.paths] : (props.paths ?? [])).map((d: string, index: number) =>
          createElement('path', { key: index, d })
        )
      );
    if (['img', 'input', 'hr', 'br'].includes(element)) return createElement(element, attributes);
    return createElement(element, attributes, children ?? props.label ?? props.text ?? null);
  };
  Control.displayName = name;
  return Control;
}
