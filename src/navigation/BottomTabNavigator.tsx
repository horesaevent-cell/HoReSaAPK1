import React, { useCallback, useState } from 'react';
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { MessagesScreen } from '../screens/Messages/MessagesScreen';

export type AppTabKey = 'home' | 'messages';

interface MainTabNavigatorProps {
  initialTab?: AppTabKey;
  unreadMessagesCount?: number;
}

export const MainTabNavigator: React.FC<MainTabNavigatorProps> = ({
  initialTab = 'home',
  unreadMessagesCount = 1,
}) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 375;

  const [activeTab, setActiveTab] = useState<AppTabKey>(initialTab);
  const [unreadCount, setUnreadCount] = useState<number>(unreadMessagesCount);

  const bottomPadding = Platform.OS === 'ios' ? 18 : 10;

  const handleSelectTab = useCallback((tab: AppTabKey) => {
    setActiveTab(tab);
    if (tab === 'messages') {
      setUnreadCount(0);
    }
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#142608" />

      <View style={styles.screenContainer}>
        {activeTab === 'home' ? <HomeScreen /> : <MessagesScreen />}
      </View>

      <View style={[styles.tabBarWrapper, { paddingBottom: bottomPadding }]}>
        <View style={styles.tabBarInner}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => handleSelectTab('home')}
            activeOpacity={0.85}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'home' }}
          >
            <Ionicons
              name={activeTab === 'home' ? 'home' : 'home-outline'}
              size={isCompact ? 20 : 22}
              color={activeTab === 'home' ? '#4ADE80' : 'rgba(255,255,255,0.72)'}
            />
            <Text
              style={[
                styles.tabLabel,
                isCompact && styles.tabLabelCompact,
                activeTab === 'home' && styles.tabLabelActive,
              ]}
              numberOfLines={1}
            >
              Accueil
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => handleSelectTab('messages')}
            activeOpacity={0.85}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'messages' }}
          >
            <View style={styles.iconWithBadge}>
              <Ionicons
                name={
                  activeTab === 'messages'
                    ? 'chatbubble-ellipses'
                    : 'chatbubble-ellipses-outline'
                }
                size={isCompact ? 20 : 22}
                color={
                  activeTab === 'messages'
                    ? '#4ADE80'
                    : 'rgba(255,255,255,0.72)'
                }
              />
              {unreadCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text
              style={[
                styles.tabLabel,
                isCompact && styles.tabLabelCompact,
                activeTab === 'messages' && styles.tabLabelActive,
              ]}
              numberOfLines={1}
            >
              Messages
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    backgroundColor: '#142608',
  },
  screenContainer: {
    flex: 1,
    width: '100%',
  },
  tabBarWrapper: {
    width: '100%',
    backgroundColor: '#0E1C05',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  tabBarInner: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  iconWithBadge: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#0B1406',
    fontSize: 10,
    fontWeight: '800',
  },
  tabLabel: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 12,
    fontWeight: '600',
  },
  tabLabelCompact: {
    fontSize: 11,
  },
  tabLabelActive: {
    color: '#4ADE80',
    fontWeight: '800',
  },
});

export default MainTabNavigator;