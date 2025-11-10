import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  processScreenTimeScreenshot,
  ScreenTimeData,
} from '../../services/ocr/screenTimeOCR';

interface ScreenshotUploaderProps {
  onDataExtracted: (data: ScreenTimeData) => void;
  buttonText?: string;
}

export function ScreenshotUploader({
  onDataExtracted,
  buttonText = 'Upload Screen Time Screenshot',
}: ScreenshotUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePickImage = async () => {
    try {
      // Request permissions
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload screenshots.'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled) {
        return;
      }

      // Process the screenshot
      setIsProcessing(true);

      const imageUri = result.assets[0].uri;
      const data = await processScreenTimeScreenshot(imageUri);

      // Success! Pass data back to parent
      onDataExtracted(data);

      Alert.alert(
        'Success!',
        `Extracted screen time data: ${Math.floor(data.dailyMinutes / 60)}h ${data.dailyMinutes % 60}m` +
          (data.appUsage.length > 0
            ? `\nFound ${data.appUsage.length} apps`
            : '')
      );
    } catch (error) {
      console.error('Screenshot processing error:', error);
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Failed to process screenshot. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, isProcessing && styles.buttonDisabled]}
        onPress={handlePickImage}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.buttonText}>Processing...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>{buttonText}</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.helpText}>
        Take a screenshot of your Screen Time from Settings and upload it here
        for automatic tracking
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
