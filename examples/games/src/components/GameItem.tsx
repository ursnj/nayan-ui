import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { CONFIG } from '../services/Config';

interface GameItemProps {
  game: {
    id: string;
    title: string;
    description: string;
  };
}

export const GameItem: React.FC<GameItemProps> = ({ game }) => {
  const router = useRouter();
  const { colors } = useTheme();

  const navigateToGame = (gameId: string) => {
    router.push(`/${gameId}`);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={() => navigateToGame(game.id)} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: `${CONFIG.APP_URL}/games-screenshots/${game.id}.jpg` }} style={styles.image} resizeMode="cover" />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {game.title}
        </Text>
        <Text style={[styles.description, { color: colors.text }]} numberOfLines={3}>
          {game.description}
        </Text>
        <View style={styles.button}>
          <View style={styles.buttonContent}>
            <Ionicons name="game-controller" size={18} color={colors.text} style={styles.icon} />
            <Text style={[styles.buttonText, { color: colors.text }]}>Play Now</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 8,
    margin: 5,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  },
  imageContainer: {
    width: '100%',
    paddingBottom: '164%'
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  content: {
    padding: 10
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 8
  },
  button: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon: {
    marginRight: 8
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600'
  }
});
