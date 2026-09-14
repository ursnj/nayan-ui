import { useCallback, useMemo, useRef, useState } from 'react';
import { NButton, NButtonGroup, NLoading, NSearchField, showToast } from '@nayan-ui/react';
import { Film, Image as ImageIcon, Music, Plus, Trash2, Upload } from 'lucide-react';
import { formatBytes, formatDuration } from '../../lib/utils';
import { UnsupportedMediaError, generateThumbnail, loadAsset } from '../../media/library';
import { useEditor } from '../../store/editor';
import type { MediaAsset } from '../../types';
import { EmptyState, IconButton } from '../controls';

const KIND_ICON = { video: Film, audio: Music, image: ImageIcon } as const;
type Filter = 'all' | 'video' | 'audio' | 'image';

export const MediaPanel = () => {
  const assets = useEditor(state => state.assets);
  const addAsset = useEditor(state => state.addAsset);
  const updateAsset = useEditor(state => state.updateAsset);
  const removeAsset = useEditor(state => state.removeAsset);
  const addClipFromAsset = useEditor(state => state.addClipFromAsset);

  const inputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

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

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return assets.filter(asset => {
      if (filter !== 'all' && asset.kind !== filter) return false;
      return !needle || asset.name.toLowerCase().includes(needle);
    });
  }, [assets, filter, query]);

  return (
    <div
      className="flex h-full flex-col"
      onDragOver={event => {
        if (!event.dataTransfer.types.includes('Files')) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={event => {
        if (event.currentTarget.contains(event.relatedTarget as Node)) return;
        setDragging(false);
      }}
      onDrop={event => {
        if (!event.dataTransfer.types.includes('Files')) return;
        event.preventDefault();
        setDragging(false);
        void importFiles(event.dataTransfer.files);
      }}>
      <div className="flex items-center gap-1.5 px-3 pb-2 pt-3">
        {/*
          `min-w-0` is what keeps the import button on screen.

          A flex item defaults to `min-width: auto`, which for a text input
          means its intrinsic width — around 200px. `flex-1` alone cannot
          shrink past that, so the field held its size and pushed the button
          out of the row to be clipped. The panel body is exactly 264px at the
          default library width, which is why resetting the layout was enough
          to trigger it. With this the field gives way and the button stays.
        */}
        <NSearchField
          value={query}
          onChange={setQuery}
          onClear={() => setQuery('')}
          placeholder="Search media"
          fullWidth
          className="min-w-0 flex-1"
          aria-label="Search media"
        />
        {/* IconButton is already `shrink-0`, so it keeps its full 28px. */}
        <IconButton label="Import files" onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4" />
        </IconButton>
      </div>

      <div className="px-3 pb-2">
        {/* NButtonGroup renders plain labels, which is exactly what these are. */}
        <NButtonGroup<Filter>
          items={['all', 'video', 'audio', 'image']}
          selected={filter}
          size="sm"
          onChange={setFilter}
          buttonClassName="capitalize text-[11px]"
          ariaLabel="Filter media by kind"
        />
      </div>

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

      {importing > 0 && (
        <div className="flex items-center gap-1 px-3 pb-2 text-[11px] text-muted">
          <NLoading size="sm" className="p-0" />
          Importing {importing} file{importing > 1 ? 's' : ''}…
        </div>
      )}

      <div className="relative min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {visible.length === 0 && importing === 0 ? (
          <EmptyState
            icon={<Film className="h-8 w-8" />}
            title={assets.length === 0 ? 'No media yet' : 'Nothing matches'}
            hint={assets.length === 0 ? 'Drop files here, or use the upload button above.' : 'Try a different search or filter.'}
          />
        ) : (
          <ul className="grid grid-cols-2 gap-2">
            {visible.map(asset => (
              <AssetCard key={asset.id} asset={asset} onAdd={() => addClipFromAsset(asset.id)} onRemove={() => removeAsset(asset.id)} />
            ))}
          </ul>
        )}

        {dragging && (
          <div className="pointer-events-none absolute inset-2 flex items-center justify-center rounded-lg border-2 border-dashed border-accent bg-accent/10">
            <p className="text-xs font-medium text-accent">Drop to import</p>
          </div>
        )}
      </div>
    </div>
  );
};

const AssetCard = ({ asset, onAdd, onRemove }: { asset: MediaAsset; onAdd: () => void; onRemove: () => void }) => {
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
        title={asset.name}
        data-clarity-mask="true"
        className="group relative cursor-grab overflow-hidden rounded-lg border border-border bg-surface-secondary transition-all hover:border-accent hover:elevate active:cursor-grabbing">
        <div className="checkerboard relative aspect-video w-full overflow-hidden bg-surface-tertiary">
          {asset.thumbnail ? (
            <img src={asset.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Icon className="h-5 w-5 text-muted" />
            </div>
          )}

          <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.5 font-mono text-[9px] text-white">
            {formatDuration(asset.durationUs)}
          </span>

          <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/55 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <NButton onClick={onAdd} aria-label={`Add ${asset.name} to timeline`} className="h-8 w-8 px-0">
              <Plus className="h-4 w-4" />
            </NButton>
            <NButton isOutline onClick={onRemove} aria-label={`Remove ${asset.name}`} className="h-8 w-8 border-white/40 px-0 text-white">
              <Trash2 className="h-4 w-4" />
            </NButton>
          </div>
        </div>

        <div className="px-1.5 py-1">
          <p className="truncate text-[11px] font-medium text-foreground">{asset.name}</p>
          <p className="truncate text-[10px] text-muted">
            {asset.kind === 'audio' ? 'Audio' : `${asset.width}×${asset.height}`} · {formatBytes(asset.size)}
          </p>
        </div>
      </div>
    </li>
  );
};
