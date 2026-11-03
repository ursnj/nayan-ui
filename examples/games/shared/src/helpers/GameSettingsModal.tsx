import React from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { BackdropCard as CardBackground } from '../games/shared/BackdropCard';
import { getGameTitle } from '../services/GamesConstants';
import { GAMES_METADATA } from '../services/GamesMetadata';
import type { GameTheme } from '../services/ThemeService';
import { isThemedGame } from '../services/ThemeService';
import { type GAME_IDS, type GameSettings, isTablet } from '../services/UtilsService';
import { createThemedStyles, useGameTheme } from './GameTheme';

interface GameSettingsProps {
  gameId: string;
  settings: GameSettings;
  onSettingsChange?: (settings: GameSettings) => void;
}

interface CustomSwitchProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

const CustomSwitch: React.FC<CustomSwitchProps> = React.memo(({ label, value, onValueChange }) => {
  const theme = useGameTheme();
  const styles = getStyles(theme);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      aria-checked={value}
      onPress={() => onValueChange(!value)}>
      <View style={[styles.switchTrack, { backgroundColor: value ? theme.SWITCH_TRACK_ON : theme.SWITCH_TRACK_OFF }]}>
        <View style={[styles.switchThumb, { left: value ? 25 : 3 }]} />
      </View>
    </Pressable>
  );
});

// Module-level so an omitted handler doesn't mint a new default function every render
const noopSettingsChange = (_settings: GameSettings) => undefined;

