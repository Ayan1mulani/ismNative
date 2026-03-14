import { OneSignal, LogLevel } from "react-native-onesignal";
import { APP_ID_ONE_SIGNAL } from "../../app/config/env";

const onesignalInitalize = async () => {
  try {

    console.log("🚀 Initializing OneSignal...");

    /* ------------------------------
       ENABLE DEBUG LOGS
    ------------------------------ */
    OneSignal.Debug.setLogLevel(LogLevel.Verbose);

    /* ------------------------------
       INITIALIZE ONESIGNAL
    ------------------------------ */
    OneSignal.initialize(APP_ID_ONE_SIGNAL);

    console.log("✅ OneSignal initialized with App ID:", APP_ID_ONE_SIGNAL);

    /* ------------------------------
       PAUSE IN APP MESSAGES
    ------------------------------ */
    OneSignal.InAppMessages.setPaused(true);

    /* ------------------------------
       REQUEST PERMISSION
    ------------------------------ */
    console.log("📩 Requesting notification permission...");

    const permission = await OneSignal.Notifications.requestPermission(true);

    console.log("🔔 Permission granted:", permission);

    const permissionStatus =
      await OneSignal.Notifications.getPermissionAsync();

    console.log("🔐 Current permission status:", permissionStatus);

    /* ------------------------------
       ENABLE PUSH SUBSCRIPTION
    ------------------------------ */
    OneSignal.User.pushSubscription.optIn();

    /* ------------------------------
       PUSH SUBSCRIPTION CHANGE
    ------------------------------ */
    OneSignal.User.pushSubscription.addEventListener("change", (event) => {

      console.log("📲 Push subscription changed");

      console.log("Previous ID:", event.previous?.id);
      console.log("Current ID:", event.current?.id);

      console.log("Previous Token:", event.previous?.token);
      console.log("Current Token:", event.current?.token);

      console.log("Full Event:", JSON.stringify(event, null, 2));

    });

    /* ------------------------------
       FOREGROUND NOTIFICATION
    ------------------------------ */
    OneSignal.Notifications.addEventListener(
      "foregroundWillDisplay",
      (event) => {

        const notification = event.getNotification();

        event.preventDefault();

        Alert.alert(
          notification.title || "Notification",
          notification.body || "You have a new message"
        );

      }
    );

    /* ------------------------------
       BACKGROUND / CLICK NOTIFICATION
    ------------------------------ */
    OneSignal.Notifications.addEventListener("click", (event) => {

      console.log("👆 Notification clicked");

      const notification = event.notification;

      console.log("📦 FULL NOTIFICATION OBJECT:");
      console.log(JSON.stringify(notification, null, 2));

      console.log("Title:", notification.title);
      console.log("Body:", notification.body);
      console.log("Additional Data:", notification.additionalData);

      console.log("Raw Payload:", notification.rawPayload);

    });

    /* ------------------------------
       FETCH DEVICE IDS
    ------------------------------ */

    setTimeout(async () => {

      try {

        const onesignalId = await OneSignal.User.getOnesignalId();

        const pushId =
          await OneSignal.User.pushSubscription.getIdAsync();

        const pushToken =
          await OneSignal.User.pushSubscription.getTokenAsync();

        const optedIn =
          await OneSignal.User.pushSubscription.getOptedInAsync();

        console.log("🆔 OneSignal ID:", onesignalId);
        console.log("📌 Push Subscription ID (deviceid):", pushId);
        console.log("📌 Push Token:", pushToken);
        console.log("🔔 Push Enabled:", optedIn);

        if (!pushId) {
          console.log("⚠️ Device ID not ready yet");
        } else {
          console.log("✅ Device ID ready for backend:", pushId);
        }

      } catch (err) {

        console.log("❌ Error fetching OneSignal IDs:", err);

      }

    }, 3000);

    console.log("🎉 OneSignal setup completed");

  } catch (error) {

    console.error("❌ OneSignal initialization error:", error);

  }
};

export default onesignalInitalize;