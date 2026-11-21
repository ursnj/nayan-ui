import { useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ComponentsRoot, NCard, NList, type NListRenderItemInfo, NPress, NText, NTheme } from '@nayan-ui/engine/components';

const players = Array.from({ length: 100_000 }, (_, index) => ({ id: String(index), name: `Player ${index + 1}` }));
const keyExtractor = (player: (typeof players)[number]) => player.id;

function Example() {
  const [selected, setSelected] = useState('None');
  const [range, setRange] = useState('Loading players');
  const renderItem = useCallback(
    ({ item, index }: NListRenderItemInfo<(typeof players)[number]>) => (
      <NPress
        className="h-16 w-full"
        onPress={() => {
          setSelected(item.name);
          document.body.dataset.selected = item.id;
        }}>
        <NCard className="h-16 w-full flex-row items-center gap-3 border-0 bg-transparent px-3 py-2">
          <NCard className="w-10 rounded-xl border-0 bg-[#263154] px-3 py-2">
            <NText className="text-sm text-[#b8c9ff]">
              {String(index + 1)
                .padStart(2, '0')
                .slice(-2)}
            </NText>
          </NCard>
          <NCard className="gap-0 border-0 bg-transparent p-0">
            <NText className="text-base font-medium text-[#f1f5ff]">{item.name}</NText>
            <NText className="text-sm text-[#9aa9c4]">{index % 3 === 0 ? 'Online now' : 'Ready to play'}</NText>
          </NCard>
        </NCard>
      </NPress>
    ),
    []
  );
  return (
    <ComponentsRoot
      style={{ width: '100%', maxWidth: 480, height: 660 }}
      onError={(error) => {
        document.body.dataset.error = error.message;
      }}>
      <NTheme theme="dark" colors={{ background: '#0f1423', surface: '#192136', border: '#2b3650' }} className="gap-4 p-5">
        <NText className="text-2xl font-medium">Players</NText>
        <NText className="text-sm text-[#9aa9c4]">100,000 players. One small render window.</NText>
        <NCard className="w-full gap-0 rounded-2xl border p-0">
          <NList
            id="players"
            accessibilityLabel="Player list"
            data={players}
            itemSize={64}
            height={456}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            onVisibleRangeChange={({ first, last }) => setRange(`Showing ${first + 1}–${last + 1} of 100,000`)}
          />
        </NCard>
        <NText className="text-sm text-[#9aa9c4]">{range}</NText>
        <NText className="text-sm">{`Selected: ${selected}`}</NText>
      </NTheme>
    </ComponentsRoot>
  );
}
createRoot(document.getElementById('root')!).render(<Example />);
