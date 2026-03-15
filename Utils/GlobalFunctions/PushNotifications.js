import { OneSignal, LogLevel } from "react-native-onesignal";
import { APP_ID_ONE_SIGNAL } from "../../app/config/env";
import { navigate } from "../../NavigationService";
import { visitorServices } from "../../services/visitorServices";

const openLatestVisitor = async () => {
  try {

    const res = await visitorServices.getMyVisitors();

    console.log("Visitor response:", res);

    if (
      res?.status === "success" &&
      res?.data &&
      res.data.length > 0
    ) {

      const latestVisit = res.data[0];

      const visitId = latestVisit.id;

      console.log("Latest visitId:", visitId);

      navigate("VisitorApproval", {
        visitId: visitId
      });

    }

  } catch (error) {

    console.log("Visitor fetch error:", error);

  }
};

const initializeOneSignal = () => {
  try {

    console.log("🚀 Initializing OneSignal...");

    OneSignal.Debug.setLogLevel(LogLevel.Verbose);

    OneSignal.initialize(APP_ID_ONE_SIGNAL);

    OneSignal.Notifications.requestPermission(true);

    OneSignal.User.pushSubscription.optIn();

    /* -----------------------------
       FOREGROUND NOTIFICATION
       ----------------------------- */
    OneSignal.Notifications.addEventListener(
      "foregroundWillDisplay",
      async (event) => {

        console.log("Foreground notification received");

        await openLatestVisitor();

        event.preventDefault();

      }
    );

    /* -----------------------------
       CLICK NOTIFICATION
       ----------------------------- */
    OneSignal.Notifications.addEventListener(
      "click",
      async () => {

        console.log("Notification clicked");

        await openLatestVisitor();

      }
    );

  } catch (error) {

    console.error("❌ OneSignal initialization error:", error);

  }
};

export default initializeOneSignal;