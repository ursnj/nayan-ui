import { NIcon } from './NIcon';
import { NPress } from './NPress';
import { NText } from './NText';
import { NView } from './NView';
import { NToast, performToastAction, type ToastState } from './toastService';

export function NToastContent({ toast }: { toast: NonNullable<ToastState['toast']> }) {
  const status = {
    success: { icon: 'circle-check', color: 'text-success', background: 'bg-success/15' },
    error: { icon: 'circle-x', color: 'text-danger', background: 'bg-danger/15' },
    warning: { icon: 'triangle-alert', color: 'text-warning', background: 'bg-warning/15' },
    info: { icon: 'info', color: 'text-accent', background: 'bg-accent/15' }
  }[toast.type ?? 'info'];
  return (
    <NView className="w-full p-2">
      <NView
        className="bg-background border-border min-h-16 w-full flex-row items-start gap-3 rounded-2xl border p-3"
        style={{ boxShadow: '0px 6px 16px -6px rgba(0,0,0,0.28)' }}>
        <NView className={`h-9 w-9 items-center justify-center rounded-full p-2 ${status.background}`}>
          <NIcon name={status.icon} size={20} className={status.color} />
        </NView>
        <NView className="min-w-0 flex-1 gap-0.5 py-1">
          {toast.title && (
            <NText className="text-foreground text-sm leading-5 font-semibold" numberOfLines={2}>
              {toast.title}
            </NText>
          )}
          <NText className={`text-foreground text-sm leading-5 ${toast.title ? '' : 'font-medium'}`} numberOfLines={3}>
            {toast.message}
          </NText>
          {toast.actionLabel && (
            <NPress accessibilityLabel={toast.actionLabel} onPress={() => performToastAction(toast.id)} className="min-h-9 justify-center pt-1">
              <NText className="text-accent text-sm leading-5 font-semibold">{toast.actionLabel}</NText>
            </NPress>
          )}
        </NView>
        {toast.dismissible !== false && (
          <NPress
            accessibilityLabel="Dismiss notification"
            hitSlop={6}
            className="bg-foreground/5 h-9 w-9 items-center justify-center rounded-full p-2.5"
            onPress={() => NToast.dismiss(toast.id)}>
            <NIcon name="x" size={16} className="text-muted" />
          </NPress>
        )}
      </NView>
    </NView>
  );
}
