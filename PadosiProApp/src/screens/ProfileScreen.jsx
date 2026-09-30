import React, { useContext, useEffect, useRef, useState } from 'react';
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

const ProfileScreen = () => {
  const { completeProfile } = useContext(AuthContext);

  const phoneRef = useRef(null);
  const addressRef = useRef(null);
  const mountedRef = useRef(false);
  const savingRef = useRef(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const updateField = (field, setter) => value => {
    setter(value);
    setErrors(current => ({
      ...current,
      [field]: undefined,
      form: undefined,
    }));
  };

  const handlePhoneChange = value => {
    let digits = value.replace(/\D/g, '');

    // Accept a pasted number containing the Indian country code.
    if (digits.length === 12 && digits.startsWith('91')) {
      digits = digits.slice(2);
    } else if (digits.length === 11 && digits.startsWith('0')) {
      digits = digits.slice(1);
    }

    updateField('phone', setPhone)(digits.slice(0, 10));
  };

  const validate = () => {
    const nextErrors = {};

    if (!name.trim()) {
      nextErrors.name = 'Enter your full name.';
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      nextErrors.phone = 'Enter a valid 10-digit Indian mobile number.';
    }

    if (!address.trim()) {
      nextErrors.address = 'Enter your complete address.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (savingRef.current || !validate()) return;

    savingRef.current = true;
    setIsSaving(true);

    let profileSaved = false;

    try {
      await api.post('/user/profile', {
        name: name.trim(),
        address: address.trim(),
        mobile_number: phone,
      });

      profileSaved = true;
      await completeProfile();
    } catch (err) {
      if (!mountedRef.current) return;

      const serverMessage = err.response?.data?.error;

      const message = profileSaved
        ? 'Your profile was saved, but we couldn’t continue. Please try again.'
        : typeof serverMessage === 'string' && serverMessage.trim()
        ? serverMessage
        : !err.response
        ? 'We couldn’t connect. Your details are still here—check your connection and try again.'
        : 'We couldn’t save your profile. Please try again.';

      setErrors(current => ({ ...current, form: message }));
    } finally {
      savingRef.current = false;

      if (mountedRef.current) {
        setIsSaving(false);
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
            {/* Setup progress */}
            <View style={styles.topRow}>
              <Text style={styles.brandName}>
                Padosi<Text style={styles.brandAccent}>Pro</Text>
              </Text>

              <View style={styles.stepBadge}>
                <Text style={styles.stepText}>Step 1 of 2</Text>
              </View>
            </View>

            <View
              style={styles.progressTrack}
              accessible
              accessibilityLabel="Setup, step 1 of 2"
            >
              <View style={styles.currentStep} />
              <View style={styles.nextStep} />
            </View>

            {/* Introduction */}
            <View style={styles.header}>
              <Text style={styles.eyebrow}>LET’S MAKE IT PERSONAL</Text>

              <Text style={styles.title}>
                A little about you.{'\n'}
                <Text style={styles.titleAccent}>A better helping hand.</Text>
              </Text>

              <Text style={styles.subtitle}>
                Add your contact details and address so your Lifestyle Manager
                knows who they’re helping and where.
              </Text>
            </View>

            {/* Contact details */}
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Your details</Text>
              <Text style={styles.sectionCaption}>
                All fields are required.
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Full name</Text>

              <View
                style={[
                  styles.inputContainer,
                  focusedField === 'name' && styles.inputFocused,
                  errors.name && styles.inputError,
                ]}
              >
                <TextInput
                  value={name}
                  onChangeText={updateField('name', setName)}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.textSubtle}
                  style={styles.input}
                  autoCapitalize="words"
                  autoCorrect={false}
                  autoComplete="name"
                  textContentType="name"
                  selectionColor={colors.primary}
                  returnKeyType="next"
                  onSubmitEditing={() => phoneRef.current?.focus()}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  editable={!isSaving}
                  accessibilityLabel="Full name, required"
                  accessibilityHint={errors.name}
                />
              </View>

              {!!errors.name && (
                <Text
                  style={styles.fieldError}
                  accessibilityLiveRegion="polite"
                >
                  {errors.name}
                </Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Mobile number</Text>

              <View
                style={[
                  styles.inputContainer,
                  focusedField === 'phone' && styles.inputFocused,
                  errors.phone && styles.inputError,
                ]}
              >
                <View style={styles.phonePrefix} accessible={false}>
                  <Text style={styles.phonePrefixText}>+91</Text>
                </View>

                <View style={styles.phoneDivider} />

                <TextInput
                  ref={phoneRef}
                  value={phone}
                  onChangeText={handlePhoneChange}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={colors.textSubtle}
                  style={[styles.input, styles.phoneInput]}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  selectionColor={colors.primary}
                  returnKeyType="next"
                  onSubmitEditing={() => addressRef.current?.focus()}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                  editable={!isSaving}
                  accessibilityLabel="Indian mobile number, required"
                  accessibilityHint={
                    errors.phone ||
                    'Country code plus 91 is already included. Enter 10 digits.'
                  }
                />
              </View>

              <Text
                style={[
                  styles.fieldHint,
                  errors.phone && styles.fieldErrorColor,
                ]}
                accessibilityLiveRegion={errors.phone ? 'polite' : 'none'}
              >
                {errors.phone ||
                  'A number where you can be reached about your tasks.'}
              </Text>
            </View>

            {/* Address */}
            <View style={styles.sectionDivider} />

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Your address</Text>
              <Text style={styles.sectionCaption}>
                Where would you like help?
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Complete address</Text>

              <View
                style={[
                  styles.inputContainer,
                  styles.addressContainer,
                  focusedField === 'address' && styles.inputFocused,
                  errors.address && styles.inputError,
                ]}
              >
                <TextInput
                  ref={addressRef}
                  value={address}
                  onChangeText={updateField('address', setAddress)}
                  placeholder={
                    'House / flat number, building and street\nArea, city, state and PIN code'
                  }
                  placeholderTextColor={colors.textSubtle}
                  style={[styles.input, styles.addressInput]}
                  multiline
                  textAlignVertical="top"
                  autoCapitalize="sentences"
                  autoComplete="street-address"
                  textContentType="fullStreetAddress"
                  selectionColor={colors.primary}
                  onFocus={() => setFocusedField('address')}
                  onBlur={() => setFocusedField(null)}
                  editable={!isSaving}
                  accessibilityLabel="Complete address, required"
                  accessibilityHint={
                    errors.address ||
                    'Include your house or flat number, street, city, state and PIN code.'
                  }
                />
              </View>

              <Text
                style={[
                  styles.fieldHint,
                  errors.address && styles.fieldErrorColor,
                ]}
                accessibilityLiveRegion={errors.address ? 'polite' : 'none'}
              >
                {errors.address ||
                  'Include a nearby landmark if it helps locate your address.'}
              </Text>
            </View>

            {/* Next-step context */}
            <View style={styles.nextStepNote}>
              <View style={styles.nextStepIcon} accessible={false}>
                <Text style={styles.nextStepNumber}>2</Text>
              </View>

              <View style={styles.nextStepContent}>
                <Text style={styles.nextStepTitle}>
                  Next: choose your everyday help
                </Text>
                <Text style={styles.nextStepDescription}>
                  Pick the tasks you’d like your Lifestyle Manager to help with.
                </Text>
              </View>
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

            <View style={styles.footer}>
              <Pressable
                onPress={handleSave}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityState={{
                  disabled: isSaving,
                  busy: isSaving,
                }}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && !isSaving && styles.primaryButtonPressed,
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

                <Text style={styles.primaryButtonText}>
                  {isSaving ? 'Saving your details…' : 'Continue to tasks'}
                </Text>
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
    paddingTop: 22,
    paddingBottom: 28,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 460,
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
  currentStep: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginRight: 6,
  },
  nextStep: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.border,
  },

  header: {
    marginBottom: 30,
  },
  eyebrow: {
    fontSize: 10,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 1.4,
    color: colors.primary,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '600',
    letterSpacing: -1.1,
    color: colors.text,
  },
  titleAccent: {
    color: colors.primary,
  },
  subtitle: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 23,
    color: colors.textMuted,
  },

  sectionHeading: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: colors.text,
  },
  sectionCaption: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 19,
    color: colors.textMuted,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: 6,
    marginBottom: 24,
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
  phonePrefix: {
    paddingLeft: 16,
    paddingRight: 13,
    justifyContent: 'center',
  },
  phonePrefixText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  phoneDivider: {
    width: 1,
    height: 22,
    backgroundColor: colors.border,
  },
  phoneInput: {
    paddingLeft: 13,
  },
  addressContainer: {
    alignItems: 'flex-start',
  },
  addressInput: {
    minHeight: 130,
    lineHeight: 23,
  },
  fieldHint: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 19,
    color: colors.textMuted,
  },
  fieldError: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 19,
    color: colors.error,
  },
  fieldErrorColor: {
    color: colors.error,
  },

  nextStepNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    marginTop: 2,
    marginBottom: 24,
  },
  nextStepIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginRight: 12,
  },
  nextStepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  nextStepContent: {
    flex: 1,
  },
  nextStepTitle: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.text,
  },
  nextStepDescription: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 19,
    color: colors.textMuted,
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
  footer: {
    marginTop: 'auto',
    paddingTop: 4,
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
  pressed: {
    opacity: 0.65,
  },
});

export default ProfileScreen;
