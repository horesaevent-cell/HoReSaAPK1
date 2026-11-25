import { StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSize, Radius, Spacing } from '../../constants/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  fullScreenOverlay: {
    ...StyleSheet.absoluteFill,
  },
  overlayBox: {
    backgroundColor: Colors.overlay,
    padding: Spacing.lg,
    borderRadius: Radius.md,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
  placeholderText: {
    marginTop: Spacing.xs,
    fontSize: FontSize.sm,
    color: Colors.white,
  },
  reelContainer: {
    flex: 1,
    backgroundColor: Colors.black,
    justifyContent: 'space-between',
  },
  videoSurface: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  topOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    zIndex: 2,
  },
  brandPill: {
    backgroundColor: Colors.overlay,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  brandText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  muteButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPlayBadge: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    zIndex: 2,
  },
  metaColumn: {
    flex: 1,
    marginRight: Spacing.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  authorTextGroup: {
    flex: 1,
  },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  authorName: {
    color: Colors.white,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  authorRole: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },
  caption: {
    color: Colors.white,
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  tagChip: {
    backgroundColor: Colors.overlay,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  tagText: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  actionsColumn: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  actionItem: {
    alignItems: 'center',
    gap: 2,
  },
  actionCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCount: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});