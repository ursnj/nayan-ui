import {
  type ComponentType,
  createElement,
  isValidElement,
  memo,
  type ReactElement,
  type ReactNode,
  useContext,
  useId,
  useImperativeHandle,
  useMemo,
  useState
} from 'react';
import { component } from './component';
import type { NListProps } from './NList';
import { NView } from './NView';
import { type ComponentListPlan, type ComponentListScroll, ComponentRuntimeContext } from './runtime';
import { PageContentInsetsContext } from './theme/contexts';
import type { ComponentProps, ComponentStyle } from './types';

const Host = /* @__PURE__ */ component<Omit<ComponentProps, 'onChange'> & { onChange: (range: ComponentListPlan) => void }>('NList');
const Item = /* @__PURE__ */ component<ComponentProps & { index: number }>('NListItem');
const Header = /* @__PURE__ */ component<ComponentProps>('NListHeader');
const StickyHeader = /* @__PURE__ */ component<ComponentProps>('NListStickyHeader');
const Footer = /* @__PURE__ */ component<ComponentProps>('NListFooter');
const Empty = /* @__PURE__ */ component<ComponentProps>('NListEmpty');

function ListRow<T>({
  item,
  index,
  renderItem,
  itemSize,
  separator,
  separatorSize,
  variableSize
}: {
  item: T;
  index: number;
  renderItem: NListProps<T>['renderItem'];
  itemSize: number;
  separator: ReactNode;
  separatorSize: number;
  extraData: unknown;
  variableSize: boolean;
}) {
  return (
    <Item index={index}>
      <NView className="w-full gap-0 border-0 bg-transparent p-0" height={variableSize ? undefined : itemSize - separatorSize}>
        {renderItem({ item, index })}
      </NView>
      {separatorSize > 0 && (
        <NView className="w-full gap-0 border-0 bg-transparent p-0" height={separatorSize}>
          {separator}
        </NView>
      )}
    </Item>
  );
}

const Row = /* @__PURE__ */ memo(ListRow) as typeof ListRow;

function accessory(value: ComponentType | ReactElement | null | undefined): ReactNode {
  return value == null ? null : isValidElement(value) ? value : createElement(value);
}

function flatStyle(value: ComponentProps['style']): ComponentStyle {
  return Array.isArray(value) ? Object.assign({}, ...value.map(flatStyle)) : value && typeof value === 'object' ? (value as ComponentStyle) : {};
}

