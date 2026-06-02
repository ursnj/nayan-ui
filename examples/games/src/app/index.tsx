import { Dimensions, FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GAMES_LIST } from '@nayan-ui/games';
import { NButton, NText, useNTheme } from '@nayan-ui/native';
import { useRouter } from 'expo-router';

type GameItem = (typeof GAMES_LIST)[0];

const APP_URL = 'https://www.nayanui.com';

const getColumnCount = () => {
  const width = Dimensions.get('window').width;
  if (width > 1536) return 7;
  if (width > 1280) return 6;
  if (width > 1024) return 5;
  if (width > 768) return 4;
  if (width > 640) return 3;
  return 2;
};

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useNTheme();
  const colCount = getColumnCount();

  const renderGameCard = ({ item: game }: { item: GameItem }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => router.push(`/${game.id}`)}
      activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: `${APP_URL}/games-screenshots/${game.id}.jpg` }} style={styles.image} resizeMode="cover" />
      </View>
      <View style={styles.content}>
        <NText className="text-base font-bold text-foreground" numberOfLines={1}>
          {game.title}
        </NText>
        <NText className="text-sm leading-5 text-muted mb-2" numberOfLines={3}>
          {game.description}
        </NText>
        <NButton size="sm" onPress={() => router.push(`/${game.id}`)}>
          <Ionicons name="game-controller" size={16} color={colors.accent} style={{ marginRight: 6 }} />
          Play Now
        </NButton>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList<GameItem>
        data={GAMES_LIST}
        numColumns={colCount}
        renderItem={renderGameCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 5, paddingBottom: 40 },
  card: {
    flex: 1,
    borderRadius: 8,
    margin: 5,
    overflow: 'hidden',
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  imageContainer: { width: '100%', paddingBottom: '164%' },
  image: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  content: { padding: 10 }
});
