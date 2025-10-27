import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
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
    <TouchableOpacity
      className="flex-1 rounded-lg m-1.5 overflow-hidden bg-card border border-border elevation-12"
      onPress={() => navigateToGame(game.id)}
      activeOpacity={0.8}>
      <Image source={{ uri: `${CONFIG.APP_URL}/games-screenshots/${game.id}.jpg` }} className="aspect-square" resizeMode="cover" />
      <View className="p-2.5">
        <Text className="text-lg font-bold text-text mb-0" numberOfLines={1}>
          {game.title}
        </Text>
        <Text className="text-base text-text leading-relaxed mb-2" numberOfLines={3}>
          {game.description}
        </Text>
        <View className="rounded-xl py-3 px-5 bg-border border border-border items-center justify-center shadow-button elevation-6">
          <View className="flex-row items-center justify-center">
            <Ionicons name="game-controller" size={18} color={colors.text} className="mr-2" />
            <Text className="text-text text-base font-semibold">Play Now</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};
