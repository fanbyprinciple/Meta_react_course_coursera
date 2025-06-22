import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { task } from "./storage";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  let token: string | null = null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  try {
    const response = await Notifications.getExpoPushTokenAsync();
    token = response.data;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1a8e2d",
      });
    }

    return token;
  } catch (error) {
    console.error("Error getting push token:", error);
    return null;
  }
}

export async function scheduletaskReminder(
  task: task
): Promise<string | undefined> {
  if (!task.reminderEnabled) return;

  try {
    // Schedule notifications for each time
    for (const time of task.times) {
      const [hours, minutes] = time.split(":").map(Number);
      const today = new Date();
      today.setHours(hours, minutes, 0, 0);

      // If time has passed for today, schedule for tomorrow
      if (today < new Date()) {
        today.setDate(today.getDate() + 1);
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: "task Reminder",
          body: `Time for ${task.name}`,
          data: { taskId: task.id },
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });

      return identifier;
    }
  } catch (error) {
    console.error("Error scheduling task reminder:", error);
    return undefined;
  }
}

export async function scheduleEnergyReminder(
  task: task
): Promise<string | undefined> {
  if (!task.EnergyReminder) return;

  try {
    // Schedule a notification when supply is low
    if (task.currentSupply <= task.EnergyAt) {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Energy Reminder",
          body: `Your ${task.name} supply is running low. Current supply: ${task.currentSupply}`,
          data: { taskId: task.id, type: "Energy" },
        },
        trigger: null, // Show immediately
      });

      return identifier;
    }
  } catch (error) {
    console.error("Error scheduling Energy reminder:", error);
    return undefined;
  }
}

export async function canceltaskReminders(
  taskId: string
): Promise<void> {
  try {
    const scheduledNotifications =
      await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduledNotifications) {
      const data = notification.content.data as {
        taskId?: string;
      } | null;
      if (data?.taskId === taskId) {
        await Notifications.cancelScheduledNotificationAsync(
          notification.identifier
        );
      }
    }
  } catch (error) {
    console.error("Error canceling task reminders:", error);
  }
}

export async function updatetaskReminders(
  task: task
): Promise<void> {
  try {
    // Cancel existing reminders
    await canceltaskReminders(task.id);

    // Schedule new reminders
    await scheduletaskReminder(task);
    await scheduleEnergyReminder(task);
  } catch (error) {
    console.error("Error updating task reminders:", error);
  }
}
