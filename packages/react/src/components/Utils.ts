export enum ThresholdUnits {
  Pixel = 'Pixel',
  Percent = 'Percent'
}

const defaultThreshold = {
  unit: ThresholdUnits.Percent,
  value: 0.8
};

export const isWindowDefined = () => {
  return typeof window !== 'undefined';
};

export function parseThreshold(scrollThreshold: string | number): any {
  if (typeof scrollThreshold === 'number') {
    return {
      unit: ThresholdUnits.Percent,
      value: scrollThreshold * 100
    };
  }

  if (typeof scrollThreshold === 'string') {
    if (scrollThreshold.match(/^(\d*(\.\d+)?)px$/)) {
      return {
        unit: ThresholdUnits.Pixel,
        value: parseFloat(scrollThreshold)
      };
    }

    if (scrollThreshold.match(/^(\d*(\.\d+)?)%$/)) {
      return {
        unit: ThresholdUnits.Percent,
        value: parseFloat(scrollThreshold)
      };
    }

    console.warn('scrollThreshold format is invalid. Valid formats: "120px", "50%"...');

    return defaultThreshold;
  }

  console.warn('scrollThreshold should be string or number');

  return defaultThreshold;
}

export const throttle = (
  delay: number,
  callback: (...args: any[]) => any,
  options: { noTrailing?: boolean; noLeading?: boolean; debounceMode?: boolean } = {}
) => {
  const { noTrailing = false, noLeading = false, debounceMode = undefined } = options || {};
  /*
   * After wrapper has stopped being called, this timeout ensures that
   * `callback` is executed at the proper times in `throttle` and `end`
   * debounce modes.
   */
  let timeoutID: any;
  let cancelled = false;

  // Keep track of the last time `callback` was executed.
  let lastExec = 0;

  // Function to clear existing timeout
  function clearExistingTimeout() {
    if (timeoutID) {
      clearTimeout(timeoutID);
    }
  }

  // Function to cancel next exec
  function cancel(options: any) {
    const { upcomingOnly = false } = options || {};
    clearExistingTimeout();
    cancelled = !upcomingOnly;
  }

  /*
   * The `wrapper` function encapsulates all of the throttling / debouncing
   * functionality and when executed will limit the rate at which `callback`
   * is executed.
   */
  function wrapper(...arguments_: any) {
    // @ts-ignore
    let self = this;
    let elapsed = Date.now() - lastExec;

    if (cancelled) {
      return;
    }

    // Execute `callback` and update the `lastExec` timestamp.
    function exec() {
      lastExec = Date.now();
      callback.apply(self, arguments_);
    }

    /*
     * If `debounceMode` is true (at begin) this is used to clear the flag
     * to allow future `callback` executions.
     */
    function clear() {
      timeoutID = undefined;
    }

    if (!noLeading && debounceMode && !timeoutID) {
      /*
       * Since `wrapper` is being called for the first time and
       * `debounceMode` is true (at begin), execute `callback`
       * and noLeading != true.
       */
      exec();
    }

    clearExistingTimeout();

    if (debounceMode === undefined && elapsed > delay) {
      if (noLeading) {
        /*
         * In throttle mode with noLeading, if `delay` time has
         * been exceeded, update `lastExec` and schedule `callback`
         * to execute after `delay` ms.
         */
        lastExec = Date.now();
        if (!noTrailing) {
          timeoutID = setTimeout(debounceMode ? clear : exec, delay);
        }
      } else {
        /*
         * In throttle mode without noLeading, if `delay` time has been exceeded, execute
         * `callback`.
         */
        exec();
      }
    } else if (noTrailing !== true) {
      /*
       * In trailing throttle mode, since `delay` time has not been
       * exceeded, schedule `callback` to execute `delay` ms after most
       * recent execution.
       *
       * If `debounceMode` is true (at begin), schedule `clear` to execute
       * after `delay` ms.
       *
       * If `debounceMode` is false (at end), schedule `callback` to
       * execute after `delay` ms.
       */
      timeoutID = setTimeout(debounceMode ? clear : exec, debounceMode === undefined ? delay - elapsed : delay);
    }
  }

  wrapper.cancel = cancel;

  // Return the wrapper function.
  return wrapper;
};

export const debounce = (delay: number, callback: () => any, options: { atBegin?: boolean } = {}) => {
  const { atBegin = false } = options || {};
  return throttle(delay, callback, { debounceMode: atBegin !== false });
};

export const reactSelectTheme = (theme: any) => ({
  ...theme,
  borderRadius: 4,
  colors: {
    ...theme.colors,
    neutral0: 'var(--COLOR_BACKGROUND)',
    neutral10: 'var(--COLOR_BORDER)',
    neutral5: 'var(--COLOR_BACKGROUND)',
    neutral20: 'var(--COLOR_BORDER)',
    neutral80: 'var(--COLOR_TEXT)',
    primary25: 'gray',
    primary: 'var(--COLOR_PRIMARY)'
  }
});

export const reactSelectCustomClassNames = {
  control: (state: any) => 'flex h-10 w-full rounded bg-card border border-border focus:border-border text-text',
  menu: (state: any) => 'w-full rounded bg-card border border-border focus:border-border'
} as any;
