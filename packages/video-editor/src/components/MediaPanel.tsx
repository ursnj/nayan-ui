import { useCallback, useRef, useState } from 'react';
import { NButton, NLoading, NTooltip, showToast } from '@nayan-ui/react';
import { Film, Image as ImageIcon, Music, Plus, Trash2, Type } from 'lucide-react';
import { formatBytes, formatDuration } from '../lib/utils';
import { UnsupportedMediaError, generateThumbnail, loadAsset } from '../media/library';
import { useEditor } from '../store/editor';
import type { MediaAsset } from '../types';

const KIND_ICON = {
  video: Film,
  audio: Music,
  image: ImageIcon
} as const;

export const MediaPanel = () => {
  const assets = useEditor(state => state.assets);
  const addAsset = useEditor(state => state.addAsset);
  const updateAsset = useEditor(state => state.updateAsset);
  const removeAsset = useEditor(state => state.removeAsset);
  const addClipFromAsset = useEditor(state => state.addClipFromAsset);
  const addTextClip = useEditor(state => state.addTextClip);

  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(0);
  const [dragging, setDragging] = useState(false);

  const importFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = [...files];
      if (list.length === 0) return;
      setImporting(count => count + list.length);

      for (const file of list) {
        try {
          const asset = await loadAsset(file);
          addAsset(asset);
          // Poster frames are generated after import so a big drop stays responsive.
          if (!asset.thumbnail) {
            void generateThumbnail(asset.id).then(thumbnail => thumbnail && updateAsset(asset.id, { thumbnail }));
          }
        } catch (error) {
          const message = error instanceof UnsupportedMediaError ? error.message : `Could not import ${file.name}`;
          showToast(message, 'Import failed');
        } finally {
          setImporting(count => count - 1);
        }
      }
    },
    [addAsset, updateAsset]
  );

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Media</h2>
        <NTooltip message="Add a text overlay">
          <NButton isOutline onClick={() => addTextClip()} className="h-7 px-2 text-xs" aria-label="Add text clip">
            <Type className="mr-1 h-3.5 w-3.5" />
            Text
          </NButton>
        </NTooltip>
      </div>

      <div
        className={`m-3 rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
          dragging ? 'border-accent bg-accent/10' : 'border-border'
        }`}
        onDragOver={event => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={event => {
          event.preventDefault();
          setDragging(false);
          void importFiles(event.dataTransfer.files);
        }}>
        <p className="mb-2 text-xs text-muted">Drop video, audio or images here</p>
        <NButton isOutline onClick={() => inputRef.current?.click()} className="h-8 px-3 text-xs">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Import files
        </NButton>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="video/*,audio/*,image/*"
          className="hidden"
          onChange={event => {
            if (event.target.files) void importFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </div>

      {importing > 0 && (
        <div className="flex items-center gap-1 px-3 pb-2 text-xs text-muted">
          <NLoading size="sm" className="p-0" />
          Importing {importing} file{importing > 1 ? 's' : ''}…
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {assets.length === 0 && importing === 0 ? (
          <p className="px-1 py-6 text-center text-xs text-muted">Your imported media will show up here.</p>
        ) : (
          <ul className="space-y-1.5">
            {assets.map(asset => (
              <AssetRow key={asset.id} asset={asset} onAdd={() => addClipFromAsset(asset.id)} onRemove={() => removeAsset(asset.id)} />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};

interface AssetRowProps {
  asset: MediaAsset;
  onAdd: () => void;
  onRemove: () => void;
}

const AssetRow = ({ asset, onAdd, onRemove }: AssetRowProps) => {
  const Icon = KIND_ICON[asset.kind];

  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        draggable
        onDragStart={event => {
          // The timeline reads this to drop the clip at the pointer position.
          event.dataTransfer.setData('application/x-nayan-asset', asset.id);
          event.dataTransfer.effectAllowed = 'copy';
        }}
        onDoubleClick={onAdd}
        onKeyDown={event => {
          if (event.key === 'Enter') onAdd();
        }}
        className="group flex w-full cursor-grab items-center gap-2.5 rounded-md border border-border bg-surface-secondary p-1.5 text-left transition-colors hover:border-accent active:cursor-grabbing">
        <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded bg-surface-tertiary">
          {asset.thumbnail ? (
            <img src={asset.thumbnail} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Icon className="h-4 w-4 text-muted" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-foreground" title={asset.name}>
            {asset.name}
          </p>
          <p className="text-[11px] text-muted">
            {formatDuration(asset.durationUs)} · {formatBytes(asset.size)}
            {asset.kind === 'video' && asset.width > 0 ? ` · ${asset.width}×${asset.height}` : ''}
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <NTooltip message="Add to timeline">
            <button
              type="button"
              onClick={onAdd}
              aria-label={`Add ${asset.name} to timeline`}
              className="rounded p-1 text-muted hover:bg-default hover:text-foreground">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </NTooltip>
          <NTooltip message="Remove from project">
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${asset.name}`}
              className="rounded p-1 text-muted hover:bg-danger hover:text-danger-foreground">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </NTooltip>
        </div>
      </div>
    </li>
  );
};
