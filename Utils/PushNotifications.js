import { OneSignal, LogLevel } from "react-native-onesignal";
import { APP_ID_ONE_SIGNAL } from "../app/config/env";
import { showVisitorNotification } from "./VisitorNotification";
import { visitorServices } from "../services/visitorServices";
import { navigate } from "../NavigationService";

let isInitialized = false;

const initializeOneSignal = () => {

  if (isInitialized) {
    console.log("⚠️ OneSignal already initialized, skipping");
    return;
  }
  isInitialized = true;

  console.log("🚀 Initializing OneSignal");

  OneSignal.Debug.setLogLevel(LogLevel.Verbose);
  OneSignal.initialize(APP_ID_ONE_SIGNAL);
  OneSignal.Notifications.requestPermission(true);
  OneSignal.User.pushSubscription.optIn();

  /* ============================================================
     FOREGROUND — app is open
     → Prevent OneSignal default banner for visitor push
     → All other notifications (OTP etc.) display normally
     → Fetch visitor silently then show custom Notifee notification
  ============================================================ */
  OneSignal.Notifications.addEventListener(
    "foregroundWillDisplay",
    async (event) => {

      const notification = event.notification;
      console.log("🔔 Push received in foreground:", notification.title);

      if (notification.title !== "Add Visit") {
        notification.display();
        return;
      }

      event.preventDefault();

      try {
        console.log("📡 Fetching latest visitor…");
        const res = await visitorServices.getMyVisitors();

        if (res?.status === "success" && res?.data?.visits?.length > 0) {
          const visit = res.data.visits[0];
          console.log("👤 Visitor:", visit.name, "| ID:", visit.id);
          await showVisitorNotification(
            `${visit.name} is requesting entry`,
            visit.id,
            visit
          );
        } else {
          console.log("⚠️ No visitor data returned");
        }

      } catch (error) {
        console.log("❌ Foreground visitor fetch error:", error);
      }

    }
  );

  /* ============================================================
     BACKGROUND / KILLED STATE — app is not open
     → OneSignal delivers native OS notification automatically
     → On tap, navigate to Visitors tab
  ============================================================ */
  OneSignal.Notifications.addEventListener(
    "click",
    async (event) => {

      const notification = event.notification;
      console.log("👆 Notification tapped:", notification.title);

      if (notification.title !== "Add Visit") return;

      try {
        console.log("📡 Fetching visitor after tap…");
        const res = await visitorServices.getMyVisitors();

        if (res?.data?.visits?.length > 0) {
          const visit = res.data.visits[0];
          console.log("➡️ Navigating to Visitors tab, ID:", visit.id);
          navigate("MainApp", { screen: "Visitors" });
        } else {
          console.log("⚠️ No visitor found after tap");
        }

      } catch (error) {
        console.log("❌ Click handler visitor fetch error:", error);
      }

    }
  );

};

export default initializeOneSignal;