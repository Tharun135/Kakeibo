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

export async function requestNotificationPermissions() {
  if (!Device.isDevice) return false;
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
    console.warn("Local notification scheduling is not supported on web.");
    return false;
  }

  if (!Device.isDevice) return false;

  try {
    // 1. Cancel existing
    if (Notifications.cancelAllScheduledNotificationsAsync) {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }

    // 2. Weekly Reminder
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "📓 Weekly Reflection Time",
        body: "The week is ending. Take 5 minutes to review your spending and reset for next week.",
        data: { screen: 'weekly' },
      },
      trigger: {
        weekday: weeklyDay,
        hour: weeklyHour,
        minute: weeklyMinute,
        repeats: true,
      } as any,
    });

    // 3. Monthly Reminder
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "💰 Monthly Review",
        body: "A new month has begun! Reflect on your savings goals and answer the Kakeibo questions.",
        data: { screen: 'monthly' },
      },
      trigger: {
        day: monthlyDate,
        hour: monthlyHour,
        minute: monthlyMinute,
        repeats: true,
      } as any,
    });

    console.log(`Kakeibo reminders scheduled: Weekly Day ${weeklyDay} at ${weeklyHour}:${String(weeklyMinute).padStart(2, '0')}, Monthly Date ${monthlyDate} at ${monthlyHour}:${String(monthlyMinute).padStart(2, '0')}`);
    return true;
  } catch (error) {
    console.error("Error scheduling notifications:", error);
    return false;
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
