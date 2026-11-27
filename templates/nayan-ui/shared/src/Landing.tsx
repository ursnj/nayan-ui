import { NButton, NCard, NText, NView, useNTheme } from 'nayan-ui/components';

export function Landing() {
  const { isDarkMode, toggleTheme } = useNTheme();

  return (
    <NView className="flex flex-1 flex-col items-center bg-background px-5 pt-16 pb-5">
      <NCard className="flex w-full max-w-[520px] flex-col gap-5 rounded-2xl border border-border bg-surface p-6">
        <NView className="flex flex-col gap-2">
          <NText tag="h1" accessibilityRole="header" className="m-0 text-[32px] font-bold text-foreground">
            Nayan UI
          </NText>
          <NText tag="p" className="m-0 text-[16px] text-muted">
            Your starter app is ready. Build for the web, iOS, and Android with nayan-ui.
          </NText>
        </NView>
        <NButton onPress={toggleTheme} className="self-start rounded-lg border border-border bg-surface p-2.5 text-foreground">
          {isDarkMode ? 'Use light theme' : 'Use dark theme'}
        </NButton>
      </NCard>
    </NView>
  );
}
