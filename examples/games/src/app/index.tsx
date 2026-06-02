import { Dimensions, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GAMES_LIST } from 'react-native-games';
import { Ionicons } from '@expo/vector-icons';
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
  const colCount = getColumnCount();

  const renderGameCard = ({ item: game }: { item: GameItem }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/${game.id}`)} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: `${APP_URL}/games-screenshots/${game.id}.jpg` }} style={styles.image} resizeMode="cover" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {game.title}
        </Text>
        <Text style={styles.description} numberOfLines={3}>
          {game.description}
        </Text>
        <View style={styles.button}>
          <Ionicons name="game-controller" size={18} color="#333" style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>Play Now</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  list: { padding: 5, paddingBottom: 40 },
  card: {
    flex: 1,
    borderRadius: 8,
    margin: 5,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  imageContainer: { width: '100%', paddingBottom: '164%' },
  image: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  content: { padding: 10 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  description: { fontSize: 14, lineHeight: 20, color: '#666', marginBottom: 8 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#e8e8e8'
  },
  buttonText: { fontSize: 15, fontWeight: '600', color: '#333' }
});
