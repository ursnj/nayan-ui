import { NButton, NText, useNToast } from '@nayan-ui/native';
import Screen from '../src/components/Screen';

export default function ToastScreen() {
  const toast = useNToast();

  return (
    <Screen title="useNToast">
      <NText className="text-lg font-bold">Shorthand methods</NText>
      <NButton onPress={() => toast.success('Changes saved successfully!')}>Success</NButton>
      <NButton variant="danger" onPress={() => toast.error('Something went wrong.')}>
        Error
      </NButton>
      <NButton variant="outline" onPress={() => toast.info('New update available.')}>
        Info
      </NButton>
      <NButton variant="ghost" onPress={() => toast.warning('Low disk space.')}>
        Warning
      </NButton>

      <NText className="text-lg font-bold">With custom title</NText>
      <NButton variant="outline" onPress={() => toast.success('Your profile has been updated.', 'Profile')}>
        Success with title
      </NButton>
      <NButton variant="outline" onPress={() => toast.error('Please check your connection.', 'Network')}>
        Error with title
      </NButton>

      <NText className="text-lg font-bold">With action button</NText>
      <NButton
        variant="outline"
        onPress={() =>
          toast.show({
            type: 'success',
            title: 'Item deleted',
            message: 'The item has been moved to trash.',
            actionLabel: 'Undo',
            onActionPress: () => toast.info('Undo successful!')
          })
        }>
        With Action
      </NButton>
      <NButton
        variant="outline"
        onPress={() =>
          toast.show({
            type: 'warning',
            title: 'Session expiring',
            message: 'Your session will expire in 5 minutes.',
            actionLabel: 'Extend',
            onActionPress: () => toast.success('Session extended!')
          })
        }>
        Warning with Action
      </NButton>

      <NText className="text-lg font-bold">Generic show()</NText>
      <NButton variant="outline" onPress={() => toast.show({ type: 'info', title: 'Custom', message: 'Using toast.show() directly.' })}>
        toast.show()
      </NButton>
    </Screen>
  );
}
