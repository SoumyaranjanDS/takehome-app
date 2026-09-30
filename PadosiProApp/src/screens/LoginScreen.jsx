import React, { useContext, useRef, useState } from 'react';
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
import { AuthContext } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);

  const passwordRef = useRef(null);
  const submittingRef = useRef(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (field, setter) => value => {
    setter(value);
    setErrors(current => ({
      ...current,
      [field]: undefined,
      form: undefined,
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Enter your password.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async () => {
    if (submittingRef.current || !validate()) return;

    submittingRef.current = true;
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password,
      });

      const { token, hasProfile, hasTasks } = response.data;
      await login(token, hasProfile, hasTasks);
    } catch (err) {
      const serverMessage = err.response?.data?.error;

      const message =
        typeof serverMessage === 'string' && serverMessage.trim()
          ? serverMessage
          : !err.response
          ? 'We couldn’t connect. Check your connection and try again.'
          : 'We couldn’t sign you in. Please try again.';

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
            {/* Replace this placeholder mark with your official logo. */}
            <View style={styles.brandRow}>
              <View style={styles.brandMark} accessible={false}>
                <Text style={styles.brandInitial}>p</Text>
                <View style={styles.brandDot} />
              </View>

              <View>
                <Text style={styles.brandName}>
                  Padosi
                  <Text style={styles.brandNameAccent}>Pro</Text>
                </Text>
                <Text style={styles.brandCaption}>Everyday, made easier.</Text>
              </View>
            </View>

            <View style={styles.header}>
              <View style={styles.eyebrowRow}>
                <View style={styles.eyebrowLine} />
                <Text style={styles.eyebrow}>GOOD TO HAVE YOU BACK</Text>
              </View>

              <Text style={styles.title}>
                Your everyday,{'\n'}
                <Text style={styles.titleAccent}>a little easier.</Text>
              </Text>

              <Text style={styles.subtitle}>
                Sign in to pick up where you left off and manage the tasks you
                need help with.
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.formHeading}>
                <Text style={styles.formTitle}>Welcome back</Text>
                <Text style={styles.formSubtitle}>
                  Enter your details to continue.
                </Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Email address</Text>

                <View
                  style={[
                    styles.inputContainer,
                    focusedField === 'email' && styles.inputFocused,
                    errors.email && styles.inputError,
                  ]}
                >
                  <TextInput
                    value={email}
                    onChangeText={updateField('email', setEmail)}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.textSubtle}
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                    selectionColor={colors.primary}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    editable={!isLoading}
                    accessibilityLabel="Email address"
                    accessibilityHint={errors.email}
                  />
                </View>

                {!!errors.email && (
                  <Text
                    style={styles.fieldError}
                    accessibilityLiveRegion="polite"
                  >
                    {errors.email}
                  </Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>

                <View
                  style={[
                    styles.inputContainer,
                    focusedField === 'password' && styles.inputFocused,
                    errors.password && styles.inputError,
                  ]}
                >
                  <TextInput
                    ref={passwordRef}
                    value={password}
                    onChangeText={updateField('password', setPassword)}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textSubtle}
                    style={styles.input}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="current-password"
                    textContentType="password"
                    selectionColor={colors.primary}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    editable={!isLoading}
                    accessibilityLabel="Password"
                    accessibilityHint={errors.password}
                  />

                  <Pressable
                    onPress={() => setShowPassword(current => !current)}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    style={({ pressed }) => [
                      styles.visibilityButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.visibilityText}>
                      {showPassword ? 'Hide' : 'Show'}
                    </Text>
                  </Pressable>
                </View>

                {!!errors.password && (
                  <Text
                    style={styles.fieldError}
                    accessibilityLiveRegion="polite"
                  >
                    {errors.password}
                  </Text>
                )}
              </View>

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
                onPress={handleLogin}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityState={{
                  disabled: isLoading,
                  busy: isLoading,
                }}
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && !isLoading && styles.loginButtonPressed,
                  isLoading && styles.loginButtonLoading,
                ]}
              >
                {isLoading && (
                  <ActivityIndicator
                    size="small"
                    color={colors.textOnPrimary}
                    style={styles.buttonSpinner}
                  />
                )}

                <Text style={styles.loginButtonText}>
                  {isLoading ? 'Signing you in…' : 'Sign in'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.footer}>
              <View style={styles.footerDivider} />

              <View style={styles.registerRow}>
                <Text style={styles.registerText}>New to PadosiPro?</Text>

                <Pressable
                  onPress={() => navigation.navigate('Register')}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Create a PadosiPro account"
                  accessibilityState={{ disabled: isLoading }}
                  style={({ pressed }) => [
                    styles.registerLinkButton,
                    (pressed || isLoading) && styles.pressed,
                  ]}
                >
                  <Text style={styles.registerLink}>Create an account</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.closingNote}>
              <View style={styles.closingLine} />
              <Text style={styles.closingText}>
                Less to manage. More time for you.
              </Text>
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
    marginBottom: 40,
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
    marginBottom: 36,
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
    marginBottom: 24,
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
    marginBottom: 20,
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
  fieldError: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 18,
    color: colors.error,
  },
  errorBanner: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.errorSoft,
    marginBottom: 18,
  },
  errorBannerText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.error,
  },

  loginButton: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: colors.primary,
    marginTop: 8,
  },
  loginButtonPressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.99 }],
  },
  loginButtonLoading: {
    opacity: 0.85,
  },
  buttonSpinner: {
    marginRight: 10,
  },
  loginButtonText: {
    flexShrink: 1,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.textOnPrimary,
  },

  footer: {
    marginTop: 28,
  },
  footerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  registerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
  registerLinkButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  closingNote: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 36,
    paddingBottom: 8,
  },
  closingLine: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.warmAccent,
    marginBottom: 12,
  },
  closingText: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 19,
    color: colors.textMuted,
  },
  pressed: {
    opacity: 0.65,
  },
});

export default LoginScreen;
