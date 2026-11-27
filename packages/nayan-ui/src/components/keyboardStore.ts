/** Focus ownership is scoped to a keyboard host; field order comes from Rust layout. */
export interface KeyboardState {
  visible: boolean;
  height: number;
  focusedInput: string | null;
  hasPrevious: boolean;
  hasNext: boolean;
}
interface FieldGroup {
  ids: readonly string[];
  focus: (id: string) => void;
}
export const idleKeyboard: KeyboardState = /* @__PURE__ */ Object.freeze({
  visible: false,
  height: 0,
  focusedInput: null,
  hasPrevious: false,
  hasNext: false
});
export class KeyboardStore {
  private groups = new Map<symbol, FieldGroup>();
  private active: { group: symbol; id: string } | null = null;
  private state = idleKeyboard;
  private listeners = new Set<() => void>();
  constructor(private dismissNative: () => void) {}
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getSnapshot = () => this.state;
  getServerSnapshot = () => idleKeyboard;
  private fields() {
    return [...this.groups].flatMap(([group, entry]) => entry.ids.map((id) => ({ group, id })));
  }
  private publish(visible = this.state.visible, height = this.state.height) {
    const fields = this.fields();
    const index = fields.findIndex((field) => field.group === this.active?.group && field.id === this.active.id);
    const next = { visible, height, focusedInput: this.active?.id ?? null, hasPrevious: index > 0, hasNext: index >= 0 && index < fields.length - 1 };
    if ((Object.keys(next) as (keyof KeyboardState)[]).every((key) => this.state[key] === next[key])) return;
    this.state = next;
    for (const listener of this.listeners) listener();
  }
  register(group: symbol, focus: FieldGroup['focus']) {
    this.groups.set(group, { ids: [], focus });
    return () => {
      this.groups.delete(group);
      if (this.active?.group === group) {
        this.active = null;
      }
      this.publish();
    };
  }
  update(group: symbol, ids: readonly string[]) {
    const entry = this.groups.get(group);
    if (!entry) return;
    entry.ids = ids;
    if (this.active?.group === group && !ids.includes(this.active.id)) {
      this.active = null;
      this.dismissNative();
    }
    this.publish();
  }
  setKeyboard = (visible: boolean, height: number) => this.publish(visible, visible && Number.isFinite(height) ? Math.max(0, height) : 0);
  didFocus(group: symbol, id: string) {
    if (!this.groups.get(group)?.ids.includes(id)) return;
    this.active = { group, id };
    this.publish();
  }
  didBlur(group: symbol, id: string) {
    if (this.active?.group !== group || this.active.id !== id) return;
    this.active = null;
    this.publish();
  }
  private move(direction: number) {
    const fields = this.fields();
    const index = fields.findIndex((field) => field.group === this.active?.group && field.id === this.active.id);
    const next = index < 0 ? undefined : fields[index + direction];
    if (!next) return false;
    this.active = next;
    this.publish();
    this.groups.get(next.group)?.focus(next.id);
    return true;
  }
  focusNext = () => this.move(1);
  focusPrevious = () => this.move(-1);
  focus = (id: string) => {
    const target = this.fields().find((field) => field.id === id);
    if (!target) return false;
    this.active = target;
    this.publish();
    this.groups.get(target.group)?.focus(id);
    return true;
  };
  dismiss = () => {
    this.active = null;
    this.publish(false, 0);
    this.dismissNative();
  };
}
