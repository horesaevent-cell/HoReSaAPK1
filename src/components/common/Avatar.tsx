import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { Radius } from '../../constants/theme';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({ uri, name = 'H', size = 40 }) => {
  const initial = name.trim().charAt(0).toUpperCase() || 'H';
  const dimensionStyle = { width: size, height: size, borderRadius: Radius.full };

  if (uri) {
    return <Image source={{ uri }} style={[styles.image, dimensionStyle]} />;
  }

  return (
    <View style={[styles.fallback, dimensionStyle]}>
      <Text style={[styles.initial, { fontSize: Math.max(12, Math.floor(size * 0.42)) }]}>
        {initial}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: Colors.surface,
  },
  fallback: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: Colors.white,
    fontWeight: '700',
  },
});