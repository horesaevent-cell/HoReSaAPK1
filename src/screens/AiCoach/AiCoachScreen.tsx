import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../../components/common/AppHeader';
import { Colors } from '../../constants/colors';
import { FontSize, Radius, Spacing } from '../../constants/theme';
import { aiCoachService } from '../../services/aiCoachService';
import {
  AiCoachGoal,
  AiCoachMessage,
  AiCoachMode,
  AiCoachPrivacyConsent,
} from '../../types/aiCoach';

const MODE_LABELS: { key: AiCoachMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'ideas', label: 'Idées', icon: 'bulb-outline' },
  { key: 'goals', label: 'Objectifs', icon: 'flag-outline' },
  { key: 'project', label: 'Projets', icon: 'briefcase-outline' },
  { key: 'reflection', label: 'Réflexion', icon: 'help-circle-outline' },
  { key: 'evaluation', label: 'Évaluation', icon: 'stats-chart-outline' },
];

const INITIAL_GOALS: AiCoachGoal[] = [
  {
    id: 'goal-1',
    title: 'Lancer une série de vidéos courtes inspirantes HoReSa',
    targetDate: '30 jours',
    progress: 40,
    criterion: '3 vidéos publiées par semaine avec retours clients',
  },
  {
    id: 'goal-2',
    title: 'Structurer un projet d’expérience / service différenciant',
    targetDate: '60 jours',
    progress: 25,
    criterion: 'Prototype validé + plan d’exécution chiffré',
  },
];

const INITIAL_MESSAGES: AiCoachMessage[] = [
  {
    id: 'msg-welcome',
    sender: 'assistant',
    mode: 'ideas',
    content:
      'Bienvenue sur ton espace Assistant Intelligent HoReSa. Je peux t’aider à générer des idées créatives, cadrer tes objectifs, faire avancer tes projets, te poser des questions de réflexion et évaluer tes progrès.',
    reflectionQuestion:
      'Quel est le sujet ou projet sur lequel tu veux avancer en priorité aujourd’hui ?',
    createdAt: 'Maintenant',
  },
];

