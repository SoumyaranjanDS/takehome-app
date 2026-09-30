import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
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

const FormField = ({
  label,
  error,
  hint,
  inputRef,
  secureTextEntry = false,
  editable = true,
  ...inputProps
}) => {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.inputContainer,
          focused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        <TextInput
          {...inputProps}
          ref={inputRef}
          accessibilityLabel={label}
          accessibilityHint={error || hint}
          style={styles.input}
          placeholderTextColor={colors.textSubtle}
          selectionColor={colors.primary}
          autoCapitalize="none"
          autoCorrect={false}
          editable={editable}
          secureTextEntry={secureTextEntry && !visible}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {secureTextEntry && (
          <Pressable
            onPress={() => setVisible(current => !current)}
            accessibilityRole="button"
            accessibilityLabel={
              visible
                ? `Hide ${label.toLowerCase()}`
                : `Show ${label.toLowerCase()}`
            }
            style={({ pressed }) => [
              styles.visibilityButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.visibilityText}>
              {visible ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        )}
      </View>

      {!!(error || hint) && (
        <Text
          style={[styles.fieldHint, error && styles.errorText]}
          accessibilityLiveRegion={error ? 'polite' : 'none'}
        >
          {error || hint}
        </Text>
      )}
    </View>
  );
};

const RegisterScreen = ({ navigation }) => {
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const submittingRef = useRef(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field, setter) => value => {
    setter(value);

    setErrors(current => ({
      ...current,
      [field]: undefined,
      ...(field === 'password' ? { confirmPassword: undefined } : {}),
      form: undefined,
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (password.length < 6) {
      nextErrors.password = 'Use at least 6 characters.';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Enter your password again.';
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Your passwords don’t match.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRegister = async () => {
    if (submittingRef.current || !validate()) return;

    submittingRef.current = true;
    setIsLoading(true);

    const normalizedEmail = email.trim();

    try {
      await api.post('/auth/register', {
        email: normalizedEmail,
        password,
      });

      navigation.navigate('Verify', { email: normalizedEmail });
    } catch (err) {
      const serverMessage = err.response?.data?.error;

      const message =
        typeof serverMessage === 'string' && serverMessage.trim()
          ? serverMessage
          : !err.response
          ? 'We couldn’t connect. Check your connection and try again.'
          : 'We couldn’t create your account. Please try again.';

      setErrors(current => ({ ...current, form: message }));
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === 'ios' ? 'interactive' : 'on-drag'
          }
        >
          <View style={styles.content}>
            {/* Text-based brand treatment; no external assets required. */}
            <View style={styles.brandRow}>
              <View style={styles.brandMark} accessible={false}>
                <Text style={styles.brandInitial}>p</Text>
                <View style={styles.brandDot} />
              </View>

              <View>
                <Text style={styles.brandName}>
                  Padosi<Text style={styles.brandNameAccent}>Pro</Text>
                </Text>
                <Text style={styles.brandCaption}>Everyday, made easier.</Text>
              </View>
            </View>

            <View style={styles.header}>
              <View style={styles.eyebrowRow}>
                <View style={styles.eyebrowLine} />
                <Text style={styles.eyebrow}>A HELPING HAND, EVERY DAY</Text>
              </View>

              <Text style={styles.title}>
                A little less{'\n'}
                <Text style={styles.titleAccent}>on your plate.</Text>
              </Text>

              
            </View>

            <View style={styles.form}>
              <View style={styles.formHeading}>
                <Text style={styles.formTitle}>Create your account</Text>
                <Text style={styles.formSubtitle}>
                  Start with your email and a password.
                </Text>
              </View>

              <FormField
                label="Email address"
                placeholder="you@example.com"
                value={email}
                onChangeText={updateField('email', setEmail)}
                error={errors.email}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                editable={!isLoading}
              />

              <FormField
                label="Password"
                placeholder="Create a password"
                inputRef={passwordRef}
                value={password}
                onChangeText={updateField('password', setPassword)}
                error={errors.password}
                hint="Use at least 6 characters."
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                editable={!isLoading}
              />

              <FormField
                label="Confirm password"
                placeholder="Enter your password again"
                inputRef={confirmPasswordRef}
                value={confirmPassword}
                onChangeText={updateField(
                  'confirmPassword',
                  setConfirmPassword,
                )}
                error={errors.confirmPassword}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                editable={!isLoading}
              />

              {!!errors.form && (
                <View style={styles.errorBanner}>
                  <Text
                    style={styles.errorBannerText}
                    accessibilityRole="alert"
                    accessibilityLiveRegion="polite"
                  >
                    {errors.form}
                  </Text>
                </View>
              )}

              <Pressable
                onPress={handleRegister}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityState={{
                  disabled: isLoading,
                  busy: isLoading,
                }}
                style={({ pressed }) => [
                  styles.registerButton,
                  pressed && !isLoading && styles.registerButtonPressed,
                  isLoading && styles.registerButtonLoading,
                ]}
              >
                {isLoading && (
                  <ActivityIndicator
                    size="small"
                    color={colors.textOnPrimary}
                    style={styles.buttonSpinner}
                  />
                )}

                <Text style={styles.registerButtonText}>
                  {isLoading ? 'Creating your account…' : 'Create account'}
                </Text>
              </Pressable>

              <Text style={styles.verificationNote}>
                Next, we’ll send a code to verify your email.
              </Text>
            </View>

            <View style={styles.footer}>
              <View style={styles.footerDivider} />

              <View style={styles.loginRow}>
                <Text style={styles.loginText}>Already have an account?</Text>
                <Pressable
                  onPress={() => navigation.navigate('Login')}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Sign in to your account"
                  accessibilityState={{ disabled: isLoading }}
                  style={({ pressed }) => [
                    styles.loginButton,
                    pressed && styles.pressed,
                    isLoading && styles.pressed,
                  ]}
                >
                  <Text style={styles.loginLink}>Sign in</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
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
    paddingTop: 24,
    paddingBottom: 24,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 36,
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brandInitial: {
    color: colors.white,
    fontSize: 31,
    lineHeight: 36,
    fontWeight: '600',
    marginTop: -4,
  },
  brandDot: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.warmAccent,
    right: 8,
    top: 9,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.6,
    color: colors.text,
  },
  brandNameAccent: {
    color: colors.primary,
  },
  brandCaption: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },

  header: {
    marginBottom: 32,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  eyebrowLine: {
    width: 22,
    height: 2,
    borderRadius: 1,
    marginRight: 9,
    backgroundColor: colors.primary,
  },
  eyebrow: {
    flexShrink: 1,
    fontSize: 10,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 1.4,
    color: colors.primary,
  },
  title: {
    fontSize: 36,
    lineHeight: 43,
    fontWeight: '600',
    letterSpacing: -1.3,
    color: colors.text,
  },
  titleAccent: {
    color: colors.primary,
  },
  subtitle: {
    marginTop: 14,
    maxWidth: 355,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textMuted,
  },

  form: {
    width: '100%',
  },
  formHeading: {
    marginBottom: 22,
  },
  formTitle: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '600',
    letterSpacing: -0.4,
    color: colors.text,
  },
  formSubtitle: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.inputBackground,
  },
  inputFocused: {
    borderColor: colors.borderFocus,
    backgroundColor: colors.primarySoft,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: colors.errorSoft,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: colors.text,
  },
  visibilityButton: {
    minWidth: 56,
    minHeight: 48,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visibilityText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  fieldHint: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textMuted,
  },
  errorText: {
    color: colors.error,
  },
  errorBanner: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.errorSoft,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.error,
  },

  registerButton: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  registerButtonPressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.99 }],
  },
  registerButtonLoading: {
    opacity: 0.85,
  },
  buttonSpinner: {
    marginRight: 10,
  },
  registerButtonText: {
    flexShrink: 1,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.textOnPrimary,
  },
  verificationNote: {
    marginTop: 12,
    paddingHorizontal: 8,
    fontSize: 12,
    lineHeight: 19,
    color: colors.textMuted,
    textAlign: 'center',
  },

  footer: {
    marginTop: 28,
  },
  footerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  loginRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
  loginButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  pressed: {
    opacity: 0.65,
  },
});

export default RegisterScreen;
