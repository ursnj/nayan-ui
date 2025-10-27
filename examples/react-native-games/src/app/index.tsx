import { FlatList, StyleSheet, View } from 'react-native';
import { GAMES_LIST } from 'react-native-games';
import { GameItem } from '../components/GameItem';

type GameItem = (typeof GAMES_LIST)[0];

export default function HomeScreen() {
  const renderGameCard = ({ item: game }) => <GameItem game={game} key={game.id} />;

  return (
    <View style={styles.container}>
      <FlatList<GameItem>
        data={GAMES_LIST}
        renderItem={renderGameCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  contentContainer: {
    padding: 6,
    paddingBottom: 40
  }
});
