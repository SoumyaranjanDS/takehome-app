import React, { useState } from 'react';
import { TextInput, View, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

const AnimatedInput = ({ label, value, onChangeText, onBlur, onFocus, error, secureTextEntry, keyboardType }) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        error && styles.inputContainerError
      ]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize="none"
          placeholderTextColor={colors.textMuted}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 6,
  },
  inputContainer: {
    height: 48,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  inputContainerFocused: {
    borderColor: colors.primary,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 6,
  }
});

export default AnimatedInput;
