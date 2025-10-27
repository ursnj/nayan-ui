import { FlatList, View } from 'react-native';
import { GAMES_LIST } from 'react-native-games';
import { GameItem } from '../components/GameItem';

type GameItem = (typeof GAMES_LIST)[0];

export default function HomeScreen() {
  const renderGameCard = ({ item: game }) => <GameItem game={game} key={game.id} />;

  return (
    <View className="flex-1 bg-background">
      <FlatList<GameItem>
        data={GAMES_LIST}
        renderItem={renderGameCard}
        keyExtractor={item => item.id}
        contentContainerClassName="p-1.5 pb-10"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
