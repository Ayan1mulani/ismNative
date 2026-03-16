import { AppRegistry } from "react-native";
import notifee, { EventType } from "@notifee/react-native";
import App from "./App";
import { name as appName } from "./app.json";
import { visitorServices } from "./services/visitorServices";

/* ============================================================
   BACKGROUND NOTIFEE EVENT HANDLER
   Runs when app is background/killed and user presses
   Accept / Decline on the custom notification.
   Navigation is NOT available here — API calls only.
============================================================ */
notifee.onBackgroundEvent(async ({ type, detail }) => {

  if (type === EventType.PRESS) return;

  if (type !== EventType.ACTION_PRESS) return;

  const action = detail?.pressAction?.id;
  const visitId = detail?.notification?.data?.visitId;

  console.log("🌙 Background action:", action, "| visitId:", visitId);

  if (!visitId) {
    console.log("⚠️ No visitId in background notification data");
    return;
  }

  try {

    if (action === "accept") {
      await visitorServices.acceptVisitor({ visit_id: visitId });
      console.log("✅ Visitor accepted (background)");

    } else if (action === "decline") {
      await visitorServices.denyVisitor({ visit_id: visitId });
      console.log("❌ Visitor declined (background)");
    }

  } catch (err) {
    console.log("❌ Background visitor action error:", err);
  }

});

AppRegistry.registerComponent(appName, () => App);