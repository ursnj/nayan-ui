import { Platform, requireNativeComponent, type ViewStyle } from 'react-native';

interface EngineSurfaceProps {
  surfaceId: number;
  drawingId?: number;
  drawingMode?: number;
  drawingBackground?: number;
  onDrawingChange?: (event: { nativeEvent: { state: string; documentId: number } }) => void;
  style?: ViewStyle;
}
const NativeSurface = requireNativeComponent<EngineSurfaceProps>('NayanEngineSurface');
let componentSurface: typeof NativeSurface | undefined;
export function EngineSurface(props: EngineSurfaceProps) {
  const Host =
    props.drawingMode === 3 && Platform.OS === 'android'
      ? (componentSurface ??= requireNativeComponent<EngineSurfaceProps>('NayanEngineComponentSurface'))
      : NativeSurface;
  return <Host {...props} />;
}
