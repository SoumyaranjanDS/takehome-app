import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const getCategoryName = task => {
  if (typeof task.category === 'string' && task.category.trim()) {
    return task.category.trim();
  }

  if (typeof task.category?.name === 'string' && task.category.name.trim()) {
    return task.category.name.trim();
  }

  return 'General';
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const HomeScreen = () => {
  const { logout } = useContext(AuthContext);

  const mountedRef = useRef(false);
  const fetchingRef = useRef(false);
  const loggingOutRef = useRef(false);

  const [tasks, setTasks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState('');
  const [logoutError, setLogoutError] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const fetchData = useCallback(async (refresh = false) => {
    if (fetchingRef.current) return;

    fetchingRef.current = true;
    setError('');

    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [profileRes, tasksRes] = await Promise.all([
        api.get('/user/profile'),
        api.get('/tasks/mine'),
      ]);

      // Matches the array response used in your original screen.
      if (!Array.isArray(tasksRes.data)) {
        throw new Error('Unexpected task response');
      }

      if (!mountedRef.current) return;

      setProfile(profileRes.data);
      setTasks(tasksRes.data);
      setHasLoaded(true);
    } catch {
      if (mountedRef.current) {
        setError(
          'We couldn’t load your latest details. Check your connection and try again.',
        );
      }
    } finally {
      fetchingRef.current = false;

      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  const handleLogout = async () => {
    if (loggingOutRef.current) return;

    loggingOutRef.current = true;
    setIsLoggingOut(true);
    setLogoutError('');

    try {
      await logout();
    } catch {
      if (mountedRef.current) {
        setLogoutError('We couldn’t sign you out. Please try again.');
      }
    } finally {
      loggingOutRef.current = false;

      if (mountedRef.current) {
        setIsLoggingOut(false);
      }
    }
  };

  const groupedTasks = useMemo(() => {
    const groups = new Map();

    tasks.forEach(task => {
      const category = getCategoryName(task);

      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(task);
    });

    return Array.from(groups, ([name, items]) => ({ name, items }));
  }, [tasks]);

  const fullName = typeof profile?.name === 'string' ? profile.name.trim() : '';

  const firstName = fullName.split(/\s+/)[0] || 'there';

  const initials = fullName
    ? fullName
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
    : 'P';

  if (isLoading && !hasLoaded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <View style={styles.loadingIcon}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text style={styles.loadingTitle}>Getting things ready</Text>
          <Text style={styles.loadingText}>Loading your saved tasks…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchData(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.brandName}>
                Padosi<Text style={styles.brandAccent}>Pro</Text>
              </Text>
              <Text style={styles.brandCaption}>Everyday, made easier.</Text>
            </View>

            <View
              style={styles.avatar}
              accessible
              accessibilityLabel={fullName || 'Your account'}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>

          <View style={styles.welcome}>
            <Text style={styles.greeting}>
              {getGreeting()}, {firstName}.
            </Text>
            <Text style={styles.pageTitle}>
              A little more{'\n'}room for life.
            </Text>
            <Text style={styles.pageSubtitle}>
              Your everyday help, all in one place.
            </Text>
          </View>

          {/* Recoverable network error */}
          {!!error && (
            <View style={styles.errorBanner}>
              <Text
                style={styles.errorTitle}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                {hasLoaded
                  ? 'Couldn’t refresh your home'
                  : 'Let’s try that again'}
              </Text>

              <Text style={styles.errorBody}>{error}</Text>

              {hasLoaded && (
                <Text style={styles.errorBody}>
                  Your previously loaded selections are still shown below.
                </Text>
              )}

              <Pressable
                onPress={() => fetchData(hasLoaded)}
                disabled={isRefreshing || isLoading}
                accessibilityRole="button"
                accessibilityState={{
                  disabled: isRefreshing || isLoading,
                }}
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          )}

          {hasLoaded && (
            <>
              {/* Overview: saved selections, not booking statuses */}
              <View style={styles.overview}>
                <Text style={styles.overviewEyebrow}>
                  YOUR EVERYDAY SUPPORT
                </Text>

                <Text style={styles.overviewTitle}>
                  {tasks.length
                    ? 'A little less on your plate.'
                    : 'Make space for what matters.'}
                </Text>

                <Text style={styles.overviewDescription}>
                  {tasks.length
                    ? 'The tasks you’ve chosen to get help with, gathered here.'
                    : 'Your selected tasks will appear here once they’re saved.'}
                </Text>

                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{tasks.length}</Text>
                    <Text style={styles.statLabel}>
                      {tasks.length === 1 ? 'Selected task' : 'Selected tasks'}
                    </Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{groupedTasks.length}</Text>
                    <Text style={styles.statLabel}>
                      {groupedTasks.length === 1 ? 'Category' : 'Categories'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>Your selected tasks</Text>
                <Text style={styles.sectionDescription}>
                  {tasks.length
                    ? 'Organized around the help you need.'
                    : 'Nothing selected just yet.'}
                </Text>
              </View>

              {tasks.length ? (
                groupedTasks.map(group => (
                  <View key={group.name} style={styles.categorySection}>
                    <View style={styles.categoryHeader}>
                      <View style={styles.categoryDot} />

                      <Text style={styles.categoryName}>{group.name}</Text>

                      <View style={styles.categoryCount}>
                        <Text style={styles.categoryCountText}>
                          {group.items.length}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.taskList}>
                      {group.items.map((task, index) => (
                        <View
                          key={String(
                            task.id ?? task._id ?? `${group.name}-${index}`,
                          )}
                          style={[
                            styles.taskRow,
                            index < group.items.length - 1 &&
                              styles.taskDivider,
                          ]}
                        >
                          <View style={styles.taskMarker} accessible={false}>
                            <View style={styles.checkmark} />
                          </View>

                          <View style={styles.taskContent}>
                            <Text style={styles.taskName}>{task.name}</Text>

                            {!!task.description && (
                              <Text style={styles.taskDescription}>
                                {task.description}
                              </Text>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptySymbol} accessible={false}>
                    <View style={styles.emptyLineLong} />
                    <View style={styles.emptyLineShort} />
                    <View style={styles.emptyLineLong} />
                  </View>

                  <Text style={styles.emptyTitle}>Your list starts here</Text>
                  <Text style={styles.emptyDescription}>
                    Once you choose and save tasks during setup, you can find
                    them together on this screen.
                  </Text>
                </View>
              )}

              <View style={styles.supportNote}>
                <View style={styles.supportAccent} />
                <View style={styles.supportContent}>
                  <Text style={styles.supportTitle}>
                    Made for your everyday
                  </Text>
                  <Text style={styles.supportText}>
                    A helping hand with the little things, so you have more time
                    for the things you love.
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Account action */}
          <View style={styles.footer}>
            {!!logoutError && (
              <Text
                style={styles.logoutError}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
              >
                {logoutError}
              </Text>
            )}

            <Pressable
              onPress={handleLogout}
              disabled={isLoggingOut}
              accessibilityRole="button"
              accessibilityState={{
                disabled: isLoggingOut,
                busy: isLoggingOut,
              }}
              style={({ pressed }) => [
                styles.logoutButton,
                (pressed || isLoggingOut) && styles.pressed,
              ]}
            >
              {isLoggingOut && (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={styles.logoutSpinner}
                />
              )}

              <Text style={styles.logoutText}>
                {isLoggingOut ? 'Signing out…' : 'Sign out'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  headerText: {
    flex: 1,
    marginRight: 16,
  },
  brandName: {
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: -0.6,
    color: colors.text,
  },
  brandAccent: {
    color: colors.primary,
  },
  brandCaption: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },

  welcome: {
    marginBottom: 26,
  },
  greeting: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    color: colors.textMuted,
    marginBottom: 10,
  },
  pageTitle: {
    fontSize: 34,
    lineHeight: 41,
    letterSpacing: -1.2,
    fontWeight: '600',
    color: colors.text,
  },
  pageSubtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },

  overview: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: colors.primary,
    marginBottom: 32,
  },
  overviewEyebrow: {
    color: colors.textOnPrimary,
    fontSize: 10,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 13,
  },
  overviewTitle: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '600',
    letterSpacing: -0.6,
    color: colors.textOnPrimary,
  },
  overviewDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.primarySoft,
    marginTop: 9,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.22)',
  },
  stat: {
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    marginHorizontal: 20,
  },
  statValue: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '600',
    letterSpacing: -0.8,
    color: colors.textOnPrimary,
  },
  statLabel: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 18,
    color: colors.primarySoft,
  },

  sectionHeading: {
    marginBottom: 23,
  },
  sectionTitle: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: colors.text,
  },
  sectionDescription: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  categorySection: {
    marginBottom: 22,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 11,
    paddingHorizontal: 2,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 9,
  },
  categoryName: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.text,
  },
  categoryCount: {
    minWidth: 27,
    minHeight: 25,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
  },
  categoryCountText: {
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '600',
    color: colors.textMuted,
  },
  taskList: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 16,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 18,
  },
  taskDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  taskMarker: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
    marginTop: 1,
  },
  checkmark: {
    width: 7,
    height: 12,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.primary,
    transform: [{ rotate: '45deg' }],
    marginTop: -3,
  },
  taskContent: {
    flex: 1,
  },
  taskName: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    color: colors.text,
  },
  taskDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
    marginTop: 5,
  },

  supportNote: {
    flexDirection: 'row',
    marginTop: 6,
    paddingVertical: 10,
    marginBottom: 24,
  },
  supportAccent: {
    width: 3,
    borderRadius: 2,
    backgroundColor: colors.warmAccent,
    marginRight: 14,
  },
  supportContent: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  supportText: {
    fontSize: 13,
    lineHeight: 21,
    color: colors.textMuted,
  },

  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 24,
  },
  emptySymbol: {
    width: 58,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 15,
    marginBottom: 18,
  },
  emptyLineLong: {
    width: 27,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginVertical: 4,
  },
  emptyLineShort: {
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginVertical: 4,
  },
  emptyTitle: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  emptyDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
  },

  errorBanner: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: colors.errorSoft,
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: colors.error,
  },
  errorBody: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    color: colors.error,
  },
  retryButton: {
    minHeight: 48,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginLeft: -12,
    marginTop: 4,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
    textDecorationLine: 'underline',
  },

  footer: {
    marginTop: 'auto',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 14,
  },
  logoutButton: {
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: colors.primary,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  logoutSpinner: {
    marginRight: 10,
  },
  logoutError: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    color: colors.error,
    marginBottom: 8,
  },
  pressed: {
    opacity: 0.65,
  },

  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  loadingTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: colors.text,
  },
  loadingText: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
  },
});

export default HomeScreen;