const GameSettingsModalComponent: React.FC<GameSettingsProps> = ({ gameId, settings, onSettingsChange = noopSettingsChange }) => {
  const theme = useGameTheme();
  const styles = getStyles(theme);
  const title = `${getGameTitle(gameId)} Settings`;
  const game = GAMES_METADATA[gameId as keyof typeof GAMES_METADATA];

  const { isVisible, enableSounds, enableHaptics } = settings;
  const viewport = useWindowDimensions();
  const popover = Platform.OS === 'web';
  const width = Math.max(0, Math.min(360, viewport.width - 32));
  const top = Math.max(16, Math.min(settings.anchor?.top ?? 80, viewport.height - 160));
  const maxRight = Math.max(16, viewport.width - width - 16);
  const right = Math.min(maxRight, Math.max(16, settings.anchor?.right ?? 16));
  // Only games that follow the light / dark theme get the toggle (the rest keep their own classic look)
  const themed = isThemedGame(gameId as GAME_IDS);
  const darkMode = settings.theme === 'dark';

  const handleSoundToggle = (enabled: boolean) => {
    onSettingsChange({
      ...settings,
      enableSounds: enabled
    });
  };

  const handleHapticToggle = (enabled: boolean) => {
    onSettingsChange({
      ...settings,
      enableHaptics: enabled
    });
  };

  const handleThemeToggle = (dark: boolean) => {
    onSettingsChange({
      ...settings,
      theme: dark ? 'dark' : 'light'
    });
  };

  const handleOnClose = () => {
    onSettingsChange({
      ...settings,
      isVisible: false
    });
  };

  return (
    <Modal visible={isVisible} transparent={true} onRequestClose={handleOnClose}>
      <View style={[styles.overlay, popover && { backgroundColor: 'transparent' }]}>
        {popover && (
          <Pressable accessibilityRole="button" accessibilityLabel="Dismiss game settings" style={StyleSheet.absoluteFill} onPress={handleOnClose} />
        )}
        <View
          testID={popover ? 'game-settings-popover' : undefined}
          role={popover ? 'dialog' : undefined}
          accessibilityLabel={popover ? title : undefined}
          style={[
            styles.container,
            popover && {
              position: 'absolute',
              top,
              right,
              width,
              maxHeight: Math.max(0, viewport.height - top - 16),
              backgroundColor: theme.SURFACE,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.SURFACE,
              padding: 20,
              boxShadow: '0 12px 40px #0004'
            }
          ]}>
          {!popover && <CardBackground />}
          <View style={[styles.header, popover && styles.popoverHeader]}>
            <Text accessibilityRole="header" style={[styles.headerTitle, popover && styles.popoverHeaderTitle]}>
              {popover ? 'Settings' : title}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close settings"
              onPress={handleOnClose}
              style={[styles.closeButton, popover && styles.popoverCloseButton]}>
              <Text style={[styles.closeButtonText, popover && styles.popoverCloseButtonText]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={[styles.scrollView, popover && styles.popoverScrollView]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Preferences */}
            <View style={[styles.section, popover && styles.popoverSection]}>
              <View style={styles.toggleContainer}>
                <View style={styles.toggleLeft}>
                  <View>
                    <Text style={[styles.toggleTitle, popover && styles.popoverText]}>Sound Effects</Text>
                    <Text style={[styles.toggleSubtitle, popover && styles.popoverText]}>Play sounds during gameplay</Text>
                  </View>
                </View>
                <CustomSwitch label="Sound Effects" value={enableSounds} onValueChange={handleSoundToggle} />
              </View>
              <View style={[styles.divider, popover && styles.popoverDivider]} />
              <View style={styles.toggleContainer}>
                <View style={styles.toggleLeft}>
                  <View>
                    <Text style={[styles.toggleTitle, popover && styles.popoverText]}>Haptic Feedback</Text>
                    <Text style={[styles.toggleSubtitle, popover && styles.popoverText]}>Vibration on interactions</Text>
                  </View>
                </View>
                <CustomSwitch label="Haptic Feedback" value={enableHaptics} onValueChange={handleHapticToggle} />
              </View>
              {themed && (
                <>
                  <View style={[styles.divider, popover && styles.popoverDivider]} />
                  <View style={styles.toggleContainer}>
                    <View style={styles.toggleLeft}>
                      <View>
                        <Text style={[styles.toggleTitle, popover && styles.popoverText]}>Dark Mode</Text>
                        <Text style={[styles.toggleSubtitle, popover && styles.popoverText]}>Play with the dark theme</Text>
                      </View>
                    </View>
                    <CustomSwitch label="Dark Mode" value={darkMode} onValueChange={handleThemeToggle} />
                  </View>
                </>
              )}
            </View>

            {/* How to Play */}
            {!popover && game && (
              <View style={[styles.section]}>
                <View style={styles.sectionLabelRow}>
                  <Text style={styles.sectionLabel}>How to Play</Text>
                </View>
                <Text style={styles.gameDescription}>{game.description}</Text>
                {game.instructions.map((instruction, index) => (
                  <View key={index} style={styles.instructionRow}>
                    <View style={styles.instructionBadge}>
                      <Text style={styles.instructionNumber}>{index + 1}</Text>
                    </View>
                    <Text style={styles.instructionText}>{instruction}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Games already memoize these props, which only pays off if the modal itself is memoized
export const GameSettingsModal = React.memo(GameSettingsModalComponent);
GameSettingsModal.displayName = 'GameSettingsModal';

const getStyles = createThemedStyles((theme: GameTheme) => ({
  overlay: {
    flex: 1,
    backgroundColor: theme.OVERLAY,
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    width: '95%',
    maxWidth: isTablet ? 500 : 360,
    maxHeight: '70%',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: theme.BACKGROUND
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    paddingHorizontal: 16,
    backgroundColor: theme.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: theme.DIVIDER
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'semibold',
    color: theme.TEXT
  },
  closeButton: {
    padding: 8
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'semibold',
    color: theme.TEXT
  },
  popoverHeader: {
    padding: 0,
    paddingHorizontal: 0,
    marginBottom: 16,
    backgroundColor: 'transparent',
    borderBottomWidth: 0
  },
  popoverText: {
    fontFamily: 'inherit',
    color: theme.TEXT
  },
  popoverHeaderTitle: {
    fontFamily: 'inherit',
    fontSize: 16,
    fontWeight: '700'
  },
  popoverCloseButton: {
    width: 40,
    height: 40,
    padding: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.SURFACE,
    backgroundColor: theme.SURFACE
  },
  popoverCloseButtonText: {
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 18
  },
  popoverScrollView: {
    padding: 0,
    paddingBottom: 0
  },
  popoverSection: {
    padding: 0,
    marginBottom: 0,
    borderWidth: 0,
    backgroundColor: 'transparent'
  },
  popoverDivider: {
    backgroundColor: theme.SURFACE
  },
  scrollView: {
    flexShrink: 1,
    padding: 10,
    paddingBottom: 0
  },
  scrollContent: {
    paddingBottom: 0
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    backgroundColor: theme.SURFACE,
    borderWidth: theme.BORDER_WIDTH,
    borderColor: theme.BORDER
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
    marginRight: 12
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: theme.TEXT
  },
  toggleSubtitle: {
    fontSize: 13,
    marginTop: 2,
    color: theme.TEXT_MUTED
  },
  divider: {
    height: 1,
    backgroundColor: theme.DIVIDER,
    marginVertical: 12
  },
  sectionLabelRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 8
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: theme.TEXT
  },
  gameDescription: {
    fontSize: 13,
    color: theme.TEXT,
    lineHeight: 19,
    marginBottom: 12
  },
  instructionRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 8
  },
  instructionBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.CHIP,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 10,
    marginTop: 1
  },
  instructionNumber: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: theme.TEXT
  },
  instructionText: {
    fontSize: 14,
    color: theme.TEXT,
    flex: 1,
    lineHeight: 20
  },
  switchTrack: {
    width: 52,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center'
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    position: 'absolute',
    backgroundColor: theme.SWITCH_THUMB,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4
  }
}));
