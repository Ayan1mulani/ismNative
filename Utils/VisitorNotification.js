import notifee, { AndroidImportance, AndroidVisibility } from "@notifee/react-native";

const NOTIFICATION_ID = "visitor-request";
const CHANNEL_ID = "visitor-channel";

const ensureChannel = async () => {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: "Visitor Requests",
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    vibration: true,
    sound: "default",
  });
};

export const showVisitorNotification = async (message, visitId, visitor = null) => {
  try {
    await ensureChannel();
    await notifee.displayNotification({
      id: NOTIFICATION_ID,
      title: "🔔 Visitor Request",
      body: message,
      data: {
        visitId: String(visitId),
        type: "visitor",
        visitor: visitor ? JSON.stringify(visitor) : null,
      },
      android: {
        channelId: CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        ongoing: true,
        onlyAlertOnce: false,
        actions: [
          { title: "✅  Accept", pressAction: { id: "accept" } },
          { title: "❌  Decline", pressAction: { id: "decline" } },
        ],
      },
      ios: {
        sound: "default",
        categoryId: "visitor-actions",
      },
    });
  } catch (err) {
    console.log("❌ showVisitorNotification error:", err);
  }
};

export const registerIOSVisitorCategories = async () => {
  try {
    await notifee.setNotificationCategories([
      {
        id: "visitor-actions",
        actions: [
          { id: "accept", title: "✅ Accept", foreground: true },
          { id: "decline", title: "❌ Decline", foreground: false, destructive: true },
        ],
      },
    ]);
  } catch (err) {
    console.log("❌ registerIOSVisitorCategories error:", err);
  }
};

export const cancelVisitorNotification = async () => {
  try {
    await notifee.cancelNotification(NOTIFICATION_ID);
  } catch (err) {
    console.log("❌ cancelVisitorNotification error:", err);
  }
};