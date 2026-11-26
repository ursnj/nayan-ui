import { NButton, NCard, NText, NView, useNTheme } from 'nayan-ui/components';

export function Landing() {
  const { isDarkMode, toggleTheme } = useNTheme();
  const colors = isDarkMode
    ? { background: '#0f172a', card: '#1e293b', text: '#f8fafc', muted: '#cbd5e1', border: '#334155' }
    : { background: '#f1f5f9', card: '#ffffff', text: '#0f172a', muted: '#475569', border: '#cbd5e1' };

  return (
    <NView style={{ flex: 1, alignItems: 'center', padding: 20, paddingTop: 64, backgroundColor: colors.background }}>
      <NCard
        style={{
          width: '100%',
          maxWidth: 520,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          padding: 24,
          borderStyle: 'solid',
          borderWidth: 1,
          borderRadius: 16,
          borderColor: colors.border,
          backgroundColor: colors.card
        }}
      >
        <NView style={{ gap: 8 }}>
          <NText tag="h1" accessibilityRole="header" style={{ margin: 0, fontSize: 32, fontWeight: '700', color: colors.text }}>
            Nayan UI
          </NText>
          <NText tag="p" style={{ margin: 0, fontSize: 16, color: colors.muted }}>
            Your starter app is ready. Build for the web, iOS, and Android with nayan-ui.
          </NText>
        </NView>
        <NButton
          onPress={toggleTheme}
          style={{
            alignSelf: 'flex-start',
            padding: 10,
            borderRadius: 8,
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: colors.border,
            backgroundColor: colors.card,
            color: colors.text
          }}
        >
          {isDarkMode ? 'Use light theme' : 'Use dark theme'}
        </NButton>
      </NCard>
    </NView>
  );
}
