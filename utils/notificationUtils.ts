import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

// Configure how notifications are handled when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Setup Android channel
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#D4A853',
  });
}

export async function requestNotificationPermissions() {
  if (Platform.OS === 'web') return true;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

export async function scheduleKakeiboReminders(
  weeklyHour = 20, 
  weeklyMinute = 0, 
  weeklyDay = 1,
  monthlyHour = 9, 
  monthlyMinute = 0,
  monthlyDate = 1
) {
  // Notifications are currently only supported on native mobile devices for this app
  if (Platform.OS === 'web') {
    return { success: false, error: "Web not supported" };
  }

  try {
    // 0. Ensure channel exists (especially for Android)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D4A853',
      });
    }

    // 1. Cancel existing
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 2. Weekly Reminder
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "📓 Weekly Reflection Time",
          body: "The week is ending. Take 5 minutes to review your spending and reset for next week.",
          data: { screen: 'weekly' },
          priority: 'high',
          channelId: 'default',
        },
        trigger: {
          weekday: weeklyDay,
          hour: weeklyHour,
          minute: weeklyMinute,
          repeats: true,
        } as Notifications.NotificationTriggerInput,
      });
    } catch (e: any) {
      console.error("Failed to schedule weekly reminder:", e);
      throw e;
    }

    // 3. Monthly Reminder
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "💰 Monthly Review",
          body: "A new month has begun! Reflect on your savings goals and answer the Kakeibo questions.",
          data: { screen: 'monthly' },
          priority: 'high',
          channelId: 'default',
        },
        trigger: {
          day: monthlyDate,
          hour: monthlyHour,
          minute: monthlyMinute,
          repeats: true,
        } as Notifications.NotificationTriggerInput,
      });
    } catch (e: any) {
      console.error("Failed to schedule monthly reminder:", e);
      throw e;
    }

    console.log(`Kakeibo reminders scheduled: Weekly Day ${weeklyDay} at ${weeklyHour}:${String(weeklyMinute).padStart(2, '0')}, Monthly Date ${monthlyDate} at ${monthlyHour}:${String(monthlyMinute).padStart(2, '0')}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error scheduling notifications:", error);
    let errorMsg = error?.message || String(error);
    
    // Check for specific Android alarm permissions error
    if (errorMsg.includes("SCHEDULE_EXACT_ALARM") || errorMsg.includes("exact alarm")) {
      return { 
        success: false, 
        error: "Exact Alarm Permission Denied",
        details: "The app requires 'Alarms & Reminders' permission to schedule your reviews at exact times. Please enable it in Android settings."
      };
    }
    
    return { success: false, error: errorMsg };
  }
}

export async function cancelKakeiboReminders() {
  if (Platform.OS === 'web') return true;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("Kakeibo reminders canceled.");
    return true;
  } catch (error) {
    console.error("Error canceling notifications:", error);
    return false;
  }
}
