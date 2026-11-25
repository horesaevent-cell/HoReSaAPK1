import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useJournalStore } from '../../store/journalStore';
import {
  JournalCategory,
  JournalEntry,
  JournalMood,
} from '../../types/journal';

const CATEGORIES: JournalCategory[] = [
  'Pensées & Idées',
  'Rêves & Ambitions',
  'Objectifs',
  'Expériences quotidiennes',
];

const MOODS: JournalMood[] = ['Inspiré', 'Serein', 'Déterminé', 'Réflexif'];

export const JournalScreen: React.FC = () => {
  const { entries, addEntry, updateProgress, deleteEntry } = useJournalStore();

  const [selectedFilter, setSelectedFilter] = useState<'Tout' | JournalCategory>(
    'Tout'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [goalTarget, setGoalTarget] = useState<string>('');
  const [category, setCategory] = useState<JournalCategory>('Pensées & Idées');
  const [mood, setMood] = useState<JournalMood>('Inspiré');
  const [progressPercent, setProgressPercent] = useState<number>(25);

  const averageProgress = useMemo(() => {
    if (entries.length === 0) return 0;
    const total = entries.reduce((sum, item) => sum + item.progressPercent, 0);
    return Math.round(total / entries.length);
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return entries.filter((item) => {
      const matchesCategory =
        selectedFilter === 'Tout' || item.category === selectedFilter;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        (item.goalTarget ?? '').toLowerCase().includes(q)
      );
    });
  }, [entries, selectedFilter, searchQuery]);

  const handleSaveEntry = useCallback(() => {
    if (!content.trim() && !title.trim()) {
      Alert.alert(
        'Entrée vide',
        'Écrivez au moins un titre, une idée, un objectif ou une expérience avant d’enregistrer.'
      );
      return;
    }

    addEntry({
      title,
      content,
      category,
      mood,
      goalTarget,
      progressPercent,
    });

    setTitle('');
    setContent('');
    setGoalTarget('');
    setProgressPercent(25);
    Alert.alert(
      'Enregistré dans votre journal privé',
      'Cette note reste strictement personnelle et visible uniquement par vous.'
    );
  }, [addEntry, category, content, goalTarget, mood, progressPercent, title]);

  const handleConfirmDelete = useCallback(
    (entry: JournalEntry) => {
      Alert.alert(
        'Supprimer cette entrée ?',
        `Supprimer « ${entry.title} » de votre journal privé ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => deleteEntry(entry.id),
          },
        ]
      );
    },
    [deleteEntry]
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />

      <View style={styles.header}>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Journal Personnel</Text>
          <Text style={styles.headerSubtitle}>
            Espace strictement privé • {entries.length} entrée(s)
          </Text>
        </View>
        <View style={styles.privateBadge}>
          <Ionicons
            name="lock-closed"
            size={14}
            color={Colors.textOnPrimary}
          />
          <Text style={styles.privateBadgeText}>Privé</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.privacyBanner}>
          <Ionicons
            name="shield-checkmark-outline"
            size={18}
            color={Colors.primary}
          />
          <Text style={styles.privacyBannerText}>
            Confidentialité garantie : aucun autre membre ne peut lire votre
            journal.
          </Text>
        </View>

        <View style={styles.evolutionCard}>
          <View style={styles.evolutionTop}>
            <Text style={styles.evolutionTitle}>Évolution personnelle</Text>
            <Text style={styles.evolutionValue}>{averageProgress}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${averageProgress}%` as any },
              ]}
            />
          </View>
          <Text style={styles.evolutionHint}>
            Progression moyenne sur vos objectifs, ambitions et expériences.
          </Text>
        </View>

        <View style={styles.composerCard}>
          <Text style={styles.sectionTitle}>Nouvelle entrée personnelle</Text>

          <Text style={styles.fieldLabel}>Type d’entrée</Text>
          <View style={styles.chipsWrap}>
            {CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>État d’esprit</Text>
          <View style={styles.chipsWrap}>
            {MOODS.map((m) => {
              const active = mood === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setMood(m)}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Titre (idée, rêve, objectif ou moment de la journée)..."
            placeholderTextColor={Colors.textSecondary}
            style={styles.input}
          />

          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Écrivez vos pensées, ambitions, objectifs ou expériences quotidiennes..."
            placeholderTextColor={Colors.textSecondary}
            style={[styles.input, styles.multilineInput]}
            multiline
          />

          <TextInput
            value={goalTarget}
            onChangeText={setGoalTarget}
            placeholder="Objectif ou étape associée (optionnel)..."
            placeholderTextColor={Colors.textSecondary}
            style={styles.input}
          />

          <View style={styles.sliderRow}>
            <Text style={styles.fieldLabel}>
              Avancement : {progressPercent}%
            </Text>
            <View style={styles.stepButtons}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() =>
                  setProgressPercent((prev) => Math.max(0, prev - 10))
                }
              >
                <Text style={styles.stepBtnText}>-10%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() =>
                  setProgressPercent((prev) => Math.min(100, prev + 10))
                }
              >
                <Text style={styles.stepBtnText}>+10%</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveEntry}
            activeOpacity={0.85}
          >
            <Ionicons
              name="bookmark-outline"
              size={18}
              color={Colors.textOnPrimary}
            />
            <Text style={styles.saveButtonText}>Enregistrer dans mon journal</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>Historique & anciennes entrées</Text>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={Colors.textSecondary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Rechercher dans mes notes..."
              placeholderTextColor={Colors.textSecondary}
              style={styles.searchInput}
            />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {(['Tout', ...CATEGORIES] as const).map((flt) => {
            const active = selectedFilter === flt;
            return (
              <TouchableOpacity
                key={flt}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedFilter(flt)}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {flt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {filteredEntries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aucune entrée trouvée</Text>
            <Text style={styles.emptyText}>
              Ajoutez une nouvelle note ci-dessus ou changez de filtre.
            </Text>
          </View>
        ) : (
          filteredEntries.map((item) => (
            <View key={item.id} style={styles.entryCard}>
              <View style={styles.entryTopRow}>
                <View style={styles.entryBadge}>
                  <Text style={styles.entryBadgeText}>{item.category}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleConfirmDelete(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={Colors.danger}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.entryTitle}>{item.title}</Text>
              <Text style={styles.entryMeta}>
                {item.mood} • {item.createdAt}
              </Text>

              {Boolean(item.content) && (
                <Text style={styles.entryContent}>{item.content}</Text>
              )}

              {Boolean(item.goalTarget) && (
                <View style={styles.goalBox}>
                  <Ionicons
                    name="flag-outline"
                    size={14}
                    color={Colors.primary}
                  />
                  <Text style={styles.goalText}>{item.goalTarget}</Text>
                </View>
              )}

              <View style={styles.entryProgressSection}>
                <View style={styles.entryProgressTop}>
                  <Text style={styles.entryProgressLabel}>
                    Progression : {item.progressPercent}%
                  </Text>
                  <View style={styles.miniAdjustRow}>
                    <TouchableOpacity
                      style={styles.miniBtn}
                      onPress={() =>
                        updateProgress(item.id, item.progressPercent - 10)
                      }
                    >
                      <Text style={styles.miniBtnText}>-10%</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.miniBtn}
                      onPress={() =>
                        updateProgress(item.id, item.progressPercent + 10)
                      }
                    >
                      <Text style={styles.miniBtnText}>+10%</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${item.progressPercent}%` as any },
                    ]}
                  />
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default JournalScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop:
      Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 44,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextCol: {
    flex: 1,
    marginRight: 8,
  },
  headerTitle: {
    color: Colors.textOnPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: Colors.primaryLight,
    fontSize: 12,
    marginTop: 2,
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  privateBadgeText: {
    color: Colors.textOnPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 36,
    gap: 12,
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primaryLight,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  privacyBannerText: {
    flex: 1,
    color: Colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  evolutionCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  evolutionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  evolutionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  evolutionValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  evolutionHint: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.surface,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  composerCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  chipTextActive: {
    color: Colors.textOnPrimary,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  multilineInput: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  stepButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  stepBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  stepBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  saveButton: {
    marginTop: 4,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: Colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  historyHeader: {
    gap: 8,
    marginTop: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    paddingVertical: 2,
  },
  filterScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  entryCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  entryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  entryBadgeText: {
    color: Colors.primaryDark,
    fontSize: 11,
    fontWeight: '800',
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  entryMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  entryContent: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 19,
  },
  goalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  goalText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  entryProgressSection: {
    gap: 6,
    marginTop: 2,
  },
  entryProgressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryProgressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  miniAdjustRow: {
    flexDirection: 'row',
    gap: 6,
  },
  miniBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  miniBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});