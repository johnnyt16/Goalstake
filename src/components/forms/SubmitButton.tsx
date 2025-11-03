import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function SubmitButton() {
  return (
    <TouchableOpacity style={styles.button}>
      <Text style={styles.text}>Submit</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#3B82F6', borderRadius: 8 },
  text: { color: '#fff', fontWeight: '600', textAlign: 'center' },
});


