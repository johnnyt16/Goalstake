import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

export default function TextField() {
  return (
    <View style={styles.container}>
      <Text>TextField (placeholder)</Text>
      <TextInput style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6 },
});


