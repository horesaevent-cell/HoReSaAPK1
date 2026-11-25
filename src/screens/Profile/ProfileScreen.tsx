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
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Colors } from '../../constants/colors';
import { MainTabParamList } from '../../navigation/navigationTypes';
import { useJournalStore } from '../../store/journalStore';
import { useReelsStore } from '../../store/reelsStore';
import { useHomePostsStore } from '../../store/homePostsStore';
import {
  JournalCategory,
  JournalEntry,
  JournalMood,
} from '../../types/journal';

type ProfileNavProp = BottomTabNavigationProp<MainTabParamList, 'Profile'>;

const JOURNAL_CATEGORIES: JournalCategory[] = [
  'Pensées & Idées',
  'Rêves & Ambitions',
  'Objectifs',
  'Expériences quotidiennes',
];

const JOURNAL_MOODS: JournalMood[] = ['Inspiré', 'Serein', 'Déterminé', 'Réflexif'];

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileNavProp>();
  const { entries, addEntry, updateProgress, deleteEntry } = useJournalStore();
  const { reels } = useReelsStore();
  const { posts } = useHomePostsStore();

  const [activeTab, setActiveTab] = useState<'apercu' | 'journal'>('journal');
  const [isPublicProfile, setIsPublicProfile] = useState<boolean>(true);
  const [bio, setBio] = useState<string>(
    'Créateur et acteur HoReSa engagé dans l’hospitalité, la gastronomie et l’innovation locale.'
  );
  const [editingBio, setEditingBio] = useState<boolean>(false);

  // États de la fonction Journal Privé intégrée au Profil
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

  const handleSaveJournalEntry = useCallback(() => {
    if (!content.trim() && !title.trim()) {
      Alert.alert(
        'Entrée vide',
        'Ajoutez un titre, une idée, un objectif ou une expérience avant d’enregistrer.'
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
      'Cette entrée reste strictement personnelle dans votre profil.'
    );
  }, [addEntry, category, content, goalTarget, mood, progressPercent, title]);

  const handleConfirmDeleteEntry = useCallback(
    (entry: JournalEntry) => {
      Alert.alert(
        'Supprimer cette entrée ?',
        `Retirer « ${entry.title} » de votre journal privé ?`,
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
        <View style={styles.headerRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>H</Text>
          </View>
          <View style={styles.identityCol}>
            <Text style={styles.profileName}>Espace HoReSa Officiel</Text>
            <Text style={styles.profileHandle}>
              @horesa_membre • {isPublicProfile ? 'Profil Public' : 'Profil Privé'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.visibilityBtn}
            onPress={() => setIsPublicProfile((prev) => !prev)}
          >
            <Ionicons
              name={isPublicProfile ? 'globe-outline' : 'lock-closed-outline'}
              size={14}
              color={Colors.textOnPrimary}
            />
            <Text style={styles.visibilityBtnText}>
              {isPublicProfile ? 'Public' : 'Privé'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{posts.length}</Text>
            <Text style={styles.statLabel}>Publications</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{reels.length}</Text>
            <Text style={styles.statLabel}>Reels</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{entries.length}</Text>
            <Text style={styles.statLabel}>Notes Journal</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{averageProgress}%</Text>
            <Text style={styles.statLabel}>Progression</Text>
          </View>
        </View>
      </View>

      <View style={styles.subTabsRow}>
        <TouchableOpacity
          style={[
            styles.subTabBtn,
            activeTab === 'journal' && styles.subTabBtnActive,
          ]}
          onPress={() => setActiveTab('journal')}
        >
          <Ionicons
            name="book-outline"
            size={16}
            color={
              activeTab === 'journal' ? Colors.textOnPrimary : Colors.textPrimary
            }
          />
          <Text
            style={[
              styles.subTabText,
              activeTab === 'journal' && styles.subTabTextActive,
            ]}
          >
            Journal Privé ({entries.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.subTabBtn,
            activeTab === 'apercu' && styles.subTabBtnActive,
          ]}
          onPress={() => setActiveTab('apercu')}
        >
          <Ionicons
            name="person-outline"
            size={16}
            color={
              activeTab === 'apercu' ? Colors.textOnPrimary : Colors.textPrimary
            }
          />
          <Text
            style={[
              styles.subTabText,
              activeTab === 'apercu' && styles.subTabTextActive,
            ]}
          >
            Profil & Ambitions
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'apercu' ? (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.sectionTitle}>Présentation & Ambitions</Text>
              <TouchableOpacity onPress={() => setEditingBio((prev) => !prev)}>
                <Text style={styles.linkAction}>
                  {editingBio ? 'Terminer' : 'Modifier'}
                </Text>
              </TouchableOpacity>
            </View>

            {editingBio ? (
              <TextInput
                value={bio}
                onChangeText={setBio}
                multiline
                style={[styles.input, styles.multilineInput]}
                placeholderTextColor={Colors.textSecondary}
              />
            ) : (
              <Text style={styles.bioText}>{bio}</Text>
            )}

            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => navigation.navigate('Create')}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color={Colors.textOnPrimary}
                />
                <Text style={styles.quickActionText}>Nouvelle publication</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickSecondaryBtn}
                onPress={() => setActiveTab('journal')}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={Colors.primary}
                />
                <Text style={styles.quickSecondaryText}>Ouvrir le journal</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.privacyBanner}>
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={Colors.primary}
              />
              <Text style={styles.privacyBannerText}>
                Journal intégré au profil : strictement privé, visible uniquement
                par vous.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.evolutionTop}>
                <Text style={styles.sectionTitle}>Évolution personnelle</Text>
                <Text style={styles.evolutionPercent}>{averageProgress}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${averageProgress}%` as any },
                  ]}
                />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Nouvelle note privée</Text>

              <Text style={styles.fieldLabel}>Catégorie</Text>
              <View style={styles.chipsWrap}>
                {JOURNAL_CATEGORIES.map((cat) => {
                  const active = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>État d’esprit</Text>
              <View style={styles.chipsWrap}>
                {JOURNAL_MOODS.map((m) => {
                  const active = mood === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setMood(m)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
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
                placeholder="Titre (idée, rêve, objectif ou expérience du jour)..."
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

              <View style={styles.adjustRow}>
                <Text style={styles.fieldLabel}>
                  Avancement : {progressPercent}%
                </Text>
                <View style={styles.stepGroup}>
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
                style={styles.saveBtn}
                onPress={handleSaveJournalEntry}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="bookmark-outline"
                  size={18}
                  color={Colors.textOnPrimary}
                />
                <Text style={styles.saveBtnText}>
                  Enregistrer dans mon journal
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={16} color={Colors.textSecondary} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Rechercher dans mon journal..."
                placeholderTextColor={Colors.textSecondary}
                style={styles.searchInput}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {(['Tout', ...JOURNAL_CATEGORIES] as const).map((flt) => {
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
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Aucune entrée trouvée</Text>
                <Text style={styles.bioText}>
                  Ajoutez une nouvelle note ci-dessus ou changez de filtre.
                </Text>
              </View>
            ) : (
              filteredEntries.map((item) => (
                <View key={item.id} style={styles.card}>
                  <View style={styles.entryTop}>
                    <View style={styles.entryBadge}>
                      <Text style={styles.entryBadgeText}>{item.category}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleConfirmDeleteEntry(item)}
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
                    <Text style={styles.bioText}>{item.content}</Text>
                  )}

                  {Boolean(item.goalTarget) && (
                    <View style={styles.goalTag}>
                      <Ionicons
                        name="flag-outline"
                        size={14}
                        color={Colors.primary}
                      />
                      <Text style={styles.goalTagText}>{item.goalTarget}</Text>
                    </View>
                  )}

                  <View style={styles.entryProgressWrap}>
                    <View style={styles.adjustRow}>
                      <Text style={styles.fieldLabel}>
                        Progression : {item.progressPercent}%
                      </Text>
                      <View style={styles.stepGroup}>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() =>
                            updateProgress(item.id, item.progressPercent - 10)
                          }
                        >
                          <Text style={styles.stepBtnText}>-10%</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() =>
                            updateProgress(item.id, item.progressPercent + 10)
                          }
                        >
                          <Text style={styles.stepBtnText}>+10%</Text>
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
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;

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
    paddingVertical: 14,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primaryDark,
    borderWidth: 1.5,
    borderColor: Colors.textOnPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.textOnPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  identityCol: {
    flex: 1,
  },
  profileName: {
    color: Colors.textOnPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  profileHandle: {
    color: Colors.primaryLight,
    fontSize: 12,
    marginTop: 1,
  },
  visibilityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  visibilityBtnText: {
    color: Colors.textOnPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryDark,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: Colors.textOnPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  statLabel: {
    color: Colors.primaryLight,
    fontSize: 11,
  },
  subTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 8,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subTabBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  subTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subTabTextActive: {
    color: Colors.textOnPrimary,
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
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  linkAction: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  bioText: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 19,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
  },
  quickActionText: {
    color: Colors.textOnPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  quickSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  quickSecondaryText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  evolutionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  evolutionPercent: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  adjustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepGroup: {
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
  saveBtn: {
    marginTop: 4,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: {
    color: Colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '800',
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
  entryTop: {
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
  goalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  goalTagText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  entryProgressWrap: {
    gap: 6,
    marginTop: 2,
  },
});