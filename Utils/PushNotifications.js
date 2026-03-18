// utils/oneSignalConfig.js
import { OneSignal, LogLevel } from "react-native-onesignal";
import { APP_ID_ONE_SIGNAL } from "../app/config/env";
import { navigate } from "../NavigationService";
import { navigationRef } from "../NavigationService";


let isInitialized = false;


const initializeOneSignal = () => {
  if (isInitialized) return;
  isInitialized = true;

  console.log("🚀 Initializing OneSignal");

  OneSignal.Debug.setLogLevel(LogLevel.Verbose);
  OneSignal.initialize(APP_ID_ONE_SIGNAL);
  OneSignal.Notifications.requestPermission(true);
  OneSignal.User.pushSubscription.optIn();

  /* ============================================================
     🔥 FOREGROUND — APP OPEN
  ============================================================ */
  OneSignal.Notifications.addEventListener(
    "foregroundWillDisplay",
    async (event) => {
      const notification = event.notification;

      console.log("🔔 Push received:", notification.title);

      // ✅ Normal notifications
      if (notification.title !== "Add Visit") {
        notification.display();
        return;
      }

      // 🚫 Block system notification
      event.preventDefault();

      // ✅ Extract data from notification
      const data = notification.additionalData?.data;

      console.log("📦 Notification data:", data);

      // ✅ Map visitor (instant)
      const visitor = data
        ? {
          id: data.id,
          name: data.visitor_name,
          phoneNumber: data.visitor_phone_no,
          photo: data.visitor_img,
          purpose: data.visit_purpose,
          startTime: data.visit_start_time,
        }
        : null;

      // 🚀 OPEN MODAL SCREEN DIRECTLY

      if (navigationRef.isReady()) {
        navigate("VisitorApproval", { visitor });
      } else {
        console.log("❌ Navigation not ready yet");
      }
    }
  );

  /* ============================================================
     🔥 BACKGROUND / CLOSED — CLICK
  ============================================================ */
  OneSignal.Notifications.addEventListener(
    "click",
    async (event) => {
      const notification = event.notification;

      console.log("👆 Notification tapped:", notification.title);

      if (notification.title !== "Add Visit") return;

      const data = notification.additionalData?.data;

      console.log("📦 Click data:", data);

      const visitor = data
        ? {
          id: data.id,
          name: data.visitor_name,
          phoneNumber: data.visitor_phone_no,
          photo: data.visitor_img,
          purpose: data.visit_purpose,
          startTime: data.visit_start_time,
        }
        : null;

      // 🚀 OPEN MODAL SCREEN
      navigate("VisitorApproval", { visitor });
    }
  );
};

export default initializeOneSignal;