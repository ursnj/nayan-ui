export enum ThresholdUnits {
  Pixel = "Pixel",
  Percent = "Percent",
}

const defaultThreshold = {
  unit: ThresholdUnits.Percent,
  value: 0.8,
};

export const isWindowDefined = () => {
  return typeof window !== "undefined";
};

export function parseThreshold(scrollThreshold: string | number): any {
  if (typeof scrollThreshold === "number") {
    return {
      unit: ThresholdUnits.Percent,
      value: scrollThreshold * 100,
    };
  }

  if (typeof scrollThreshold === "string") {
    if (scrollThreshold.match(/^(\d*(\.\d+)?)px$/)) {
      return {
        unit: ThresholdUnits.Pixel,
        value: parseFloat(scrollThreshold),
      };
    }

    if (scrollThreshold.match(/^(\d*(\.\d+)?)%$/)) {
      return {
        unit: ThresholdUnits.Percent,
        value: parseFloat(scrollThreshold),
      };
    }

    console.warn('scrollThreshold format is invalid. Valid formats: "120px", "50%"...');

    return defaultThreshold;
  }

  console.warn("scrollThreshold should be string or number");

  return defaultThreshold;
}

export const throttle = (
  delay: number,
  callback: (...args: any[]) => any,
  options: { noTrailing?: boolean; noLeading?: boolean; debounceMode?: boolean } = {},
) => {
  const { noTrailing = false, noLeading = false, debounceMode = undefined } = options || {};
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
  function cancel(options: { upcomingOnly?: boolean } = {}) {
    const { upcomingOnly = false } = options || {};
    clearExistingTimeout();
    cancelled = !upcomingOnly;
  }

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

    function clear() {
      timeoutID = undefined;
    }

    if (!noLeading && debounceMode && !timeoutID) {
      exec();
    }

    clearExistingTimeout();

    if (debounceMode === undefined && elapsed > delay) {
      if (noLeading) {
        lastExec = Date.now();
        if (!noTrailing) {
          timeoutID = setTimeout(debounceMode ? clear : exec, delay);
        }
      } else {
        exec();
      }
    } else if (noTrailing !== true) {
      // Trailing mode: the pending call is rescheduled for the remainder of the window, not dropped.
      timeoutID = setTimeout(
        debounceMode ? clear : exec,
        debounceMode === undefined ? delay - elapsed : delay,
      );
    }
  }

  wrapper.cancel = cancel;

  // Return the wrapper function.
  return wrapper;
};

export const debounce = (
  delay: number,
  callback: () => any,
  options: { atBegin?: boolean } = {},
) => {
  const { atBegin = false } = options || {};
  return throttle(delay, callback, { debounceMode: atBegin !== false });
};

export const reactSelectTheme = (theme: any) => ({
  ...theme,
  borderRadius: 8,
  colors: {
    ...theme.colors,
    neutral0: "var(--surface)",
    neutral5: "var(--surface)",
    neutral10: "var(--default)",
    neutral20: "var(--default)",
    neutral30: "var(--default)",
    neutral40: "var(--muted)",
    neutral50: "var(--muted)",
    neutral60: "var(--foreground)",
    neutral80: "var(--foreground)",
    primary: "var(--accent)",
    primary25: "var(--default)",
    primary50: "var(--default)",
    primary75: "var(--accent)",
    danger: "var(--danger)",
    dangerLight: "var(--danger)",
  },
});

export const reactSelectCustomClassNames = {
  control: (_state: any) =>
    "flex h-10 w-full rounded-lg border border-default bg-surface text-foreground focus:border-accent",
  menu: (_state: any) => "w-full rounded-lg border border-default bg-surface shadow-lg",
  option: (state: any) =>
    state.isSelected ? "bg-accent text-accent-foreground" : state.isFocused ? "bg-default/50" : "",
  singleValue: (_state: any) => "text-foreground",
  multiValue: (_state: any) => "rounded-lg bg-default",
  multiValueLabel: (_state: any) => "text-foreground",
  placeholder: (_state: any) => "text-muted",
  input: (_state: any) => "text-foreground",
} as any;
