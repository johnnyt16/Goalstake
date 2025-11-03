import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

export default function NumberField() {
  return (
    <View style={styles.container}>
      <Text>NumberField (placeholder)</Text>
      <TextInput keyboardType="numeric" style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6 },
});


