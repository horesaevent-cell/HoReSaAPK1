import { StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { FontSize, Radius, Spacing } from '../constants/theme';

export const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  storyItem: {
    width: 72,
    alignItems: 'center',
  },
  ring: {
    width: 58,
    height: 58,
    borderRadius: Radius.full,
    borderWidth: 2,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  ringActive: {
    borderColor: Colors.primary,
  },
  ringSeen: {
    borderColor: Colors.textMuted,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
});