import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StoryItem } from '../../../types/post';

interface StoryListProps {
  stories: StoryItem[];
  onSelectStory: (story: StoryItem) => void;
  onCreateStory: () => void;
  userDisplayName?: string;
}

const PulsingBadge: React.FC<{ visible: boolean }> = ({ visible }) => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) {
      pulse.setValue(1);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [visible, pulse]);

  if (!visible) return null;

  return (
    <Animated.View style={[localStyles.livePill, { transform: [{ scale: pulse }] }]}>
      <Text style={localStyles.livePillText}>NOUVEAU</Text>
    </Animated.View>
  );
};

export const StoryList: React.FC<StoryListProps> = ({
  stories,
  onSelectStory,
  onCreateStory,
  userDisplayName = 'Moi',
}) => {
  return (
    <View style={localStyles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={localStyles.row}
      >
        {/* Carte Créer une story compacte */}
        <TouchableOpacity
          style={localStyles.createCard}
          onPress={onCreateStory}
          activeOpacity={0.85}
        >
          <View style={localStyles.createTopAccent}>
            <View style={localStyles.plusCircle}>
              <Ionicons name="add" size={17} color="#FFFFFF" />
            </View>
          </View>
          <Text style={localStyles.createTitle} numberOfLines={1}>
            Story
          </Text>
          <Text style={localStyles.createSub} numberOfLines={1}>
            {userDisplayName}
          </Text>
        </TouchableOpacity>

        {/* Cartes stories dynamiques compactes */}
        {stories.map((story) => {
          const displayName = story.userName ?? story.authorName ?? 'HoReSa';
          const avatarUri = story.avatarUri ?? story.avatar;
          const isUnseen = !story.seen;

          return (
            <TouchableOpacity
              key={story.id}
              style={[
                localStyles.storyCard,
                isUnseen ? localStyles.storyCardActive : localStyles.storyCardSeen,
              ]}
              onPress={() => onSelectStory(story)}
              activeOpacity={0.85}
            >
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={localStyles.cardBgImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={localStyles.fallbackBg}>
                  <Text style={localStyles.fallbackInitials}>
                    {displayName.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}

              <View style={localStyles.darkOverlay} />

              <View style={localStyles.topRow}>
                <PulsingBadge visible={isUnseen} />
              </View>

              <View style={localStyles.bottomInfo}>
                <View style={localStyles.miniAvatarRing}>
                  {avatarUri ? (
                    <Image
                      source={{ uri: avatarUri }}
                      style={localStyles.miniAvatar}
                      resizeMode="cover"
                    />
                  ) : null}
                </View>
                <Text style={localStyles.storyName} numberOfLines={1}>
                  {displayName}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const localStyles = StyleSheet.create({
  wrapper: {
    marginVertical: 1,
  },
  row: {
    gap: 8,
    paddingVertical: 1,
  },
  createCard: {
    width: 86,
    height: 114,
    borderRadius: 14,
    backgroundColor: '#1C330C',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#4ADE80',
    padding: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createTopAccent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#166534',
    borderWidth: 1.5,
    borderColor: '#4ADE80',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  createSub: {
    color: '#D1DEC9',
    fontSize: 9,
    textAlign: 'center',
  },
  storyCard: {
    width: 92,
    height: 114,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1C330C',
    justifyContent: 'space-between',
    padding: 7,
  },
  storyCardActive: {
    borderWidth: 2,
    borderColor: '#4ADE80',
  },
  storyCardSeen: {
    borderWidth: 1,
    borderColor: '#2B4D13',
    opacity: 0.85,
  },
  cardBgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  fallbackBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#166534',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackInitials: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 22, 4, 0.44)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    zIndex: 2,
  },
  livePill: {
    backgroundColor: '#166534',
    borderWidth: 1,
    borderColor: '#4ADE80',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 7,
  },
  livePillText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  bottomInfo: {
    zIndex: 2,
    gap: 3,
  },
  miniAvatarRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#4ADE80',
    overflow: 'hidden',
    backgroundColor: '#142608',
  },
  miniAvatar: {
    width: '100%',
    height: '100%',
  },
  storyName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});

export default StoryList;