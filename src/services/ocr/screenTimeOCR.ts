import TextRecognition from '@react-native-ml-kit/text-recognition';
import { AppUsage } from '../../types/usage';

export interface ScreenTimeData {
  dailyMinutes: number;
  weeklyMinutes?: number;
  dailyAverage?: number;
  appUsage: AppUsage[];
}

/**
 * Processes a screen time screenshot and extracts usage data
 * @param imageUri - URI of the screenshot from image picker
 * @returns Parsed screen time data
 */
export async function processScreenTimeScreenshot(
  imageUri: string
): Promise<ScreenTimeData> {
  try {
    // Run OCR on the image
    const result = await TextRecognition.recognize(imageUri);
    const text = result.text;

    // Parse the OCR text
    return parseScreenTimeText(text);
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to process screenshot. Please try again.');
  }
}

/**
 * Parses OCR text to extract screen time data
 * Supports iOS Settings app format
 */
function parseScreenTimeText(text: string): ScreenTimeData {
  const lines = text.split('\n').map(line => line.trim());

  const result: ScreenTimeData = {
    dailyMinutes: 0,
    appUsage: [],
  };

  // Pattern 1: Look for "X h Y m" or "X hours Y minutes" format (iOS)
  const timePatternHoursMinutes = /(\d+)\s*h(?:ours?)?\s*(\d+)\s*m(?:in(?:utes?)?)?/i;
  const timePatternHoursOnly = /(\d+)\s*h(?:ours?)?/i;
  const timePatternMinutesOnly = /(\d+)\s*m(?:in(?:utes?)?)?/i;

  // Pattern 2: Look for weekly total - "Last 7 Days" or "This Week"
  const weeklyPattern = /(?:last\s*7\s*days?|this\s*week|weekly)/i;

  // Track if we're in the weekly section or daily section
  let inWeeklySection = false;
  let inDailySection = false;

  // Look for section headers
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect section changes
    if (weeklyPattern.test(line)) {
      inWeeklySection = true;
      inDailySection = false;
      continue;
    }

    if (/today|daily average/i.test(line)) {
      inDailySection = true;
      inWeeklySection = false;
      continue;
    }

    // Extract time values
    let hours = 0;
    let minutes = 0;

    const matchHM = line.match(timePatternHoursMinutes);
    const matchH = line.match(timePatternHoursOnly);
    const matchM = line.match(timePatternMinutesOnly);

    if (matchHM) {
      hours = parseInt(matchHM[1], 10);
      minutes = parseInt(matchHM[2], 10);
    } else if (matchH) {
      hours = parseInt(matchH[1], 10);
    } else if (matchM) {
      minutes = parseInt(matchM[1], 10);
    }

    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes > 0) {
      // Check if this is an app-specific line (has app name before time)
      const appMatch = line.match(/^([A-Za-z\s]+?)\s+\d+/);

      if (appMatch && appMatch[1].trim().length > 0) {
        // This looks like an app usage line
        const appName = appMatch[1].trim();

        // Filter out common non-app words
        const excludedWords = ['screen', 'time', 'daily', 'average', 'total', 'week', 'today', 'yesterday'];
        const isLikelyApp = !excludedWords.some(word =>
          appName.toLowerCase().includes(word)
        );

        if (isLikelyApp && appName.length > 1) {
          result.appUsage.push({
            appName,
            minutesUsed: totalMinutes,
          });
        }
      } else if (inWeeklySection) {
        // Weekly total
        result.weeklyMinutes = totalMinutes;
      } else if (inDailySection || /today/i.test(line)) {
        // Daily total
        result.dailyMinutes = totalMinutes;
      }
    }

    // Look for "daily average" explicitly
    if (/daily\s*average/i.test(line) && totalMinutes > 0) {
      result.dailyAverage = totalMinutes;
    }
  }

  // If we didn't find a daily total but have a weekly total, calculate average
  if (result.dailyMinutes === 0 && result.weeklyMinutes && result.weeklyMinutes > 0) {
    result.dailyAverage = Math.round(result.weeklyMinutes / 7);
    result.dailyMinutes = result.dailyAverage;
  }

  // If we only found app usage but no total, calculate from apps
  if (result.dailyMinutes === 0 && result.appUsage.length > 0) {
    result.dailyMinutes = result.appUsage.reduce(
      (sum, app) => sum + app.minutesUsed,
      0
    );
  }

  // Sort apps by usage (highest first)
  result.appUsage.sort((a, b) => b.minutesUsed - a.minutesUsed);

  // Validate we got something useful
  if (result.dailyMinutes === 0 && result.appUsage.length === 0) {
    throw new Error(
      'Could not extract screen time data. Please ensure the screenshot shows your screen time statistics clearly.'
    );
  }

  return result;
}

/**
 * Formats minutes into a human-readable string
 */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}
