import {
  AiCoachGoal,
  AiCoachMessage,
  AiCoachMode,
  AiCoachPrivacyConsent,
  AiCoachResponsePayload,
} from '../types/aiCoach';

const DEFAULT_API_BASE_URL =
  process.env.EXPO_PUBLIC_AI_COACH_API_URL || 'http://localhost:8000';

const REFLECTION_QUESTIONS: Record<AiCoachMode, string> = {
  ideas:
    'Quelle idée parmi celles-ci a le plus d’impact concret pour ton public HoReSa dès cette semaine ?',
  goals:
    'Comment sauras-tu de façon objective que cet objectif est atteint dans 30 jours ?',
  project:
    'Quel est le plus petit livrable testable que tu peux finaliser en moins de 48 heures ?',
  reflection:
    'Qu’est-ce qui a fonctionné au-delà de tes attentes récemment, et qu’est-ce que tu ferais autrement ?',
  evaluation:
    'Si tu devais noter ton exécution actuelle de 1 à 10 sur ton critère principal, quel levier ferait gagner +2 points ?',
};

function computeWeightedProgress(goals: AiCoachGoal[]): number {
  if (goals.length === 0) return 0;
  const sum = goals.reduce(
    (acc, g) => acc + Math.max(0, Math.min(100, g.progress)),
    0
  );
  return Math.round(sum / goals.length);
}

function buildLocalCoachResponse(params: {
  prompt: string;
  mode: AiCoachMode;
  goals: AiCoachGoal[];
  consent: AiCoachPrivacyConsent;
  journalExcerpts?: string[];
}): AiCoachResponsePayload {
  const { prompt, mode, goals, consent, journalExcerpts } = params;

  // Garde-fou strict : aucune donnée du journal n'est exploitée sans consentement explicite
  const canUseJournal = Boolean(consent.allowJournalAnalysis);
  const authorizedJournalCount =
    canUseJournal && Array.isArray(journalExcerpts) ? journalExcerpts.length : 0;

  const avgProgress = computeWeightedProgress(goals);
  const activeGoal = goals[0];

  const journalNote = canUseJournal
    ? authorizedJournalCount > 0
      ? `Analyse du journal autorisée (${authorizedJournalCount} extrait(s) pris en compte).`
      : 'Analyse du journal autorisée (aucun extrait transmis pour cette requête).'
    : 'Analyse du journal désactivée : aucune donnée privée de ton journal n’est consultée.';

  let reply = '';
  let suggestedNextStep = '';

  switch (mode) {
    case 'ideas':
      reply =
        `Pistes créatives autour de « ${prompt.trim()} » :\n` +
        `1. Format immersif en coulisses ou expérience client différenciante.\n` +
        `2. Offre packagée ou événement thématique ciblé sur ta zone/audience.\n` +
        `3. Mini-série vidéo courte (Reels) montrant la valeur ajoutée étape par étape.\n` +
        `${journalNote}`;
      suggestedNextStep =
        'Choisis une seule idée et définis un premier test sur 7 jours.';
      break;

    case 'goals':
      reply =
        `Cadre d’objectif pour « ${prompt.trim()} » :\n` +
        `• Résultat attendu : clair, mesurable et daté.\n` +
        `• Critère de réussite : indicateur concret suivi chaque semaine.\n` +
        `• Jalons hebdomadaires : 1 action clé par semaine sans surcharge.\n` +
        `${journalNote}`;
      suggestedNextStep =
        'Ajoute cet objectif à ta liste avec un critère d’évaluation précis.';
      break;

    case 'project':
      reply =
        `Accompagnement projet sur « ${prompt.trim()} » :\n` +
        `• Cadrage : périmètre, ressources nécessaires et blocages potentiels.\n` +
        `• Priorité n°1 : débloquer l’étape critique avant d’ajouter des détails.\n` +
        `• Suivi : point d’avancement court tous les 3 jours.\n` +
        `${journalNote}`;
      suggestedNextStep =
        'Liste les 3 prochaines tâches concrètes et assigne une date à la première.';
      break;

    case 'evaluation':
      reply =
        `Évaluation de progression (${goals.length} objectif(s), moyenne ${avgProgress}%) :\n` +
        (activeGoal
          ? `• Objectif prioritaire : « ${activeGoal.title} » (${activeGoal.progress}% — Critère : ${activeGoal.criterion}).\n`
          : `• Aucun objectif enregistré pour le moment.\n`) +
        `• Recommandation : concentre tes efforts sur le critère où l’écart est le plus visible.\n` +
        `${journalNote}`;
      suggestedNextStep =
        'Mets à jour le pourcentage d’avancement de ton objectif principal.';
      break;

    case 'reflection':
    default:
      reply =
        `Réflexion guidée sur « ${prompt.trim()} » :\n` +
        `• Clarifie ce qui dépend directement de toi vs ce qui dépend du contexte.\n` +
        `• Identifie l’habitude qui soutient le mieux ton ambition.\n` +
        `${journalNote}`;
      suggestedNextStep =
        'Note ta réponse en 3 phrases pour guider ta prochaine décision.';
      break;
  }

  return {
    reply,
    reflectionQuestion: REFLECTION_QUESTIONS[mode],
    suggestedNextStep,
    evaluatedScore: avgProgress,
    usedJournalData: canUseJournal && authorizedJournalCount > 0,
    source: 'local-fallback',
  };
}

