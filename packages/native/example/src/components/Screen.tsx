import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { Stack } from "expo-router";

interface ScreenProps {
  /** Shown in the navigation bar. */
  title: string;
  /** Space between sections. */
  gap?: 1 | 3 | 4;
  keyboardAware?: boolean;
  children: ReactNode;
}

/** The scaffold every example screen shares: a title, a scroll view and padded content. */
export default function Screen({ title, gap = 4, keyboardAware = false, children }: ScreenProps) {
  return (
    <>
      <Stack.Screen options={{ title }} />
      <ScrollView
        className="flex-1 bg-background"
        keyboardShouldPersistTaps={keyboardAware ? "handled" : undefined}
      >
        <View className={`p-4 gap-${gap}`}>{children}</View>
      </ScrollView>
    </>
  );
}
