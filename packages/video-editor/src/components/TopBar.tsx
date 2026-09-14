import { useState } from 'react';
import { NButton, NInput, NMenu, NMenuItem, NSelect, NTooltip } from '@nayan-ui/react';
import { NDialog } from '@nayan-ui/react';
import { DialogSize, THEMES } from '@nayan-ui/react';
import { Clapperboard, Download, Moon, Redo2, Settings, Sun, Undo2 } from 'lucide-react';
import { useEditor } from '../store/editor';

const RESOLUTIONS = [
  { label: '4K — 3840 × 2160', value: '3840x2160' },
  { label: '1440p — 2560 × 1440', value: '2560x1440' },
  { label: '1080p — 1920 × 1080', value: '1920x1080' },
  { label: '720p — 1280 × 720', value: '1280x720' },
  { label: 'Vertical 1080 × 1920', value: '1080x1920' },
  { label: 'Square 1080 × 1080', value: '1080x1080' }
];

const FRAME_RATES = [
  { label: '24 fps', value: '24' },
  { label: '25 fps', value: '25' },
  { label: '30 fps', value: '30' },
  { label: '50 fps', value: '50' },
  { label: '60 fps', value: '60' }
];

interface TopBarProps {
  theme: string;
  onToggleTheme: () => void;
  onExport: () => void;
}

export const TopBar = ({ theme, onToggleTheme, onExport }: TopBarProps) => {
  const project = useEditor(state => state.project);
  const updateProject = useEditor(state => state.updateProject);
  const undo = useEditor(state => state.undo);
  const redo = useEditor(state => state.redo);
  const canUndo = useEditor(state => state.past.length > 0);
  const canRedo = useEditor(state => state.future.length > 0);
  const clipCount = useEditor(state => state.clips.length);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const resolutionValue = `${project.width}x${project.height}`;
  const resolutionOption = RESOLUTIONS.find(option => option.value === resolutionValue) ?? {
    label: `Custom — ${project.width} × ${project.height}`,
    value: resolutionValue
  };
  const frameRateOption = FRAME_RATES.find(option => option.value === String(project.fps)) ?? {
    label: `${project.fps} fps`,
    value: String(project.fps)
  };

  return (
    <header className="flex items-center gap-3 border-b border-border bg-surface px-4 py-2.5">
      <div className="flex items-center gap-2 text-foreground">
        <Clapperboard className="h-5 w-5 text-accent" />
        <span className="text-sm font-semibold tracking-tight">Nayan Cut</span>
      </div>

      <div className="mx-2 h-5 w-px bg-separator" />

      <NInput
        value={project.name}
        onChange={event => updateProject({ name: event.target.value })}
        wrapperClassName="mb-0"
        inputClassName="h-8 w-56 text-sm"
        aria-label="Project name"
      />

      <div className="ml-auto flex items-center gap-1.5">
        <NTooltip message="Undo (⌘Z)">
          <NButton isOutline onClick={undo} disabled={!canUndo} className="h-8 w-9 px-0" aria-label="Undo">
            <Undo2 className="h-4 w-4" />
          </NButton>
        </NTooltip>
        <NTooltip message="Redo (⇧⌘Z)">
          <NButton isOutline onClick={redo} disabled={!canRedo} className="h-8 w-9 px-0" aria-label="Redo">
            <Redo2 className="h-4 w-4" />
          </NButton>
        </NTooltip>

        <div className="mx-1 h-5 w-px bg-separator" />

        <NMenu
          placement="bottom"
          trigger={
            <NButton isOutline className="h-8 px-2.5 text-xs" aria-label="Project settings">
              <Settings className="mr-1.5 h-4 w-4" />
              {project.width} × {project.height} · {project.fps}fps
            </NButton>
          }>
          <NMenuItem title="Project settings…" onAction={() => setSettingsOpen(true)} />
          <NMenuItem title={theme === THEMES.DARK ? 'Switch to light theme' : 'Switch to dark theme'} onAction={onToggleTheme} />
        </NMenu>

        <NTooltip message={theme === THEMES.DARK ? 'Light theme' : 'Dark theme'}>
          <NButton isOutline onClick={onToggleTheme} className="h-8 w-9 px-0" aria-label="Toggle theme">
            {theme === THEMES.DARK ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </NButton>
        </NTooltip>

        <NButton onClick={onExport} disabled={clipCount === 0} className="h-8 px-3 text-xs">
          <Download className="mr-1.5 h-4 w-4" />
          Export
        </NButton>
      </div>

      <NDialog isOpen={settingsOpen} title="Project settings" size={DialogSize.SM} onClose={() => setSettingsOpen(false)}>
        <div className="space-y-1">
          <NSelect
            label="Resolution"
            value={resolutionOption}
            options={RESOLUTIONS}
            onChange={option => {
              if (!option) return;
              const [width, height] = option.value.split('x').map(Number);
              updateProject({ width, height });
            }}
          />
          <NSelect
            label="Frame rate"
            value={frameRateOption}
            options={FRAME_RATES}
            onChange={option => option && updateProject({ fps: Number(option.value) })}
          />
          <div>
            <label className="mb-1.5 block text-sm text-foreground" htmlFor="project-bg">
              Background
            </label>
            <input
              id="project-bg"
              type="color"
              value={project.backgroundColor}
              onChange={event => updateProject({ backgroundColor: event.target.value })}
              className="h-9 w-full cursor-pointer rounded-md border border-border bg-field-background"
            />
          </div>
        </div>
      </NDialog>
    </header>
  );
};
