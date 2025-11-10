import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import Card from '../../components/common/Card';
import PrimaryButton from '../../components/common/PrimaryButton';
import { supabase } from '../../services/supabase/client';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!supabase) {
      Alert.alert('Config', 'Supabase is not configured.');
      return;
    }
    if (!email || !password) {
      Alert.alert('Validation', 'Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (!name.trim()) {
          Alert.alert('Validation', 'Please enter your name.');
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        Alert.alert('Check your email', 'Please confirm your email to finish signup, then sign in.');
      }
    } catch (e: any) {
      Alert.alert('Auth error', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
          <Text style={styles.title}>Welcome to Goalstake</Text>
          <Card>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="you@example.com"
              returnKeyType="next"
            />
            <Text style={[styles.label, { marginTop: spacing.md }]}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              returnKeyType="done"
            />
          {mode === 'signup' ? (
            <>
              <Text style={[styles.label, { marginTop: spacing.md }]}>Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                returnKeyType="done"
              />
            </>
          ) : null}
            <PrimaryButton title={loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'} onPress={onSubmit} disabled={loading} />
            <Text
              style={styles.switch}
              onPress={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
            >
              {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </Text>
          </Card>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
  label: { color: colors.mutedText, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: colors.background,
    marginBottom: spacing.sm,
  },
  switch: {
    marginTop: spacing.md,
    color: colors.primary,
    fontWeight: '600',
  },
});


