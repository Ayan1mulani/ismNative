import { OneSignal, LogLevel } from "react-native-onesignal";
import { APP_ID_ONE_SIGNAL } from "../../app/config/env";

const initializeOneSignal = async () => {
  try {

    if (!APP_ID_ONE_SIGNAL) {
      console.error("❌ OneSignal App ID missing");
      return;
    }

    // Debug logs
    OneSignal.Debug.setLogLevel(LogLevel.Verbose);

    // Initialize
    OneSignal.initialize(APP_ID_ONE_SIGNAL);

    console.log("🚀 OneSignal initialized");

    // Ask permission
    const permission = await OneSignal.Notifications.requestPermission(true);
    console.log("🔔 Notification permission:", permission);

    // Get Player ID
    const pushId = await OneSignal.User.pushSubscription.getIdAsync();

    // Get FCM token
    const token = await OneSignal.User.pushSubscription.getTokenAsync();

    console.log("📡 OneSignal Player ID:", pushId);
    console.log("📡 Push Token:", token);

    // Foreground notification
    OneSignal.Notifications.addEventListener(
      "foregroundWillDisplay",
      (event) => {
        console.log("🔔 Notification received:", event.notification);

        event.notification.display();
      }
    );

    // Notification click
    OneSignal.Notifications.addEventListener("click", (event) => {
      console.log("👆 Notification clicked:", event.notification);
    });

  } catch (error) {
    console.error("❌ OneSignal initialization error:", error);
  }
};

export default initializeOneSignal;