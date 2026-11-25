import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../constants/colors';
import { PostCategory } from '../../../types/post';

const CATEGORIES: PostCategory[] = [
  'Annonces',
  'Audio / X32',
  'Hôtels',
  'Restaurants',
  'Événements',
  'Offres',
];

export interface CreatePostBarProps {
  value: string;
  onChangeText: (text: string) => void;
  selectedCategory?: PostCategory;
  onSelectCategory?: (category: PostCategory) => void;
  onSubmit: () => void;
}

export const CreatePostBar: React.FC<CreatePostBarProps> = ({
  value,
  onChangeText,
  selectedCategory = 'Annonces',
  onSelectCategory,
  onSubmit,
}) => {
  return (
    <View style={styles.box}>
      <TextInput
        style={styles.input}
        placeholder="Partagez une actualité, un lieu ou une offre HoReSa..."
        placeholderTextColor="rgba(255,255,255,0.65)"
        value={value}
        onChangeText={onChangeText}
        multiline
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catRow}
      >
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={String(cat)}
              style={[styles.catChip, active && styles.catChipActive]}
              onPress={() => onSelectCategory?.(cat)}
            >
              <Text style={styles.catText}>{String(cat)}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.btn} onPress={onSubmit} activeOpacity={0.85}>
        <Text style={styles.btnText}>Publier</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    marginHorizontal: 14,
    backgroundColor: (Colors as any).surface ?? '#1C330C',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  input: {
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 42,
  },
  catRow: {
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  catChipActive: {
    backgroundColor: (Colors as any).primary ?? '#166534',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  catText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  btn: {
    alignSelf: 'flex-end',
    backgroundColor: (Colors as any).primary ?? '#166534',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default CreatePostBar;