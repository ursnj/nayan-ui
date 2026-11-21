import { useRef, useState, type ReactNode } from "react";
import { NPress, NText, NView } from 'nayan-ui/components';

const text = "#e2e8f0";
const muted = "#aebed2";

export function DemoText({ children }: { children: ReactNode }) {
  return <NText style={{ color: muted, fontSize: 15, lineHeight: 22 }}>{children}</NText>;
}

export function DemoButton({
  children,
  onPress,
  disabled,
}: {
  children: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <NPress
      onPress={onPress}
      disabled={disabled}
      style={{
        minHeight: 44,
        justifyContent: "center",
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: disabled ? "#253246" : "#294467",
      }}
    >
      <NText style={{ color: text, fontSize: 15, fontWeight: "600" }}>{children}</NText>
    </NPress>
  );
}

export function DemoPanel({ children }: { children: ReactNode }) {
  return (
    <NView style={{ gap: 12, padding: 16, backgroundColor: "#192539", borderRadius: 14 }}>
      {children}
    </NView>
  );
}

export function DemoControls({ children }: { children: ReactNode }) {
  return <NView style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{children}</NView>;
}

export function DemoSurface({ children, height = 440 }: { children: ReactNode; height?: number }) {
  return (
    <NView className="w-full gap-4 p-4" style={{ minHeight: height }}>
      {children}
    </NView>
  );
}

export type DemoAction = { label: string; run: () => string | Promise<string> };

export function ActionDemo({ actions, children }: { actions: DemoAction[]; children?: ReactNode }) {
  const running = useRef(false);
  const [busy, setBusy] = useState<string>();
  const [result, setResult] = useState<string>();

  async function perform(action: DemoAction) {
    if (running.current) return;
    running.current = true;
    setBusy(action.label);
    setResult(undefined);
    try {
      setResult(await action.run());
    } catch (error) {
      setResult(error instanceof Error ? error.message : String(error));
    } finally {
      running.current = false;
      setBusy(undefined);
    }
  }

  return (
    <DemoPanel>
      {children}
      <DemoControls>
        {actions.map((action) => (
          <DemoButton
            key={action.label}
            onPress={() => void perform(action)}
            disabled={busy !== undefined}
          >
            {action.label}
          </DemoButton>
        ))}
      </DemoControls>
      {(busy || result) && <DemoText>{busy ? `${busy}…` : result}</DemoText>}
    </DemoPanel>
  );
}
