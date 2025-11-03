import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MemberRow() {
  return (
    <View style={styles.row}>
      <Text>MemberRow (placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
});


