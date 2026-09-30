import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';

const AnimatedButton = ({ onPress, title, loading, variant = 'primary', style, textStyle, disabled }) => {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primaryButton : styles.secondaryButton,
        (loading || disabled) && styles.disabledButton,
        pressed && styles.pressed,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.white : colors.primary} />
      ) : (
        <Text style={[
          styles.text,
          isPrimary ? styles.primaryText : styles.secondaryText,
          textStyle
        ]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48, // Standard SaaS height
    borderRadius: 6, // Crisp edges
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  disabledButton: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.text,
  }
});

export default AnimatedButton;
