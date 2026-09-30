import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

const OnboardingScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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

          {/* Decorative illustration built with native views */}
          <View
            style={styles.illustration}
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <View style={styles.outerCircle} />
            <View style={styles.innerCircle} />
            <View style={styles.sun} />

            <View style={styles.house}>
              <View style={styles.roof} />

              <View style={styles.houseBody}>
                <View style={styles.windowRow}>
                  <View style={styles.window}>
                    <View style={styles.windowVertical} />
                    <View style={styles.windowHorizontal} />
                  </View>

                  <View style={styles.window}>
                    <View style={styles.windowVertical} />
                    <View style={styles.windowHorizontal} />
                  </View>
                </View>

                <View style={styles.door}>
                  <View style={styles.doorHandle} />
                </View>
              </View>
            </View>

            <View style={styles.groundLine} />

            <View style={styles.taskNote}>
              <View style={styles.noteCheck}>
                <View style={styles.checkmark} />
              </View>
              <View style={styles.noteLines}>
                <View style={styles.noteLineLong} />
                <View style={styles.noteLineShort} />
              </View>
            </View>

            <View style={styles.smallNote}>
              <View style={styles.smallNoteDot} />
              <View style={styles.smallNoteLine} />
            </View>

            <View style={styles.decorativeDot} />
          </View>

          {/* Introduction */}
          <View style={styles.introduction}>
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowLine} />
              <Text style={styles.eyebrow}>YOUR EVERYDAY HELP, SIMPLIFIED</Text>
            </View>

            <Text style={styles.title}>
              Less on your list.{'\n'}
              <Text style={styles.titleAccent}>More time for life.</Text>
            </Text>

            <Text style={styles.subtitle}>
              Tell us what your household needs. Your dedicated Lifestyle
              Manager helps take care of the details.
            </Text>
          </View>

          {/* Service explanation */}
          <View style={styles.serviceNote}>
            <View style={styles.serviceIcon} accessible={false}>
              <View style={styles.personHead} />
              <View style={styles.personShoulders} />
            </View>

            <View style={styles.serviceText}>
              <Text style={styles.serviceTitle}>
                A personal point of contact
              </Text>
              <Text style={styles.serviceDescription}>
                Everyday support, built around your household.
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.footer}>
            <Pressable
              onPress={() => navigation.navigate('Register')}
              accessibilityRole="button"
              accessibilityLabel="Get started. Create an account."
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>Get started</Text>
              <View style={styles.buttonArrow} accessible={false} />
            </Pressable>

            <View style={styles.loginRow}>
              <Text style={styles.loginPrompt}>Already have an account?</Text>

              <Pressable
                onPress={() => navigation.navigate('Login')}
                accessibilityRole="button"
                accessibilityLabel="Sign in to your account"
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.loginLink}>Sign in</Text>
              </Pressable>
            </View>
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
    paddingTop: 24,
    paddingBottom: 16,
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
    marginBottom: 12,
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
  brandAccent: {
    color: colors.primary,
  },
  brandCaption: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },

  illustration: {
    height: 246,
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  outerCircle: {
    position: 'absolute',
    width: 226,
    height: 226,
    borderRadius: 113,
    borderWidth: 1,
    borderColor: colors.border,
  },
  innerCircle: {
    position: 'absolute',
    width: 196,
    height: 196,
    borderRadius: 98,
    backgroundColor: colors.primarySoft,
  },
  sun: {
    position: 'absolute',
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: colors.warmAccent,
    top: 35,
    right: '21%',
  },
  house: {
    position: 'absolute',
    width: 140,
    height: 153,
    bottom: 39,
    alignItems: 'center',
  },
  roof: {
    position: 'absolute',
    top: 5,
    width: 98,
    height: 98,
    borderRadius: 9,
    backgroundColor: colors.primary,
    transform: [{ rotate: '45deg' }],
  },
  houseBody: {
    position: 'absolute',
    bottom: 0,
    width: 130,
    height: 102,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  windowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 88,
    marginTop: 17,
  },
  window: {
    width: 26,
    height: 26,
    borderRadius: 5,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  windowVertical: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: colors.surface,
  },
  windowHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: colors.surface,
  },
  door: {
    position: 'absolute',
    bottom: 0,
    width: 29,
    height: 42,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    backgroundColor: colors.warmAccent,
  },
  doorHandle: {
    position: 'absolute',
    right: 5,
    top: 23,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  groundLine: {
    position: 'absolute',
    bottom: 37,
    width: 180,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.borderStrong,
  },
  taskNote: {
    position: 'absolute',
    left: 2,
    bottom: 62,
    width: 122,
    height: 58,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    transform: [{ rotate: '-7deg' }],
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  noteCheck: {
    width: 27,
    height: 27,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    marginRight: 10,
  },
  checkmark: {
    width: 6,
    height: 11,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.primary,
    transform: [{ rotate: '45deg' }],
    marginTop: -3,
  },
  noteLines: {
    flex: 1,
  },
  noteLineLong: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: 7,
  },
  noteLineShort: {
    width: '65%',
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  smallNote: {
    position: 'absolute',
    top: 78,
    right: 0,
    width: 84,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '8deg' }],
  },
  smallNoteDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.warmAccent,
    marginRight: 8,
  },
  smallNoteLine: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
  },
  decorativeDot: {
    position: 'absolute',
    top: 51,
    left: '14%',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  introduction: {
    marginTop: 6,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  eyebrowLine: {
    width: 22,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primary,
    marginRight: 9,
  },
  eyebrow: {
    flexShrink: 1,
    fontSize: 10,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: colors.primary,
  },
  title: {
    fontSize: 35,
    lineHeight: 43,
    fontWeight: '600',
    letterSpacing: -1.3,
    color: colors.text,
  },
  titleAccent: {
    color: colors.primary,
  },
  subtitle: {
    marginTop: 15,
    fontSize: 15,
    lineHeight: 24,
    color: colors.textMuted,
    maxWidth: 390,
  },

  serviceNote: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 24,
    marginBottom: 26,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  serviceIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  personHead: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginBottom: 3,
  },
  personShoulders: {
    width: 18,
    height: 9,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: colors.primary,
  },
  serviceText: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.text,
  },
  serviceDescription: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 19,
    color: colors.textMuted,
  },

  footer: {
    marginTop: 'auto',
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 16,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    color: colors.textOnPrimary,
    textAlign: 'center',
  },
  buttonArrow: {
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: colors.textOnPrimary,
    transform: [{ rotate: '45deg' }],
    marginLeft: 13,
  },
  loginRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  loginPrompt: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
  loginButton: {
    minHeight: 48,
    paddingHorizontal: 8,
    justifyContent: 'center',
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

export default OnboardingScreen;
