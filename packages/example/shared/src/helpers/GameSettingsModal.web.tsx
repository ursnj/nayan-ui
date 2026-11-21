import { memo, useEffect, useRef, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { getGameTitle } from '../services/GamesConstants';
import { isThemedGame } from '../services/ThemeService';
import type { GAME_IDS, GameSettings } from '../services/UtilsService';
import { useGameTheme } from './GameTheme';

export interface GameSettingsProps {
  gameId: string;
  settings: GameSettings;
  onSettingsChange?: (settings: GameSettings) => void;
}

/** The browser handles focus containment, Escape and focus restoration. */
export const GameSettingsModal = memo(function GameSettingsModal({ gameId, settings, onSettingsChange }: GameSettingsProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const theme = useGameTheme();
  const close = () => onSettingsChange?.({ ...settings, isVisible: false });
  useEffect(() => {
    const element = dialog.current;
    if (settings.isVisible && !element?.open) element?.showModal();
    else if (!settings.isVisible && element?.open) element.close();
  }, [settings.isVisible]);
  const toggle = (key: 'enableSounds' | 'enableHaptics' | 'theme', label: string, description: string) => (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 0' }}>
      <span><span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 13, color: theme.TEXT_MUTED }}>{description}</span></span>
      <input type="checkbox" role="switch" checked={key === 'theme' ? settings.theme === 'dark' : settings[key]}
        style={{ accentColor: theme.SOLID, width: 20, height: 20 }}
        onChange={(event) => onSettingsChange?.({ ...settings, [key]: key === 'theme' ? (event.target.checked ? 'dark' : 'light') : event.target.checked })} />
    </label>
  );
  return createPortal(
    <dialog ref={dialog} data-testid="game-settings-popover" aria-label={`${getGameTitle(gameId)} Settings`}
      style={{
        position: 'fixed', inset: 'auto', top: settings.anchor?.top ?? 80, right: settings.anchor?.right ?? 16,
        margin: 0, width: 'min(360px, calc(100vw - 32px))', maxHeight: 'calc(100dvh - 96px)', boxSizing: 'border-box',
        overflowY: 'auto', padding: 20, border: `1px solid ${theme.SURFACE}`, borderRadius: 16,
        background: theme.SURFACE, color: theme.TEXT, boxShadow: '0 12px 40px #0004'
      } as CSSProperties}
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Settings</h2>
        <button type="button" autoFocus aria-label="Close settings" onClick={close}
          style={{ width: 40, height: 40, borderRadius: 20, border: 0, background: theme.SURFACE, color: theme.TEXT, cursor: 'pointer' }}>✕</button>
      </div>
      {toggle('enableSounds', 'Sound Effects', 'Play sounds during gameplay')}
      <hr style={{ borderColor: theme.DIVIDER }} />
      {toggle('enableHaptics', 'Haptic Feedback', 'Vibration on interactions')}
      {isThemedGame(gameId as GAME_IDS) && <><hr style={{ borderColor: theme.DIVIDER }} />{toggle('theme', 'Dark Mode', 'Play with the dark theme')}</>}
    </dialog>, document.body
  );
});
