import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { carRacing, findConcept } from "@nayan-example/shared/catalog";
import { COLORS } from "../theme";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ contentStyle: { backgroundColor: COLORS.background } }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="[id]"
          options={{
            title: carRacing.title,
            headerTransparent: true,
            headerTitleAlign: "center",
            headerBackButtonDisplayMode: "minimal",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="concepts/[id]"
          options={({ route }) => ({
            title: findConcept((route.params as { id?: string })?.id)?.title ?? "Example",
            headerStyle: { backgroundColor: COLORS.background },
            headerTintColor: COLORS.text,
            headerBackButtonDisplayMode: "minimal",
          })}
        />
      </Stack>
    </>
  );
}
