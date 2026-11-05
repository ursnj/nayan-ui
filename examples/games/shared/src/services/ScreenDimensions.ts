import { Dimensions } from 'react-native';

export const getScreenDimensions = (): { width: number; height: number } => Dimensions.get('window');
