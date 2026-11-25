import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Avatar } from './Avatar';
import { Colors } from '../../constants/colors';
import { StoryItem } from '../../types/post';
import { styles } from '../styles';

interface StoryListProps {
  stories: StoryItem[];
  onSelectStory?: (story: StoryItem) => void;
}

export const StoryList: React.FC<StoryListProps> = ({ stories, onSelectStory }) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {stories.map((story) => {
          const displayName = story.userName ?? story.authorName ?? 'HoReSa';
          const uri = story.avatarUri ?? story.avatarUrl;
          return (
            <TouchableOpacity
              key={story.id}
              style={styles.storyItem}
              onPress={() => onSelectStory?.(story)}
            >
              <View
                style={[
                  styles.ring,
                  {
                    borderColor: story.seen ? Colors.textMuted : Colors.primary,
                  },
                ]}
              >
                <Avatar uri={uri} name={displayName} size={52} />
              </View>
              <Text style={styles.label} numberOfLines={1}>
                {displayName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};