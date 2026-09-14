import { useRef, useState } from 'react';
import { NButton, NConfirmAlert, NDialog, NInput, showToast } from '@nayan-ui/react';
import { DialogSize } from '@nayan-ui/react';
import { Clapperboard, Download, FileDown, FilePlus2, FileUp, Moon, Redo2, RotateCcw, Settings, Sun, Undo2 } from 'lucide-react';
import { BUNDLE_EXTENSION, BundleError, readBundle, writeBundle } from '../../lib/projectBundle';
import { download } from '../../lib/utils';
import { readEditorState, serialiseProject, useEditor } from '../../store/editor';
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
  /** Restores panel sizes and theme — the settings kept in local storage. */
  onResetPreferences: () => void;
}

export const TopBar = ({ theme, onToggleTheme, onExport, onResetPreferences }: TopBarProps) => {
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
  const [confirmNew, setConfirmNew] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /*
   * Gated on clips, not on assets: `resetProject` empties the timeline and
   * restores the project settings, but leaves the imported media alone — so
   * with nothing on the timeline there is nothing to warn about, and a dialog
   * in front of a no-op is just a click to dismiss.
   */
  const startNewProject = () => {
    if (clipCount === 0) {
      resetProject();
      return;
    }
    setConfirmNew(true);
  };

  const [busy, setBusy] = useState<'save' | 'open' | null>(null);

  const saveProject = async () => {
    setBusy('save');
    try {
      const bundle = await writeBundle(serialiseProject(readEditorState()));
      download(bundle, `${project.name || 'project'}.${BUNDLE_EXTENSION}`);
      showToast('The project and all its media are inside one file.', 'Project saved');
    } catch (error) {
      showToast(error instanceof BundleError ? error.message : 'The project could not be saved.', 'Save failed');
    } finally {
      setBusy(null);
    }
  };

  const openProject = async (file: File) => {
    setBusy('open');
    try {
      const { project: data, assets, missing } = await readBundle(file);
      loadProject(data, assets);
      if (missing.length > 0) {
        showToast(`Could not restore: ${missing.join(', ')}. Those clips will be empty.`, 'Opened with missing media');
      } else {
        showToast(`${assets.length} media file${assets.length === 1 ? '' : 's'} restored.`, 'Project opened');
      }
    } catch (error) {
      showToast(error instanceof BundleError ? error.message : 'That file is not a Nayan Editor project.', 'Could not open');
    } finally {
      setBusy(null);
    }
  };

  return (
    <header className="island flex shrink-0 items-center gap-2 px-3 py-2">
      <div className="flex shrink-0 items-center gap-2">
        <Clapperboard className="h-5 w-5 text-accent" />
        <span className="hidden whitespace-nowrap text-sm font-semibold tracking-tight text-foreground lg:inline">Nayan Editor</span>
      </div>

      <span className="mx-1 h-5 w-px shrink-0 bg-separator" />

      {/* The one elastic item in the bar: everything else is a fixed control,
          so the project name is what gives when the window narrows. */}
      <NInput
        value={project.name}
        onChange={event => updateProject({ name: event.target.value })}
        wrapperClassName="mb-0 w-56 min-w-24 shrink"
        inputClassName="h-8 text-sm"
        aria-label="Project name"
      />

      <div className="ml-2 flex shrink-0 items-center gap-0.5">
        <IconButton label="New project" onClick={startNewProject}>
          <FilePlus2 className="h-4 w-4" />
        </IconButton>
        <IconButton label="Open project" onClick={() => fileRef.current?.click()} disabled={busy !== null}>
          <FileUp className="h-4 w-4" />
        </IconButton>
        <IconButton label={busy === 'save' ? 'Bundling media…' : 'Save project'} onClick={() => void saveProject()} disabled={busy !== null}>
          <FileDown className="h-4 w-4" />
        </IconButton>
        <input
          ref={fileRef}
          type="file"
          accept={`.${BUNDLE_EXTENSION},application/zip`}
          className="hidden"
          onChange={event => {
            const file = event.target.files?.[0];
            if (file) void openProject(file);
            event.target.value = '';
          }}
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        <IconButton label="Undo" onClick={undo} disabled={!canUndo}>
          <Undo2 className="h-4 w-4" />
        </IconButton>
        <IconButton label="Redo" onClick={redo} disabled={!canRedo}>
          <Redo2 className="h-4 w-4" />
        </IconButton>

        <span className="mx-1 h-5 w-px bg-separator" />

        <NButton isOutline onClick={() => setSettingsOpen(true)} aria-label="Project settings" className="h-7 whitespace-nowrap px-2 text-[11px]">
          <Settings className="h-3.5 w-3.5 xl:mr-1.5" />
          {/* 4K at 23.976fps is the longest this gets; below xl it is the icon
              alone rather than a string that squeezes out the export button. */}
          <span className="hidden xl:inline">
            {project.width} × {project.height} · {project.fps}fps
          </span>
        </NButton>

        <IconButton label={theme === 'dark' ? 'Light theme' : 'Dark theme'} onClick={onToggleTheme}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </IconButton>

        <NButton onClick={onExport} disabled={clipCount === 0} className="ml-1 h-8 px-3 text-xs">
          <Download className="mr-1.5 h-4 w-4" />
          Export
        </NButton>
      </div>

      <NConfirmAlert
        isOpen={confirmNew}
        title="Start a new project?"
        message="This clears the timeline and resets the project settings. Your imported media stays in the Media panel, and Undo will bring the edit back — but nothing is saved automatically, so export or save the project first if you want to keep it."
        confirmText="Discard and start new"
        cancelText="Keep editing"
        onResult={confirmed => {
          if (confirmed) resetProject();
        }}
        onClose={() => setConfirmNew(false)}
      />

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
          {/* The background lives in its own panel now — a colour field here
              would be a second place to set the same thing, and the two would
              drift apart the moment the background stopped being a colour. */}
          <p className="pt-1 text-[11px] text-muted">Background is set in the Background panel, on the left.</p>

          {/* Below the rule is editor state, not project state: it follows the
              browser rather than the file, which is why it needs its own way
              back to the defaults. */}
          <div className="mt-3 border-t border-border pt-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Editor</p>
            <p className="mb-2 text-[11px] leading-relaxed text-muted">
              Panel sizes and the light/dark choice are remembered in this browser, not in the project. Resetting them leaves your timeline and media
              untouched.
            </p>
            <NButton isOutline onClick={onResetPreferences} className="h-7 px-2 text-[11px]">
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reset layout and theme
            </NButton>
          </div>
        </div>
      </NDialog>
    </header>
  );
};
