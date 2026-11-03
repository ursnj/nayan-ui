// The game background for a modal card (game over, settings), drawn by the Nayan engine from the same
// mesh as the engine games' scenes. Like the original card background it fills its parent and shows the
// pattern from its top-left corner (the card clips it), so cards look the same in every game.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { type Camera, GameView, isEngineAvailable, World } from '@nayan-ui/engine';
import { useGameTheme } from '../../helpers/GameTheme';
import { BACKDROP_LIGHT, backdropMesh } from './EngineBackdrop';
import { toRgb } from './EngineUtils';
import { useGameResource } from './useGameResource';

const CardScene = React.memo(({ width, height }: { width: number; height: number }) => {
  const theme = useGameTheme();
  const scene = useGameResource(
    () => {
      const world = new World(4);
      const backdrop = world.spawn({ mesh: backdropMesh(theme), color: [1, 1, 1, 1], pickable: false });
      return { world, backdrop };
    },
    (value) => () => value.world.dispose()
  );
  useEffect(() => {
    scene.world.set(scene.backdrop, { mesh: backdropMesh(theme) });
  }, [scene, theme]);

  // Looking at the card-sized top-left corner of the pattern (its space runs right and down from 0, -0).
  const camera = useMemo<Camera>(
    () => ({ eye: [width / 2, -height / 2, 100], target: [width / 2, -height / 2, 0], fov: 1, ortho: height / 2 }),
    [width, height]
  );
  const background = useMemo(() => toRgb(theme.BACKGROUND), [theme.BACKGROUND]);
  // GameView draws what the last `update` produced, so the world must be stepped even though nothing
  // in it moves (one entity: negligible). No touch handlers, so the card's buttons get every touch.
  const onUpdate = useCallback((dt: number) => scene.world.update(dt), [scene]);
  return <GameView source={scene.world} camera={camera} light={BACKDROP_LIGHT} background={background} onUpdate={onUpdate} />;
});
CardScene.displayName = 'CardScene';

export const BackdropCard = React.memo(() => {
  const theme = useGameTheme();
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
  }, []);
  return (
    <View style={[StyleSheet.absoluteFill, styles.passThrough, { backgroundColor: theme.BACKGROUND }]} onLayout={onLayout}>
      {isEngineAvailable && size && size.width > 0 && size.height > 0 ? <CardScene width={size.width} height={size.height} /> : null}
    </View>
  );
});
BackdropCard.displayName = 'BackdropCard';

const styles = StyleSheet.create({ passThrough: { pointerEvents: 'none' } });
