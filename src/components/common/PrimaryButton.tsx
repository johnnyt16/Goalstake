import React from 'react';
import { GestureResponderEvent, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

type Props = {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export default function PrimaryButton({ title, onPress, disabled, style }: Props) {
  return (
    <TouchableOpacity style={[styles.button, disabled && styles.disabled, style]} onPress={onPress} activeOpacity={0.8} disabled={disabled}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});


