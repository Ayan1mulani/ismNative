import { OneSignal, LogLevel } from "react-native-onesignal";
import { APP_ID_ONE_SIGNAL } from "../app/config/env";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { navigationRef, navigate } from "../NavigationService";

let isInitialized = false;

// App.js registers this callback after init.
// When background/killed state notification is tapped, we call this directly
// instead of relying on AsyncStorage + timer to align.
let _onVisitorPending = null;

export const setOnVisitorPending = (cb) => {
  _onVisitorPending = cb;
};

const extractVisitor = (data) => {
  if (!data) return null;
  return {
    id: data.id,
    name: data.visitor_name,
    phoneNumber: data.visitor_phone_no,
    photo: data.visitor_img,
    purpose: data.visit_purpose,
    startTime: data.visit_start_time,
  };
};

const initializeOneSignal = () => {
  if (isInitialized) return;
  isInitialized = true;

  OneSignal.Debug.setLogLevel(LogLevel.Verbose);
  OneSignal.initialize(APP_ID_ONE_SIGNAL);
  OneSignal.Notifications.requestPermission(true);
  OneSignal.User.pushSubscription.optIn();

  /* ============================================================
     FOREGROUND — App is open and visible
     → Navigate directly without storing to AsyncStorage
     → Suppress the notification banner (preventDefault)
        so we don't show both a banner AND a screen
  ============================================================ */
  OneSignal.Notifications.addEventListener(
    "foregroundWillDisplay",
    async (event) => {
      const notification = event.notification;

      if (notification.title !== "Add Visit") {
        // Not a visitor notification — show it normally
        notification.display();
        return;
      }

      // Suppress banner — we handle it via direct navigation instead
      event.preventDefault();

      const visitor = extractVisitor(notification.additionalData?.data);
      if (!visitor?.id) return;

      console.log("🔔 Foreground visitor notification:", visitor.id);

      // Nav is guaranteed ready in foreground — push directly
      // No navigate("MainApp") needed — we are already inside it
      if (navigationRef.isReady()) {
        navigate("VisitorApproval", { visitor });
      }
    }
  );

  /* ============================================================
     BACKGROUND / KILLED — User tapped the notification
     → Store to AsyncStorage FIRST as safety fallback
       (in case _onVisitorPending isn't registered yet)
     → Then call _onVisitorPending directly so App.js handles it
       without racing against AppState "active" event

     NOTE: When user opens app via ICON (not tapping notification),
     this click event never fires. That case is handled by the
     server poll (checkPendingVisitorFromServer) in App.js.
  ============================================================ */
  OneSignal.Notifications.addEventListener("click", async (event) => {
    const notification = event.notification;

    if (notification.title !== "Add Visit") return;

    const visitor = extractVisitor(notification.additionalData?.data);
    if (!visitor?.id) return;

    console.log("👆 Notification tapped — visitor:", visitor.id);

    // Store first — fallback if _onVisitorPending fires before App.js mounts
    await AsyncStorage.setItem("PENDING_VISITOR", JSON.stringify(visitor));

    // Call registered callback directly — no setTimeout, no timer race
    // pendingVisitorHandled ref in App.js blocks AppState from double-navigating
    if (_onVisitorPending) {
      console.log("📲 Calling registered visitor callback");
      _onVisitorPending(visitor);
    }
  });
};

export default initializeOneSignal;