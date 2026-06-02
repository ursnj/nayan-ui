import { Dimensions, FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GAMES_LIST } from '@nayan-ui/games';
import { NButton, NText } from '@nayan-ui/native';
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
    <TouchableOpacity className="flex-1 rounded-lg m-1 overflow-hidden bg-surface border border-border" onPress={() => router.push(`/${game.id}`)} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: `${APP_URL}/games-screenshots/${game.id}.jpg` }} style={styles.image} resizeMode="cover" />
      </View>
      <View className="p-2.5">
        <NText className="text-base font-bold text-foreground" numberOfLines={1}>
          {game.title}
        </NText>
        <NText className="text-sm leading-5 text-muted mb-2" numberOfLines={3}>
          {game.description}
        </NText>
        <NButton size="sm" onPress={() => router.push(`/${game.id}`)}>
          Play Now
        </NButton>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-background">
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
  list: { padding: 5, paddingBottom: 40 },
  imageContainer: { width: '100%', paddingBottom: '164%' },
  image: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }
});