export const aiCoachService = {
  async sendCoachMessage(params: {
    prompt: string;
    mode: AiCoachMode;
    goals: AiCoachGoal[];
    consent: AiCoachPrivacyConsent;
    journalExcerpts?: string[];
    history: AiCoachMessage[];
    apiBaseUrl?: string;
  }): Promise<AiCoachResponsePayload> {
    const trimmedPrompt = params.prompt.trim();
    if (!trimmedPrompt) {
      throw new Error('Le message ne peut pas être vide.');
    }

    // Sécurité : n'inclure des extraits du journal que si l'utilisateur a explicitement autorisé l'analyse IA
    const authorizedExcerpts = params.consent.allowJournalAnalysis
      ? params.journalExcerpts ?? []
      : [];

    const payload = {
      prompt: trimmedPrompt,
      mode: params.mode,
      goals: params.goals,
      privacyConsent: {
        allowJournalAnalysis: Boolean(params.consent.allowJournalAnalysis),
        updatedAt: params.consent.updatedAt,
      },
      journalExcerpts: authorizedExcerpts,
      history: params.history.slice(-8).map((m) => ({
        sender: m.sender,
        content: m.content,
        mode: m.mode,
      })),
    };

    const baseUrl = (params.apiBaseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const response = await fetch(`${baseUrl}/api/v1/coach/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return buildLocalCoachResponse({
          prompt: trimmedPrompt,
          mode: params.mode,
          goals: params.goals,
          consent: params.consent,
          journalExcerpts: authorizedExcerpts,
        });
      }

      const data = await response.json();

      return {
        reply:
          typeof data.reply === 'string' && data.reply.trim().length > 0
            ? data.reply
            : buildLocalCoachResponse({
                prompt: trimmedPrompt,
                mode: params.mode,
                goals: params.goals,
                consent: params.consent,
                journalExcerpts: authorizedExcerpts,
              }).reply,
        reflectionQuestion:
          typeof data.reflectionQuestion === 'string' &&
          data.reflectionQuestion.trim().length > 0
            ? data.reflectionQuestion
            : REFLECTION_QUESTIONS[params.mode],
        suggestedNextStep:
          typeof data.suggestedNextStep === 'string' &&
          data.suggestedNextStep.trim().length > 0
            ? data.suggestedNextStep
            : 'Définis une action concrète à réaliser aujourd’hui.',
        evaluatedScore:
          typeof data.evaluatedScore === 'number'
            ? data.evaluatedScore
            : computeWeightedProgress(params.goals),
        usedJournalData: Boolean(
          params.consent.allowJournalAnalysis && data.usedJournalData
        ),
        source: 'fastapi',
      };
    } catch {
      return buildLocalCoachResponse({
        prompt: trimmedPrompt,
        mode: params.mode,
        goals: params.goals,
        consent: params.consent,
        journalExcerpts: authorizedExcerpts,
      });
    }
  },
};