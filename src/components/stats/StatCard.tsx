import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export default function StatCard() {
  return (
    <View style={styles.card}>
      <Text>StatCard (placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12 },
});


