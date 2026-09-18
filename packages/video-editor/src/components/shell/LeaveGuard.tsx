import { useEffect, useRef, useState } from 'react';
import { NConfirmAlert } from '@nayan-ui/react';
import { readEditorState, useEditor } from '../../store/editor';

/**
 * Marks the history entry this guard pushes, so a `popstate` can tell our own
 * entry from one the page arrived with.
 */
const GUARD_ENTRY = { nayanEditorLeaveGuard: true };

const isGuardEntry = (state: unknown) => (state as { nayanEditorLeaveGuard?: boolean } | null)?.nayanEditorLeaveGuard === true;

/** What the user asked for, and so what confirming actually has to do. */
type Pending = 'back' | 'reload' | null;

/**
 * Stops the browser throwing an unsaved edit away without asking, and asks in
 * the editor's own dialog wherever the browser allows it.
 *
 * Three routes out, on three different terms:
 *
 *   Back is interceptable properly, because it can be turned into a
 *   *same-document* navigation. This pushes a duplicate history entry as soon
 *   as there is work to lose, so the first Back lands on the editor's own entry
 *   instead of leaving the page, and `popstate` fires with the document still
 *   alive — in-app dialog, and the page never went anywhere.
 *
 *   A keyboard reload — ⌘R, Ctrl R, F5 — arrives as an ordinary key event
 *   first, and those three are not among the shortcuts the browser reserves
 *   for itself, so `preventDefault` holds. Same dialog; confirming reloads by
 *   hand. It is worth hijacking a browser shortcut for: this editor holds the
 *   entire project in memory, and a reflex ⌘R is the likeliest way to lose one.
 *
 *   Everything else — the toolbar's reload button, closing the tab, typing
 *   another address — is only visible as `beforeunload`, where a page may
 *   cancel the navigation but may *not* say anything of its own. The text and
 *   the buttons there are the browser's, and have been since browsers stopped
 *   honouring a custom string. No dialog of ours can be put in front of those,
 *   so they keep the native prompt as a backstop.
 *
 * Gated on clips, like New project: the imported media is not what leaving
 * costs you, and a dialog in front of an empty timeline is just a click to
 * dismiss.
 */
export const LeaveGuard = () => {
  const hasWork = useEditor(state => state.clips.length > 0);
  const [pending, setPending] = useState<Pending>(null);
  /**
   * Set once the user has said they want to go. It stops `beforeunload` from
   * adding the browser's prompt on top of the answer they just gave, and stops
   * the `popstate` below from re-arming against the navigation it asked for.
   */
  const leaving = useRef(false);

  /* The reload button, a closing tab, or any address the user types. */
  useEffect(() => {
    if (!hasWork) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (leaving.current) return;
      // `preventDefault` is the specified way; the legacy assignment is what
      // Safari still reads. Any string is ignored — the browser uses its own.
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasWork]);

  /*
   * Keyboard reloads, caught before the browser acts on them.
   *
   * Capture phase, and on `window`, so this sees the key before the editor's
   * own shortcut table does — not that the two collide today, but a reload is
   * not something to leave depending on that staying true.
   */
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

  /*
   * Arm the Back button by pushing a second entry for the page we are already
   * on — same URL, so nothing moves in the address bar.
   *
   * Only when there is somewhere behind us to go. Opened directly in a fresh
   * tab the editor is the only entry in the session, so Back is already dead,
   * and pushing here would resurrect it as a button that asks a question and
   * then cannot act on the answer.
   */
  useEffect(() => {
    if (!hasWork || window.history.length <= 1) return;
    if (isGuardEntry(window.history.state)) return;
    window.history.pushState(GUARD_ENTRY, '');
  }, [hasWork]);

  /*
   * Installed for the life of the page rather than alongside the arming above:
   * the pushed entry outlives the condition that pushed it, so if the timeline
   * is emptied again this still has to be here to let that spent entry go.
   */
  useEffect(() => {
    const onPopState = () => {
      if (leaving.current) return;

      // Whatever happens next, the entry we were parked on is spent.
      if (readEditorState().clips.length === 0) {
        // Nothing left to lose, so honour the Back the user actually pressed
        // rather than silently eating it on a page with nothing to protect.
        leaving.current = true;
        window.history.back();
        return;
      }

      // Re-arm before asking, so a second Back while the dialog is open is
      // caught too instead of leaving behind the user's back.
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
        // Either way the navigation is now the user's own decision, so the
        // browser's prompt must not appear on top of the answer they gave.
        leaving.current = true;
        if (reloading) {
          window.location.reload();
          return;
        }
        /*
         * Two entries: the one re-armed in `popstate`, then the editor's own,
         * landing on whatever the user was looking at before they came here.
         * Going back only one would arrive on the editor's own entry — the
         * same page, with the guard now disarmed.
         */
        window.history.go(-2);
      }}
      onClose={() => setPending(null)}
    />
  );
};