export const AiCoachScreen: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<AiCoachMode>('ideas');
  const [messages, setMessages] = useState<AiCoachMessage[]>(INITIAL_MESSAGES);
  const [goals, setGoals] = useState<AiCoachGoal[]>(INITIAL_GOALS);
  const [promptText, setPromptText] = useState<string>('');
  const [newGoalTitle, setNewGoalTitle] = useState<string>('');
  const [newGoalCriterion, setNewGoalCriterion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showGoalsPanel, setShowGoalsPanel] = useState<boolean>(true);
  const [privacyConsent, setPrivacyConsent] = useState<AiCoachPrivacyConsent>({
    allowJournalAnalysis: false,
  });

  const globalScore = useMemo(() => {
    if (goals.length === 0) return 0;
    const total = goals.reduce((acc, item) => acc + item.progress, 0);
    return Math.round(total / goals.length);
  }, [goals]);

  const handleToggleJournalConsent = (value: boolean) => {
    setPrivacyConsent({
      allowJournalAnalysis: value,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddGoal = () => {
    const cleanTitle = newGoalTitle.trim();
    if (!cleanTitle) return;

    const created: AiCoachGoal = {
      id: `goal-${Date.now()}`,
      title: cleanTitle,
      targetDate: '30 jours',
      progress: 10,
      criterion:
        newGoalCriterion.trim() || 'Avancement mesurable vérifié chaque semaine',
    };

    setGoals((prev) => [created, ...prev]);
    setNewGoalTitle('');
    setNewGoalCriterion('');
  };

  const handleAdjustProgress = (goalId: string, delta: number) => {
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              progress: Math.max(0, Math.min(100, goal.progress + delta)),
            }
          : goal
      )
    );
  };

  const handleSendPrompt = async () => {
    const cleanPrompt = promptText.trim();
    if (!cleanPrompt || isLoading) return;

    const userMessage: AiCoachMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      mode: selectedMode,
      content: cleanPrompt,
      createdAt: 'À l’instant',
    };

    setMessages((prev) => [...prev, userMessage]);
    setPromptText('');
    setIsLoading(true);

    try {
      const response = await aiCoachService.sendCoachMessage({
        prompt: cleanPrompt,
        mode: selectedMode,
        goals,
        consent: privacyConsent,
        // Tant que le JournalScreen n'est pas relié avec consentement explicite, aucun extrait n'est passé
        journalExcerpts: [],
        history: [...messages, userMessage],
      });

      const assistantMessage: AiCoachMessage = {
        id: `msg-ai-${Date.now() + 1}`,
        sender: 'assistant',
        mode: selectedMode,
        content: `${response.reply}\n\nProchaine étape : ${response.suggestedNextStep}`,
        reflectionQuestion: response.reflectionQuestion,
        createdAt: 'À l’instant',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const fallbackMessage: AiCoachMessage = {
        id: `msg-err-${Date.now() + 1}`,
        sender: 'assistant',
        mode: selectedMode,
        content:
          'Une erreur est survenue lors du traitement de ta demande. Réessaie dans un instant.',
        reflectionQuestion:
          'Quelle étape simple peux-tu garder en tête pour aujourd’hui ?',
        createdAt: 'À l’instant',
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppHeader title="HoReSa Coach IA" />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Bandeau confidentialité & score de progression */}
        <View style={styles.privacyCard}>
          <View style={styles.privacyTopRow}>
            <View style={styles.privacyTitleGroup}>
              <Ionicons
                name={
                  privacyConsent.allowJournalAnalysis
                    ? 'shield-checkmark'
                    : 'lock-closed'
                }
                size={18}
                color={Colors.primary}
              />
              <Text style={styles.privacyTitle}>
                Confidentialité du journal personnel
              </Text>
            </View>
            <Switch
              value={privacyConsent.allowJournalAnalysis}
              onValueChange={handleToggleJournalConsent}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>
          <Text style={styles.privacyDescription}>
            {privacyConsent.allowJournalAnalysis
              ? 'Autorisation explicite activée : l’IA peut consulter les entrées autorisées du journal pour affiner ses conseils.'
              : 'Désactivé par défaut : l’IA ne lit jamais votre journal personnel sans votre autorisation explicite.'}
          </Text>
        </View>

        {/* Sélecteur de mode d'accompagnement */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modesRow}
        >
          {MODE_LABELS.map((item) => {
            const active = selectedMode === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.modeChip, active && styles.modeChipActive]}
                onPress={() => setSelectedMode(item.key)}
              >
                <Ionicons
                  name={item.icon}
                  size={15}
                  color={active ? Colors.white : Colors.textPrimary}
                />
                <Text
                  style={[
                    styles.modeChipText,
                    active && styles.modeChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Objectifs & évaluation selon critères personnalisés */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setShowGoalsPanel((prev) => !prev)}
          >
            <View>
              <Text style={styles.sectionTitle}>
                Objectifs & Progression ({globalScore}%)
              </Text>
              <Text style={styles.sectionSubtitle}>
                Évaluation selon critères personnalisés
              </Text>
            </View>
            <Ionicons
              name={showGoalsPanel ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>

          {showGoalsPanel && (
            <View style={styles.goalsBody}>
              {goals.map((goal) => (
                <View key={goal.id} style={styles.goalItem}>
                  <View style={styles.goalHeaderRow}>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    <Text style={styles.goalProgressText}>{goal.progress}%</Text>
                  </View>
                  <Text style={styles.goalCriterion}>
                    Critère : {goal.criterion}
                  </Text>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${goal.progress}%` },
                      ]}
                    />
                  </View>
                  <View style={styles.goalActionsRow}>
                    <TouchableOpacity
                      style={styles.stepButton}
                      onPress={() => handleAdjustProgress(goal.id, -10)}
                    >
                      <Text style={styles.stepButtonText}>-10%</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.stepButton}
                      onPress={() => handleAdjustProgress(goal.id, 10)}
                    >
                      <Text style={styles.stepButtonText}>+10%</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={styles.newGoalBox}>
                <TextInput
                  style={styles.goalInput}
                  placeholder="Nouvel objectif ou ambition..."
                  placeholderTextColor={Colors.textMuted}
                  value={newGoalTitle}
                  onChangeText={setNewGoalTitle}
                />
                <TextInput
                  style={styles.goalInput}
                  placeholder="Critère d’évaluation (ex. 2 projets livrés / mois)"
                  placeholderTextColor={Colors.textMuted}
                  value={newGoalCriterion}
                  onChangeText={setNewGoalCriterion}
                />
                <TouchableOpacity
                  style={styles.addGoalButton}
                  onPress={handleAddGoal}
                >
                  <Ionicons name="add" size={18} color={Colors.white} />
                  <Text style={styles.addGoalButtonText}>Ajouter l’objectif</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Fil d'échange et questions de réflexion */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Échange & Réflexion guidée</Text>
          <View style={styles.messagesList}>
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.assistantBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageMeta,
                      isUser ? styles.userMeta : styles.assistantMeta,
                    ]}
                  >
                    {isUser ? 'Vous' : 'Coach IA'} • {msg.createdAt}
                  </Text>
                  <Text
                    style={[
                      styles.messageText,
                      isUser ? styles.userMessageText : styles.assistantMessageText,
                    ]}
                  >
                    {msg.content}
                  </Text>
                  {!isUser && msg.reflectionQuestion && (
                    <View style={styles.reflectionBox}>
                      <Text style={styles.reflectionLabel}>
                        Question de réflexion :
                      </Text>
                      <Text style={styles.reflectionText}>
                        {msg.reflectionQuestion}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}

            {isLoading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>
                  L’assistant prépare une réponse structurée...
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Zone de saisie */}
      <View style={styles.composerBar}>
        <TextInput
          style={styles.promptInput}
          placeholder="Pose une question, partage une idée ou un projet..."
          placeholderTextColor={Colors.textMuted}
          value={promptText}
          onChangeText={setPromptText}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!promptText.trim() || isLoading) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendPrompt}
          disabled={!promptText.trim() || isLoading}
        >
          <Ionicons name="send" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  privacyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
  },
  privacyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  privacyTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  privacyTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  privacyDescription: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  modesRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modeChipText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  modeChipTextActive: {
    color: Colors.white,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  goalsBody: {
    gap: Spacing.md,
  },
  goalItem: {
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  goalTitle: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  goalProgressText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  goalCriterion: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  progressBarTrack: {
    height: 7,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  goalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.xs,
    marginTop: 2,
  },
  stepButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepButtonText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  newGoalBox: {
    gap: Spacing.xs,
    paddingTop: Spacing.xs,
  },
  goalInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  addGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
  },
  addGoalButtonText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  messagesList: {
    gap: Spacing.sm,
  },
  messageBubble: {
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    maxWidth: '88%',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: '94%',
  },
  messageMeta: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  userMeta: {
    color: '#D5E0CC',
  },
  assistantMeta: {
    color: Colors.textMuted,
  },
  messageText: {
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  userMessageText: {
    color: Colors.white,
  },
  assistantMessageText: {
    color: Colors.textPrimary,
  },
  reflectionBox: {
    marginTop: 6,
    padding: Spacing.xs,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  reflectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  reflectionText: {
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    marginTop: 2,
    lineHeight: 17,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  loadingText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  composerBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  promptInput: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
});

export default AiCoachScreen;