import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
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

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

const getErrorMessage = (err, fallback) => {
  const message = err.response?.data?.error;

  return typeof message === 'string' && message.trim()
    ? message
    : !err.response
    ? 'We couldn’t connect. Check your connection and try again.'
    : fallback;
};

const VerifyScreen = ({ route, navigation }) => {
  const email =
    typeof route.params?.email === 'string' ? route.params.email.trim() : '';

  const inputRef = useRef(null);
  const mountedRef = useRef(false);
  const requestRef = useRef(false);
  const resendAtRef = useRef(Date.now() + RESEND_SECONDS * 1000);

  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [isFocused, setIsFocused] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [resendError, setResendError] = useState('');
  const [notice, setNotice] = useState('');

  const busy = isVerifying || isResending;

  useEffect(() => {
    mountedRef.current = true;

    const updateCountdown = () => {
      setCountdown(
        Math.max(0, Math.ceil((resendAtRef.current - Date.now()) / 1000)),
      );
    };

    updateCountdown();

    const timer = setInterval(updateCountdown, 1000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') updateCountdown();
    });

    return () => {
      mountedRef.current = false;
      clearInterval(timer);
      subscription.remove();
    };
  }, []);

  const handleCodeChange = text => {
    setCode(text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH));
    setCodeError('');
    setNotice('');
  };

  const handleVerify = async () => {
    if (requestRef.current || !email) return;

    if (code.length !== OTP_LENGTH) {
      setCodeError('Enter the complete 6-digit code.');
      inputRef.current?.focus();
      return;
    }

    requestRef.current = true;
    setIsVerifying(true);
    setCodeError('');
    setResendError('');
    setNotice('');

    try {
      await api.post('/auth/verify-otp', {
        email,
        otp: code,
      });

      if (mountedRef.current) {
        navigation.navigate('Login');
      }
    } catch (err) {
      if (mountedRef.current) {
        setCodeError(
          getErrorMessage(
            err,
            'We couldn’t verify this code. Check it or request a new one.',
          ),
        );
      }
    } finally {
      requestRef.current = false;

      if (mountedRef.current) {
        setIsVerifying(false);
      }
    }
  };

  const handleResend = async () => {
    if (requestRef.current || !email || Date.now() < resendAtRef.current) {
      return;
    }

    requestRef.current = true;
    setIsResending(true);
    setResendError('');
    setNotice('');

    try {
      await api.post('/auth/resend-otp', { email });

      if (!mountedRef.current) return;

      resendAtRef.current = Date.now() + RESEND_SECONDS * 1000;
      setCountdown(RESEND_SECONDS);
      setCode('');
      setCodeError('');
      setNotice('A new code has been sent. Check your inbox.');
    } catch (err) {
      if (!mountedRef.current) return;

      // Respect a numeric Retry-After header if the server provides it.
      const retryAfter = Number(err.response?.headers?.['retry-after']);

      if (Number.isFinite(retryAfter) && retryAfter > 0) {
        resendAtRef.current = Date.now() + retryAfter * 1000;
        setCountdown(Math.ceil(retryAfter));
      }

      setResendError(
        getErrorMessage(err, 'We couldn’t resend the code. Please try again.'),
      );
    } finally {
      requestRef.current = false;

      if (mountedRef.current) {
        setIsResending(false);
      }
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
            {/* Brand */}
            <View style={styles.brandRow}>
              <View style={styles.brandMark} accessible={false}>
                <Text style={styles.brandInitial}>p</Text>
                <View style={styles.brandDot} />
              </View>

              <View>
                <Text style={styles.brandName}>
                  Padosi<Text style={styles.brandAccent}>Pro</Text>
                </Text>
                <Text style={styles.brandCaption}>Everyday, made easier.</Text>
              </View>
            </View>

            {/* Decorative email symbol */}
            <View
              style={styles.mailBadge}
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <View style={styles.envelope}>
                <View style={styles.envelopeFlap} />
              </View>
              <View style={styles.mailDot} />
            </View>

            <View style={styles.header}>
              <Text style={styles.eyebrow}>VERIFY YOUR EMAIL</Text>

              <Text style={styles.title}>
                A quick check,{'\n'}
                <Text style={styles.titleAccent}>then you’re in.</Text>
              </Text>

              <Text style={styles.subtitle}>
                {email
                  ? 'Enter the 6-digit verification code sent to'
                  : 'Your email address is missing. Return to registration to continue.'}
              </Text>

              {!!email && <Text style={styles.email}>{email}</Text>}
            </View>

            {email ? (
              <>
                <View style={styles.codeHeading}>
                  <Text style={styles.codeLabel}>Verification code</Text>
                  <Text style={styles.codeHint}>6 digits</Text>
                </View>

                {/*
                  One real input handles typing, pasting and autofill.
                  The boxes are decorative; accessibility uses the input.
                */}
                <Pressable 
                  style={styles.codeInputContainer}
                  onPress={() => inputRef.current?.focus()}
                >
                  <View
                    style={styles.otpRow}
                    pointerEvents="none"
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  >
                    {Array.from({ length: OTP_LENGTH }, (_, index) => {
                      const character = code[index] || '';
                      const active =
                        isFocused &&
                        !busy &&
                        index === Math.min(code.length, OTP_LENGTH - 1);

                      return (
                        <View
                          key={index}
                          style={[
                            styles.otpBox,
                            index < OTP_LENGTH - 1 && styles.otpBoxSpacing,
                            !!character && styles.otpBoxFilled,
                            active && styles.otpBoxFocused,
                            !!codeError && styles.otpBoxError,
                          ]}
                        >
                          <Text style={styles.otpDigit}>{character}</Text>
                          {!character && active && (
                            <View style={styles.activeDash} />
                          )}
                        </View>
                      );
                    })}
                  </View>

                  <TextInput
                    ref={inputRef}
                    value={code}
                    onChangeText={handleCodeChange}
                    style={styles.codeInput}
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    autoComplete={
                      Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    caretHidden
                    selectionColor="transparent"
                    editable={!busy}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onSubmitEditing={handleVerify}
                    returnKeyType="done"
                    accessibilityLabel="Six-digit email verification code"
                    accessibilityHint={
                      codeError || 'Type or paste the code from your email.'
                    }
                  />
                </Pressable>

                {!!codeError && (
                  <Text
                    style={styles.errorText}
                    accessibilityRole="alert"
                    accessibilityLiveRegion="polite"
                  >
                    {codeError}
                  </Text>
                )}

                <Text style={styles.inputHelp}>
                  You can paste the full code from your email.
                </Text>

                <Pressable
                  onPress={handleVerify}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityState={{
                    disabled: busy,
                    busy: isVerifying,
                  }}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && !busy && styles.primaryButtonPressed,
                    busy && styles.pressed,
                  ]}
                >
                  {isVerifying && (
                    <ActivityIndicator
                      size="small"
                      color={colors.textOnPrimary}
                      style={styles.buttonSpinner}
                    />
                  )}

                  <Text style={styles.primaryButtonText}>
                    {isVerifying ? 'Verifying your email…' : 'Verify email'}
                  </Text>
                </Pressable>

                {/* Resend */}
                <View style={styles.resendSection}>
                  <Text style={styles.resendPrompt}>Haven’t received it?</Text>

                  <Pressable
                    onPress={handleResend}
                    disabled={countdown > 0 || busy}
                    accessibilityRole="button"
                    accessibilityLabel={
                      countdown > 0
                        ? `Resend code available in ${countdown} seconds`
                        : 'Resend verification code'
                    }
                    accessibilityState={{
                      disabled: countdown > 0 || busy,
                      busy: isResending,
                    }}
                    style={({ pressed }) => [
                      styles.resendButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    {isResending && (
                      <ActivityIndicator
                        size="small"
                        color={colors.primary}
                        style={styles.buttonSpinner}
                      />
                    )}

                    <Text
                      style={[
                        styles.resendLink,
                        (countdown > 0 || busy) && styles.resendDisabled,
                      ]}
                    >
                      {isResending
                        ? 'Sending a new code…'
                        : countdown > 0
                        ? `Resend in ${countdown}s`
                        : 'Resend code'}
                    </Text>
                  </Pressable>
                </View>

                {!!resendError && (
                  <Text
                    style={styles.resendError}
                    accessibilityRole="alert"
                    accessibilityLiveRegion="polite"
                  >
                    {resendError}
                  </Text>
                )}

                {!!notice && (
                  <View style={styles.notice}>
                    <Text
                      style={styles.noticeText}
                      accessibilityLiveRegion="polite"
                    >
                      {notice}
                    </Text>
                  </View>
                )}

                <View style={styles.helpNote}>
                  <View style={styles.helpAccent} />
                  <View style={styles.helpContent}>
                    <Text style={styles.helpTitle}>Check your spam folder</Text>
                    <Text style={styles.helpText}>
                      Delivery can take a moment. If you request another code,
                      use the most recent email.
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <Pressable
                onPress={() => navigation.navigate('Register')}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.primaryButtonPressed,
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  Back to registration
                </Text>
              </Pressable>
            )}

            <View style={styles.footer}>
              <View style={styles.footerDivider} />

              <Pressable
                onPress={() => navigation.navigate('Login')}
                disabled={busy}
                accessibilityRole="button"
                accessibilityState={{ disabled: busy }}
                style={({ pressed }) => [
                  styles.loginButton,
                  (pressed || busy) && styles.pressed,
                ]}
              >
                <Text style={styles.loginLink}>Back to sign in</Text>
              </Pressable>
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
    marginBottom: 34,
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
    fontSize: 31,
    lineHeight: 36,
    fontWeight: '600',
    color: colors.white,
    marginTop: -4,
  },
  brandDot: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    right: 8,
    top: 9,
    backgroundColor: colors.warmAccent,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.6,
    color: colors.text,
  },
  brandAccent: {
    color: colors.primary,
  },
  brandCaption: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },

  mailBadge: {
    width: 76,
    height: 76,
    borderRadius: 25,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
  },
  envelope: {
    width: 34,
    height: 25,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    overflow: 'hidden',
  },
  envelopeFlap: {
    width: 23,
    height: 23,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.primary,
    transform: [{ rotate: '45deg' }],
    marginTop: -14,
  },
  mailDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    right: 10,
    top: 11,
    borderWidth: 3,
    borderColor: colors.primarySoft,
    backgroundColor: colors.primary,
  },

  header: {
    marginBottom: 30,
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
    marginTop: 15,
    fontSize: 14,
    lineHeight: 23,
    color: colors.textMuted,
  },
  email: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '600',
    color: colors.text,
  },

  codeHeading: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  codeLabel: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    color: colors.text,
    marginRight: 12,
  },
  codeHint: {
    fontSize: 12,
    lineHeight: 20,
    color: colors.textMuted,
  },
  codeInputContainer: {
    position: 'relative',
    minHeight: 60,
  },
  otpRow: {
    flexDirection: 'row',
  },
  otpBox: {
    flex: 1,
    minWidth: 0,
    minHeight: 60,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxSpacing: {
    marginRight: 7,
  },
  otpBoxFilled: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.borderStrong,
  },
  otpBoxFocused: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  otpBoxError: {
    borderColor: colors.error,
    backgroundColor: colors.errorSoft,
  },
  otpDigit: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '600',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  activeDash: {
    position: 'absolute',
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primary,
  },
  codeInput: {
    ...StyleSheet.absoluteFillObject,
    color: 'transparent',
    backgroundColor: 'transparent',
    fontSize: 23,
    padding: 0,
  },
  inputHelp: {
    fontSize: 12,
    lineHeight: 19,
    color: colors.textMuted,
    marginTop: 10,
    marginBottom: 24,
  },
  errorText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    color: colors.error,
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
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.textOnPrimary,
  },
  buttonSpinner: {
    marginRight: 10,
  },

  resendSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  resendPrompt: {
    fontSize: 13,
    lineHeight: 21,
    color: colors.textMuted,
  },
  resendButton: {
    minHeight: 48,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendLink: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  resendDisabled: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  resendError: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    color: colors.error,
    marginTop: 4,
  },
  notice: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.successSoft,
    marginTop: 8,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.success,
    textAlign: 'center',
  },

  helpNote: {
    flexDirection: 'row',
    marginTop: 28,
    marginBottom: 30,
  },
  helpAccent: {
    width: 3,
    borderRadius: 2,
    backgroundColor: colors.warmAccent,
    marginRight: 14,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.text,
  },
  helpText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 20,
    color: colors.textMuted,
  },

  footer: {
    marginTop: 'auto',
    paddingTop: 12,
  },
  footerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginBottom: 8,
  },
  loginButton: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loginLink: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: colors.primary,
  },
  pressed: {
    opacity: 0.65,
  },
});

export default VerifyScreen;
