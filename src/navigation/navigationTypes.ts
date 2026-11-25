export type MainTabParamList = {
  Home: undefined;
  Reels: undefined;
  Create: undefined;
  Messages: undefined;
  Profile: undefined;
};

export type BottomTabParamList = MainTabParamList;

export type RootStackParamList = {
  MainTabs: undefined;
  AiCoach: undefined;
  Chat: {
    conversationId: string;
    recipientName: string;
    recipientAvatar?: string;
  };
};