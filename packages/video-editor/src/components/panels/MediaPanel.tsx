import { useCallback, useMemo, useRef, useState } from 'react';
import { NLoading, showToast } from '@nayan-ui/react';
import { Film, Image as ImageIcon, Music, Plus, Search, Trash2, Upload } from 'lucide-react';
import { cn, formatBytes, formatDuration } from '../../lib/utils';
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
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search media"
            aria-label="Search media"
            className="w-full rounded-md border border-border bg-field-background py-1.5 pl-7 pr-2 text-xs text-field-foreground outline-none transition-colors focus:border-accent placeholder:text-field-placeholder"
          />
        </div>
        <IconButton label="Import files" onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4" />
        </IconButton>
      </div>

      <div className="flex gap-1 px-3 pb-2">
        {(['all', 'video', 'audio', 'image'] as Filter[]).map(option => (
          <button
            key={option}
            type="button"
            onClick={() => setFilter(option)}
            aria-pressed={filter === option}
            className={cn(
              'rounded-full px-2.5 py-1 text-[11px] capitalize transition-colors',
              filter === option ? 'bg-accent/20 text-accent' : 'text-muted hover:bg-default hover:text-foreground'
            )}>
            {option}
          </button>
        ))}
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
            <button
              type="button"
              onClick={onAdd}
              aria-label={`Add ${asset.name} to timeline`}
              className="rounded-md bg-white/15 p-1.5 text-white backdrop-blur transition-colors hover:bg-accent">
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${asset.name}`}
              className="rounded-md bg-white/15 p-1.5 text-white backdrop-blur transition-colors hover:bg-danger">
              <Trash2 className="h-4 w-4" />
            </button>
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
