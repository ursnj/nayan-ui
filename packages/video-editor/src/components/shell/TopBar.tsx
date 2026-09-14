import { useRef, useState } from 'react';
import { NDialog, showToast } from '@nayan-ui/react';
import { DialogSize } from '@nayan-ui/react';
import { Clapperboard, Download, FileDown, FilePlus2, FileUp, Moon, Redo2, Settings, Sun, Undo2 } from 'lucide-react';
import { download } from '../../lib/utils';
import { readEditorState, serialiseProject, useEditor } from '../../store/editor';
import type { ProjectFile } from '../../store/editor';
import { IconButton, NumberField, SelectField } from '../controls';

const RESOLUTIONS = [
  { value: '3840x2160', label: '4K — 3840 × 2160' },
  { value: '2560x1440', label: '1440p — 2560 × 1440' },
  { value: '1920x1080', label: '1080p — 1920 × 1080' },
  { value: '1280x720', label: '720p — 1280 × 720' },
  { value: '1080x1920', label: 'Vertical — 1080 × 1920' },
  { value: '1080x1350', label: 'Portrait 4:5 — 1080 × 1350' },
  { value: '1080x1080', label: 'Square — 1080 × 1080' }
];

const FRAME_RATES = [
  { value: '23.976', label: '23.976 fps' },
  { value: '24', label: '24 fps' },
  { value: '25', label: '25 fps' },
  { value: '30', label: '30 fps' },
  { value: '50', label: '50 fps' },
  { value: '60', label: '60 fps' }
];

interface TopBarProps {
  theme: string;
  onToggleTheme: () => void;
  onExport: () => void;
}

export const TopBar = ({ theme, onToggleTheme, onExport }: TopBarProps) => {
  const project = useEditor(state => state.project);
  const updateProject = useEditor(state => state.updateProject);
  const loadProject = useEditor(state => state.loadProject);
  const resetProject = useEditor(state => state.resetProject);
  const undo = useEditor(state => state.undo);
  const redo = useEditor(state => state.redo);
  const canUndo = useEditor(state => state.past.length > 0);
  const canRedo = useEditor(state => state.future.length > 0);
  const clipCount = useEditor(state => state.clips.length);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const saveProject = () => {
    const data = serialiseProject(readEditorState());
    download(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `${project.name || 'project'}.nayaneditor.json`);
    showToast('Media files are referenced by name — re-import them after opening.', 'Project saved');
  };

  const openProject = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as ProjectFile;
      if (data.version !== 1 || !Array.isArray(data.clips)) throw new Error('Unrecognised project file');
      loadProject(data);
      showToast('Re-import the original media to relink the clips.', 'Project opened');
    } catch {
      showToast('That file is not a Nayan Editor project.', 'Could not open');
    }
  };

  return (
    <header className="island flex shrink-0 items-center gap-2 px-3 py-2">
      <div className="flex items-center gap-2">
        <Clapperboard className="h-5 w-5 text-accent" />
        <span className="text-sm font-semibold tracking-tight text-foreground">Nayan Editor</span>
      </div>

      <span className="mx-1 h-5 w-px bg-separator" />

      <input
        value={project.name}
        onChange={event => updateProject({ name: event.target.value })}
        aria-label="Project name"
        className="w-56 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-foreground outline-none transition-colors hover:border-border focus:border-accent focus:bg-field-background"
      />

      <div className="ml-2 flex items-center gap-0.5">
        <IconButton label="New project" onClick={resetProject}>
          <FilePlus2 className="h-4 w-4" />
        </IconButton>
        <IconButton label="Open project" onClick={() => fileRef.current?.click()}>
          <FileUp className="h-4 w-4" />
        </IconButton>
        <IconButton label="Save project" onClick={saveProject}>
          <FileDown className="h-4 w-4" />
        </IconButton>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={event => {
            const file = event.target.files?.[0];
            if (file) void openProject(file);
            event.target.value = '';
          }}
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <IconButton label="Undo" onClick={undo} disabled={!canUndo}>
          <Undo2 className="h-4 w-4" />
        </IconButton>
        <IconButton label="Redo" onClick={redo} disabled={!canRedo}>
          <Redo2 className="h-4 w-4" />
        </IconButton>

        <span className="mx-1 h-5 w-px bg-separator" />

        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] text-muted transition-colors hover:border-accent hover:text-foreground">
          <Settings className="h-3.5 w-3.5" />
          {project.width} × {project.height} · {project.fps}fps
        </button>

        <IconButton label={theme === 'dark' ? 'Light theme' : 'Dark theme'} onClick={onToggleTheme}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </IconButton>

        <button
          type="button"
          onClick={onExport}
          disabled={clipCount === 0}
          className="ml-1 flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      <NDialog isOpen={settingsOpen} title="Project settings" size={DialogSize.SM} onClose={() => setSettingsOpen(false)}>
        <div className="space-y-1">
          <SelectField
            label="Resolution"
            value={`${project.width}x${project.height}`}
            options={
              RESOLUTIONS.some(option => option.value === `${project.width}x${project.height}`)
                ? RESOLUTIONS
                : [{ value: `${project.width}x${project.height}`, label: `Custom — ${project.width} × ${project.height}` }, ...RESOLUTIONS]
            }
            onChange={value => {
              const [width, height] = value.split('x').map(Number);
              updateProject({ width, height });
            }}
          />
          <SelectField
            label="Frame rate"
            value={String(project.fps)}
            options={
              FRAME_RATES.some(option => option.value === String(project.fps))
                ? FRAME_RATES
                : [{ value: String(project.fps), label: `${project.fps} fps` }, ...FRAME_RATES]
            }
            onChange={value => updateProject({ fps: Number(value) })}
          />
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Width" value={project.width} min={16} max={7680} step={2} onChange={width => updateProject({ width })} />
            <NumberField label="Height" value={project.height} min={16} max={4320} step={2} onChange={height => updateProject({ height })} />
          </div>
          <div>
            <span className="mb-1 block text-[11px] text-muted">Background</span>
            <input
              type="color"
              value={project.backgroundColor}
              onChange={event => updateProject({ backgroundColor: event.target.value })}
              aria-label="Background colour"
              className="h-9 w-full cursor-pointer rounded-md border border-border bg-transparent p-1"
            />
          </div>
        </div>
      </NDialog>
    </header>
  );
};
