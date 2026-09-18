'use client';

import { MenuSize, NMenu, NMenuItem, NMenuNested } from '@nayan-ui/react';
import { Copy, Download, FileText, Pencil, Share2, Trash2 } from 'lucide-react';
import { H3_DOC } from '@/design/system';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const TRIGGER =
  'inline-flex items-center rounded-lg border border-default bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-default/50';

/**
 * The menu demo.
 *
 * It was one menu of three text-only items, the last of which carried
 * `separator` — so the example's closing flourish was a divider with nothing
 * under it. It also showed none of what the component can actually do: the
 * `icon` prop, the `NMenuNested` submenu and the section title were all
 * undemonstrated, which is how a menu ends up looking like a list of words.
 */
const Menu = () => {
  return (
    <ComponentWrapper>
      <h3 className={H3_DOC}>With shortcuts:</h3>
      <div className="mb-5">
        <NMenu size={MenuSize.MD} title="Actions" triggerClassName={TRIGGER} trigger="Open Menu">
          <NMenuItem id="edit" title="Edit" shortcut="⌘E" onAction={() => console.log('Edit')} />
          <NMenuItem id="copy" title="Copy" shortcut="⌘C" onAction={() => console.log('Copy')} />
          {/* The separator belongs before the destructive action, not after it. */}
          <NMenuItem id="duplicate" title="Duplicate" shortcut="⇧⌘D" separator onAction={() => console.log('Duplicate')} />
          <NMenuItem id="delete" title="Delete" shortcut="⌫" onAction={() => console.log('Delete')} />
        </NMenu>
      </div>

      <h3 className={H3_DOC}>With icons and a submenu:</h3>
      <div className="mb-5">
        <NMenu size={MenuSize.LG} title="Document" triggerClassName={TRIGGER} trigger="File">
          <NMenuItem id="rename" title="Rename" icon={Pencil} shortcut="F2" onAction={() => console.log('Rename')} />
          <NMenuItem id="duplicate-file" title="Duplicate" icon={Copy} shortcut="⌘D" onAction={() => console.log('Duplicate')} />
          <NMenuNested trigger="Export as" icon={<Download className="h-4 w-4 shrink-0" />}>
            <NMenuItem id="pdf" title="PDF" onAction={() => console.log('PDF')} />
            <NMenuItem id="markdown" title="Markdown" onAction={() => console.log('Markdown')} />
            <NMenuItem id="html" title="HTML" onAction={() => console.log('HTML')} />
          </NMenuNested>
          <NMenuItem id="share" title="Share" icon={Share2} shortcut="⌘⇧S" separator onAction={() => console.log('Share')} />
          <NMenuItem id="trash" title="Move to trash" icon={Trash2} onAction={() => console.log('Trash')} />
        </NMenu>
      </div>

      <h3 className={H3_DOC}>Disabled item:</h3>
      <NMenu size={MenuSize.MD} triggerClassName={TRIGGER} trigger="More">
        <NMenuItem id="report" title="Open report" icon={FileText} onAction={() => console.log('Report')} />
        <NMenuItem id="unavailable" title="Not available yet" disabled onAction={() => console.log('Never fires')} />
      </NMenu>
    </ComponentWrapper>
  );
};

export default Menu;
