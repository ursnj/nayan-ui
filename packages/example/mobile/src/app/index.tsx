import { type Href, useRouter } from 'expo-router';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NPress, NText, NView } from 'nayan-ui/components';
import { APP_TITLE, carRacing, conceptGroups } from "@nayan-example/shared/catalog";
import { AppPage } from '../AppUI';
import { COLORS } from "../theme";

function ExampleLink({ title, description, open, featured }: { title: string; description: string; open: () => void; featured?: boolean }) {
  return (
    <NPress
      onPress={open}
      accessibilityRole="link"
      accessibilityLabel={title}
      className="w-full gap-1 rounded-xl border p-4"
      style={({ pressed }) => ({
        backgroundColor: featured ? '#263d60' : COLORS.surface,
        borderColor: featured ? '#385a82' : COLORS.border,
        opacity: pressed ? 0.78 : 1
      })}
    >
      <NText className="text-lg font-bold" style={{ color: COLORS.text }}>
        {title}
      </NText>
      <NText className="text-sm" style={{ color: COLORS.muted }}>
        {description}
      </NText>
    </NPress>
  );
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const open = (href: Href) => () => router.push(href);
  return (
    <AppPage className="gap-4 px-4 pb-6" style={{ paddingTop: insets.top + 24 }}>
      <NText accessibilityRole="header" className="text-3xl font-extrabold" style={{ color: COLORS.text }}>
        {APP_TITLE}
      </NText>
      <ExampleLink {...carRacing} open={open(`/${carRacing.id}`)} featured />
      {conceptGroups.map((group) => (
        <NView key={group.title} className="mt-2 w-full gap-2.5">
          <NText accessibilityRole="header" className="font-bold" style={{ color: COLORS.muted }}>
            {group.title}
          </NText>
          {group.examples.map((example) => (
            <ExampleLink key={example.id} {...example} open={open(`/concepts/${example.id}`)} />
          ))}
        </NView>
      ))}
    </AppPage>
  );
}
