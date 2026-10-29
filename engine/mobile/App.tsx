import { SafeAreaProvider } from 'react-native-safe-area-context';
import CarRacing from './src/car-racing/CarRacing';

export default function App() {
  return (
    <SafeAreaProvider>
      <CarRacing />
    </SafeAreaProvider>
  );
}
