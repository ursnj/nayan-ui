/** What a host app passes to every example. */
export type ExampleProps = {
  /** Where the example's own HUD starts, below the host's header. Default: the safe area top. */
  offset?: number;
  /** Called when a run starts or ends, so the host can block its back gesture during play. */
  onPlayingChange?: (playing: boolean) => void;
};
