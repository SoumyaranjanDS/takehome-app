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
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const TaskSelectionScreen = () => {
  const { completeTasks } = useContext(AuthContext);

  const mountedRef = useRef(false);
  const fetchingRef = useRef(false);
  const savingRef = useRef(false);

  const [categories, setCategories] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [saveError, setSaveError] = useState('');

  const fetchCatalog = useCallback(async () => {
    if (fetchingRef.current) return;

    fetchingRef.current = true;
    setIsLoading(true);
    setCatalogError('');

    try {
      const response = await api.get('/tasks/catalog');

      if (
        !Array.isArray(response.data) ||
        !response.data.every((category) => Array.isArray(category.data))
      ) {
        throw new Error('Unexpected catalogue response');
      }

      if (mountedRef.current) {
        setCategories(response.data);
      }
    } catch {
      if (mountedRef.current) {
        setCatalogError(
          'We couldn’t load the task list. Check your connection and try again.'
        );
      }
    } finally {
      fetchingRef.current = false;

      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchCatalog();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchCatalog]);

  const selectedSet = useMemo(
    () => new Set(selectedTasks),
    [selectedTasks]
  );

  const searchTerm = query.trim().toLowerCase();

  const visibleGroups = useMemo(() => {
    return categories
      .filter(
        (category) =>
          activeCategory === null || category.category === activeCategory
      )
      .map((category) => ({
        ...category,
        data: category.data.filter((task) => {
          const searchableText = [
            task.name,
            task.description,
            category.category,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return searchableText.includes(searchTerm);
        }),
      }))
      .filter((category) => category.data.length > 0);
  }, [categories, activeCategory, searchTerm]);

  const reviewGroups = useMemo(
    () =>
      categories
        .map((category) => ({
          ...category,
          data: category.data.filter((task) => selectedSet.has(task.id)),
        }))
        .filter((category) => category.data.length > 0),
    [categories, selectedSet]
  );

  const categoryNames = useMemo(
    () => [...new Set(categories.map((category) => category.category))],
    [categories]
  );

  const totalTasks = categories.reduce(
    (total, category) => total + category.data.length,
    0
  );

  const visibleTaskCount = visibleGroups.reduce(
    (total, category) => total + category.data.length,
    0
  );

  const selectedCount = selectedTasks.length;
  const displayedGroups = isReviewing ? reviewGroups : visibleGroups;

  const toggleTask = (taskId) => {
    if (savingRef.current) return;

    setSaveError('');
    setSelectedTasks((current) =>
      current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId]
    );
  };

  const handleReview = () => {
    if (!selectedCount) return;

    Keyboard.dismiss();
    setSaveError('');
    setIsReviewing(true);
  };

  const handleSave = async () => {
    if (savingRef.current || !selectedCount) return;

    savingRef.current = true;
    setIsSaving(true);
    setSaveError('');

    let saved = false;

    try {
      await api.post('/tasks/select', {
        taskIds: selectedTasks,
      });

      saved = true;
      await completeTasks();
    } catch (err) {
      if (!mountedRef.current) return;

      const serverMessage = err.response?.data?.error;

      setSaveError(
        saved
          ? 'Your tasks were saved, but we couldn’t finish setup. Please try again.'
          : typeof serverMessage === 'string' && serverMessage.trim()
            ? serverMessage
            : 'We couldn’t save your choices. Your selections are still here—please try again.'
      );
    } finally {
      savingRef.current = false;

      if (mountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  const clearFilters = () => {
    setQuery('');
    setActiveCategory(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          // Changing mode resets scroll to the top of the review page.
          key={isReviewing ? 'review' : 'selection'}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === 'ios' ? 'interactive' : 'on-drag'
          }
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            {/* Progress */}
            <View style={styles.topRow}>
              <Text style={styles.brandName}>
                Padosi<Text style={styles.brandAccent}>Pro</Text>
              </Text>

              <View style={styles.stepBadge}>
                <Text style={styles.stepText}>Step 2 of 2</Text>
              </View>
            </View>

            <View
              style={styles.progressTrack}
              accessible
              accessibilityLabel="Setup, step 2 of 2"
            >
              <View style={styles.previousStep} />
              <View style={styles.currentStep} />
            </View>

            {/* Heading */}
            <View style={styles.header}>
              <Text style={styles.eyebrow}>
                {isReviewing ? 'ONE LAST LOOK' : 'MAKE IT PERSONAL'}
              </Text>

              <Text style={styles.title}>
                {isReviewing ? (
                  <>
                    A little help,{'\n'}
                    <Text style={styles.titleAccent}>chosen by you.</Text>
                  </>
                ) : (
                  <>
                    What can we{'\n'}
                    <Text style={styles.titleAccent}>help you with?</Text>
                  </>
                )}
              </Text>

              <Text style={styles.subtitle}>
                {isReviewing
                  ? 'Check your selections below. Remove anything you don’t need, then save your tasks.'
                  : 'Choose the everyday tasks you’d like help with. You can select more than one.'}
              </Text>
            </View>

            {/* Loading */}
            {isLoading ? (
              <View style={styles.statePanel}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.stateTitle}>Finding your everyday help</Text>
                <Text style={styles.stateDescription}>
                  Loading the task catalogue…
                </Text>
              </View>
            ) : catalogError ? (
              <View style={styles.statePanel}>
                <Text style={styles.stateTitle}>Let’s try that again</Text>
                <Text
                  style={styles.stateDescription}
                  accessibilityRole="alert"
                >
                  {catalogError}
                </Text>

                <Pressable
                  onPress={fetchCatalog}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.secondaryButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : totalTasks === 0 ? (
              <View style={styles.statePanel}>
                <Text style={styles.stateTitle}>No tasks available yet</Text>
                <Text style={styles.stateDescription}>
                  The catalogue is currently empty. Try refreshing it.
                </Text>

                <Pressable
                  onPress={fetchCatalog}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.secondaryButtonText}>
                    Refresh catalogue
                  </Text>
                </Pressable>
              </View>
            ) : (
              <>
                {!isReviewing && (
                  <>
                    {/* Search */}
                    <View
                      style={[
                        styles.searchContainer,
                        searchFocused && styles.searchFocused,
                      ]}
                    >
                      <View style={styles.searchIcon} accessible={false}>
                        <View style={styles.searchCircle} />
                        <View style={styles.searchHandle} />
                      </View>

                      <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Search everyday tasks"
                        placeholderTextColor={colors.textSubtle}
                        selectionColor={colors.primary}
                        style={styles.searchInput}
                        autoCorrect={false}
                        autoCapitalize="none"
                        returnKeyType="search"
                        onSubmitEditing={Keyboard.dismiss}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        accessibilityLabel="Search tasks"
                      />

                      {!!query && (
                        <Pressable
                          onPress={() => setQuery('')}
                          accessibilityRole="button"
                          accessibilityLabel="Clear search"
                          style={styles.clearButton}
                        >
                          <Text style={styles.clearText}>Clear</Text>
                        </Pressable>
                      )}
                    </View>

                    {/* Category filters */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                      contentContainerStyle={styles.filterRow}
                    >
                      {[null, ...categoryNames].map((category) => {
                        const active = activeCategory === category;

                        return (
                          <Pressable
                            key={category === null ? 'all' : `cat-${category}`}
                            onPress={() => setActiveCategory(category)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                            style={({ pressed }) => [
                              styles.filterChip,
                              active && styles.filterChipActive,
                              pressed && styles.pressed,
                            ]}
                          >
                            <Text
                              style={[
                                styles.filterText,
                                active && styles.filterTextActive,
                              ]}
                            >
                              {category === null ? 'All tasks' : category}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>

                    <Text style={styles.resultsText}>
                      {visibleTaskCount}{' '}
                      {visibleTaskCount === 1 ? 'task' : 'tasks'}
                      {searchTerm ? ' found' : ' to explore'}
                    </Text>
                  </>
                )}

                {/* Review summary */}
                {isReviewing && (
                  <View style={styles.reviewSummary}>
                    <View style={styles.reviewNumber}>
                      <Text style={styles.reviewNumberText}>
                        {selectedCount}
                      </Text>
                    </View>

                    <View style={styles.reviewSummaryContent}>
                      <Text style={styles.reviewSummaryTitle}>
                        {selectedCount === 1 ? 'Task selected' : 'Tasks selected'}
                      </Text>
                      <Text style={styles.reviewSummaryDescription}>
                        {reviewGroups.length}{' '}
                        {reviewGroups.length === 1 ? 'category' : 'categories'}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => setIsReviewing(false)}
                      disabled={isSaving}
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.editButton,
                        (pressed || isSaving) && styles.pressed,
                      ]}
                    >
                      <Text style={styles.editText}>Edit</Text>
                    </Pressable>
                  </View>
                )}

                {/* Category groups */}
                {displayedGroups.map((category, groupIndex) => (
                  <View
                    key={`${category.category}-${groupIndex}`}
                    style={styles.categorySection}
                  >
                    <View style={styles.categoryHeader}>
                      <View style={styles.categoryDot} />
                      <Text style={styles.categoryTitle}>
                        {category.category}
                      </Text>
                      <Text style={styles.categoryCount}>
                        {category.data.length}
                      </Text>
                    </View>

                    {category.data.map((task) => {
                      const selected = selectedSet.has(task.id);

                      return (
                        <Pressable
                          key={task.id}
                          onPress={() => toggleTask(task.id)}
                          disabled={isSaving}
                          accessibilityRole="checkbox"
                          accessibilityLabel={task.name}
                          accessibilityHint={
                            isReviewing
                              ? 'Deselect to remove this task from your review.'
                              : task.description || 'Select this task.'
                          }
                          accessibilityState={{
                            checked: selected,
                            disabled: isSaving,
                          }}
                          style={({ pressed }) => [
                            styles.taskRow,
                            selected && styles.taskRowSelected,
                            pressed && styles.taskRowPressed,
                          ]}
                        >
                          <View style={styles.taskInfo}>
                            <Text
                              style={[
                                styles.taskName,
                                selected && styles.taskNameSelected,
                              ]}
                            >
                              {task.name}
                            </Text>

                            {!!task.description && (
                              <Text style={styles.taskDescription}>
                                {task.description}
                              </Text>
                            )}
                          </View>

                          <View
                            style={[
                              styles.checkbox,
                              selected && styles.checkboxSelected,
                            ]}
                            accessible={false}
                          >
                            {selected && <View style={styles.checkmark} />}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}

                {/* No matches / all items removed */}
                {displayedGroups.length === 0 && (
                  <View style={styles.statePanel}>
                    <Text style={styles.stateTitle}>
                      {isReviewing
                        ? 'Your list is empty'
                        : 'No matching tasks'}
                    </Text>
                    <Text style={styles.stateDescription}>
                      {isReviewing
                        ? 'Go back and choose at least one task to continue.'
                        : 'Try another search or clear your filters. Your selections are kept.'}
                    </Text>

                    <Pressable
                      onPress={
                        isReviewing
                          ? () => setIsReviewing(false)
                          : clearFilters
                      }
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.secondaryButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.secondaryButtonText}>
                        {isReviewing ? 'Choose tasks' : 'Clear filters'}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>

        {/* Fixed action area above the bottom safe area */}
        {!isLoading && !catalogError && totalTasks > 0 && (
          <View style={styles.bottomBar}>
            <View style={styles.bottomContent}>
              {!!saveError && (
                <Text
                  style={styles.saveError}
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                >
                  {saveError}
                </Text>
              )}

              <View style={styles.selectionSummary}>
                <Text
                  style={styles.selectionCount}
                  accessibilityLiveRegion="polite"
                >
                  {selectedCount
                    ? `${selectedCount} selected`
                    : 'Choose at least one task'}
                </Text>

                {selectedCount > 0 && (
                  <Text style={styles.selectionHint}>
                    {isReviewing ? 'Ready to save' : 'Review before saving'}
                  </Text>
                )}
              </View>

              <Pressable
                onPress={isReviewing ? handleSave : handleReview}
                disabled={isSaving || selectedCount === 0}
                accessibilityRole="button"
                accessibilityState={{
                  disabled: isSaving || selectedCount === 0,
                  busy: isSaving,
                }}
                style={({ pressed }) => [
                  styles.primaryButton,
                  selectedCount === 0 && styles.primaryButtonDisabled,
                  pressed && selectedCount > 0 && styles.primaryButtonPressed,
                  isSaving && styles.pressed,
                ]}
              >
                {isSaving && (
                  <ActivityIndicator
                    size="small"
                    color={colors.textOnPrimary}
                    style={styles.buttonSpinner}
                  />
                )}

                <Text
                  style={[
                    styles.primaryButtonText,
                    selectedCount === 0 && styles.primaryButtonTextDisabled,
                  ]}
                >
                  {isSaving
                    ? 'Saving your tasks…'
                    : isReviewing
                      ? 'Save my tasks'
                      : selectedCount
                        ? `Review ${selectedCount} ${
                            selectedCount === 1 ? 'task' : 'tasks'
                          }`
                        : 'Review tasks'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 24,
  },
  content: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  brandName: {
    flexShrink: 1,
    marginRight: 12,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.6,
    color: colors.text,
  },
  brandAccent: {
    color: colors.primary,
  },
  stepBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
  },
  stepText: {
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '600',
    color: colors.primary,
  },
  progressTrack: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  previousStep: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginRight: 6,
  },
  currentStep: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },

  header: {
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 10,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: colors.primary,
    marginBottom: 12,
  },
  title: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '600',
    letterSpacing: -1.2,
    color: colors.text,
  },
  titleAccent: {
    color: colors.primary,
  },
  subtitle: {
    marginTop: 13,
    fontSize: 14,
    lineHeight: 23,
    color: colors.textMuted,
    maxWidth: 410,
  },

  searchContainer: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    backgroundColor: colors.surface,
    paddingLeft: 16,
  },
  searchFocused: {
    borderColor: colors.borderFocus,
    backgroundColor: colors.primarySoft,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 11,
  },
  searchCircle: {
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 1.7,
    borderColor: colors.textMuted,
  },
  searchHandle: {
    position: 'absolute',
    width: 7,
    height: 1.7,
    borderRadius: 1,
    backgroundColor: colors.textMuted,
    transform: [{ rotate: '45deg' }],
    left: 11,
    top: 13,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 16,
    paddingRight: 8,
    fontSize: 14,
    color: colors.text,
  },
  clearButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 13,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  filterRow: {
    paddingTop: 14,
    paddingBottom: 18,
    paddingRight: 8,
  },
  filterChip: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 11,
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
    color: colors.textMuted,
  },
  filterTextActive: {
    color: colors.textOnPrimary,
  },
  resultsText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
    marginBottom: 22,
  },

  categorySection: {
    marginBottom: 22,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 9,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: colors.text,
  },
  categoryCount: {
    marginLeft: 10,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 17,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 9,
  },
  taskRowSelected: {
    borderColor: colors.selectedBorder,
    backgroundColor: colors.selectedBackground,
  },
  taskRowPressed: {
    opacity: 0.75,
  },
  taskInfo: {
    flex: 1,
    paddingRight: 16,
  },
  taskName: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    color: colors.text,
  },
  taskNameSelected: {
    color: colors.primary,
  },
  taskDescription: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    width: 6,
    height: 11,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.white,
    transform: [{ rotate: '45deg' }],
    marginTop: -3,
  },

  reviewSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    padding: 16,
    marginBottom: 26,
  },
  reviewNumber: {
    minWidth: 48,
    minHeight: 48,
    padding: 8,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginRight: 13,
  },
  reviewNumberText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.primary,
  },
  reviewSummaryContent: {
    flex: 1,
  },
  reviewSummaryTitle: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: colors.primary,
  },
  reviewSummaryDescription: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
  editButton: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    textDecorationLine: 'underline',
  },

  statePanel: {
    paddingHorizontal: 22,
    paddingVertical: 32,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  stateTitle: {
    marginTop: 14,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  stateDescription: {
    marginTop: 9,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
  },
  secondaryButton: {
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 13,
    marginTop: 18,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },

  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bottomContent: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  selectionSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  selectionCount: {
    fontSize: 13,
    lineHeight: 21,
    fontWeight: '600',
    color: colors.text,
    marginRight: 12,
  },
  selectionHint: {
    fontSize: 12,
    lineHeight: 21,
    color: colors.textMuted,
  },
  primaryButton: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  primaryButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  primaryButtonText: {
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.textOnPrimary,
  },
  primaryButtonTextDisabled: {
    color: colors.textDisabled,
  },
  buttonSpinner: {
    marginRight: 10,
  },
  saveError: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.error,
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.65,
  },
});

export default TaskSelectionScreen;