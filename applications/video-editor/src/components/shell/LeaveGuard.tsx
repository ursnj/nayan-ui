import { useEffect, useRef, useState } from 'react';
import { NConfirmAlert } from '@nayan-ui/react';
import { readEditorState, useEditor } from '../../store/editor';

const GUARD_ENTRY = { nayanEditorLeaveGuard: true };

const isGuardEntry = (state: unknown) => (state as { nayanEditorLeaveGuard?: boolean } | null)?.nayanEditorLeaveGuard === true;

/** What the user asked for, and so what confirming actually has to do. */
type Pending = 'back' | 'reload' | null;

export const LeaveGuard = () => {
  const hasWork = useEditor(state => state.clips.length > 0);
  const [pending, setPending] = useState<Pending>(null);
  // Set once the user has chosen to leave, so beforeunload does not prompt again and popstate does not re-arm.
  const leaving = useRef(false);

  /* The reload button, a closing tab, or any address the user types. */
  useEffect(() => {
    if (!hasWork) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (leaving.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasWork]);

  useEffect(() => {
    if (!hasWork) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const isReload = event.key === 'F5' || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'r');
      if (!isReload) return;
      event.preventDefault();
      // Two presses of ⌘R shouldn't stack; the dialog is already asking.
      setPending(current => current ?? 'reload');
    };
    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true });
  }, [hasWork]);

  useEffect(() => {
    if (!hasWork || window.history.length <= 1) return;
    if (isGuardEntry(window.history.state)) return;
    window.history.pushState(GUARD_ENTRY, '');
  }, [hasWork]);

  useEffect(() => {
    const onPopState = () => {
      if (leaving.current) return;

      // Whatever happens next, the entry we were parked on is spent.
      if (readEditorState().clips.length === 0) {
        leaving.current = true;
        window.history.back();
        return;
      }

      window.history.pushState(GUARD_ENTRY, '');
      setPending('back');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const reloading = pending === 'reload';

  return (
    <NConfirmAlert
      isOpen={pending !== null}
      title={reloading ? 'Reload the editor?' : 'Leave the editor?'}
      message={
        'Your timeline is not saved anywhere — it lives in this tab only. ' +
        `${reloading ? 'Reloading' : 'Leaving'} discards the edit and the imported media with it, so save the project first if you want it back. ` +
        'Exported videos are already on your computer and are not affected.'
      }
      confirmText={reloading ? 'Discard and reload' : 'Discard and leave'}
      cancelText="Keep editing"
      onResult={confirmed => {
        if (!confirmed) return;
        leaving.current = true;
        if (reloading) {
          window.location.reload();
          return;
        }
        window.history.go(-2);
      }}
      onClose={() => setPending(null)}
    />
  );
};
