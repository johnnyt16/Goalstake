import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StatCard() {
  return (
    <View style={styles.card}>
      <Text>StatCard (placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12 },
});


