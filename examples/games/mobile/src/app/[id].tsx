import { useCallback } from 'react';
import { View } from 'react-native';
import { Redirect, useLocalSearchParams, useNavigation } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { findExample } from '../examples';

/** An example, full screen under the floating header. */
export default function ExampleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const example = findExample(id);
  const navigation = useNavigation();
  // The header's real height on this device (status bar included); the HUD starts below it.
  const headerHeight = useHeaderHeight();

  // No swipe back mid-run; the header's back button still leaves.
  const onPlayingChange = useCallback(
    (playing: boolean) => navigation.setOptions({ gestureEnabled: !playing, fullScreenGestureEnabled: !playing }),
    [navigation]
  );

  if (!example) return <Redirect href="/" />;
  return (
    <View style={{ flex: 1 }}>
      <example.Screen offset={headerHeight + 12} onPlayingChange={onPlayingChange} />
    </View>
  );
}
