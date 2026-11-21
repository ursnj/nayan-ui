import { Redirect, useLocalSearchParams } from "expo-router";
import { NDrawer, NText } from 'nayan-ui/components';
import { useState } from 'react';
import { findConcept } from "@nayan-example/shared/catalog";
import { ConceptDrawerContent, ConceptPreview } from "@nayan-example/shared/concepts";
import { AppPage } from '../../AppUI';
import { COLORS } from "../../theme";

export default function ConceptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [barsHidden, setBarsHidden] = useState(false);
  const example = findConcept(id);
  if (!example) return <Redirect href="/" />;
  const page = (
    <AppPage
      className="gap-4 px-4 pt-4 pb-8"
      keyboard
      systemBars={id === 'system-bars' ? { statusBarStyle: 'light', statusBarHidden: barsHidden } : undefined}
    >
      <NText style={{ color: COLORS.muted, fontSize: 15, lineHeight: 22 }}>{example.description}</NText>
      <ConceptPreview id={example.id} systemBars={{ hidden: barsHidden, onToggle: () => setBarsHidden((hidden) => !hidden) }} />
    </AppPage>
  );
  if (id !== 'drawer') return page;
  return (
    <NDrawer width={245} drawerContent={<AppPage><ConceptDrawerContent /></AppPage>}>
      {page}
    </NDrawer>
  );
}