/** Private React materialization only. Never calculates scroll geometry or widget transitions. */
export function ListBridge<T>({
  data = [],
  numColumns = 1,
  contentContainerClassName,
  contentContainerStyle,
  refreshControl,
  renderItem,
  keyExtractor = (_item, index) => String(index),
  itemSize: fixedItemSize,
  estimatedItemSize = 96,
  variableSize: measured = false,
  fillViewport = fixedItemSize == null,
  contentKey,
  refreshing,
  onRefresh,
  overscan = 6,
  initialNumToRender = 12,
  initialScrollIndex = 0,
  extraData,
  ListHeaderComponent,
  headerSize = 0,
  StickyHeaderComponent,
  stickyHeaderSize = 0,
  ListFooterComponent,
  ListEmptyComponent,
  ItemSeparatorComponent,
  separatorSize = 1,
  onEndReached,
  onEndReachedThreshold = 0.5,
  onVisibleRangeChange,
  onStickyHeaderChange,
  ref,
  ...container
}: NListProps<T>) {
  const runtime = useContext(ComponentRuntimeContext);
  const contentSafeArea = useContext(PageContentInsetsContext);
  const generatedId = useId();
  const id = container.id ?? generatedId;
  if (!runtime) throw new Error('NList must be rendered inside an engine ComponentsRoot');
  const refresh = refreshControl?.props;
  onRefresh = onRefresh ?? refresh?.onRefresh;
  refreshing = refreshing ?? refresh?.refreshing;
  const itemSize = fixedItemSize ?? estimatedItemSize;
  const variableSize = measured || fixedItemSize == null || numColumns > 1;
  const canRefresh = onRefresh != null;
  const itemCount = data.length;
  const hasSeparator = ItemSeparatorComponent != null;
  const hasHeader = ListHeaderComponent != null;
  const hasSticky = StickyHeaderComponent != null;
  const height = container.height;
  const styleHeight = flatStyle(container.style).height;

  const geometry = useMemo(
    () => ({
      itemCount,
      itemSize,
      numColumns,
      variableSize,
      fillViewport,
      contentKey,
      canRefresh,
      refreshing,
      overscan,
      initialNumToRender,
      initialScrollIndex,
      onEndReachedThreshold,
      hasSeparator,
      separatorSize,
      height,
      contentContainerClassName,
      contentSafeArea,
      contentContainerStyle: flatStyle(contentContainerStyle),
      style: { height: styleHeight },
      headerSize: hasHeader ? headerSize : 0,
      stickyHeaderSize: hasSticky ? stickyHeaderSize : 0
    }),
    [
      itemCount,
      itemSize,
      numColumns,
      variableSize,
      fillViewport,
      contentKey,
      canRefresh,
      refreshing,
      overscan,
      initialNumToRender,
      initialScrollIndex,
      onEndReachedThreshold,
      hasSeparator,
      separatorSize,
      height,
      styleHeight,
      contentContainerClassName,
      contentContainerStyle,
      contentSafeArea,
      headerSize,
      stickyHeaderSize,
      hasHeader,
      hasSticky
    ]
  );

  const props = { ...container, ...geometry, id, style: container.style };
  const baseline = useMemo(() => runtime.planList(id, geometry), [runtime, id, geometry]);
  const [snapshot, setSnapshot] = useState({ baseline, value: baseline });
  const window = snapshot.baseline === baseline ? snapshot.value : baseline;
  const footer = useMemo(() => accessory(ListFooterComponent), [ListFooterComponent]);
  const empty = useMemo(() => accessory(ListEmptyComponent), [ListEmptyComponent]);
  const header = useMemo(() => accessory(ListHeaderComponent), [ListHeaderComponent]);
  const sticky = useMemo(() => accessory(StickyHeaderComponent), [StickyHeaderComponent]);
  const separatorElement = useMemo(() => accessory(ItemSeparatorComponent), [ItemSeparatorComponent]);

  useImperativeHandle(ref, () => {
    const send = (command: ComponentListScroll) => {
      runtime.scrollList(id, command);
      setSnapshot({ baseline, value: runtime.planList(id, geometry) });
    };
    return {
      scrollToOffset: ({ offset }) => send({ kind: 'offset', offset }),
      scrollToEnd: () => send({ kind: 'end' }),
      scrollToIndex: ({ index, viewPosition }) => send({ kind: 'index', index, viewPosition })
    };
  });

  const onRange = (next: ComponentListPlan) => {
    if (next.configuration !== baseline.configuration) return;
    setSnapshot({ baseline, value: next });
    if (next.headerPinnedChanged) onStickyHeaderChange?.(next.headerPinned ?? false);
    if (next.refreshRequested) onRefresh?.();
    if (next.visibleChanged) onVisibleRangeChange?.({ first: next.first, last: next.last });
    if (next.endReached) onEndReached?.({ distanceFromEnd: next.distanceFromEnd });
  };
  const rows: ReactNode[] = [];
  for (let index = window.start; index < window.end; index++) {
    const item = data[index]!;
    const separator = index < data.length - 1 ? separatorElement : null;
    rows.push(
      createElement(Row<T>, {
        key: keyExtractor(item, index),
        item,
        index,
        renderItem,
        itemSize,
        separator,
        separatorSize: separator != null ? separatorSize : 0,
        extraData,
        variableSize
      })
    );
  }

  return (
    <PageContentInsetsContext.Provider value={null}>
      <Host {...props} accessibilityLabel={container.accessibilityLabel ?? 'List'} onChange={onRange}>
        {header != null && <Header>{header}</Header>}
        {data.length ? rows : <Empty>{empty}</Empty>}
        {footer != null && <Footer>{footer}</Footer>}
        {sticky != null && <StickyHeader>{sticky}</StickyHeader>}
      </Host>
    </PageContentInsetsContext.Provider>
  );
}
