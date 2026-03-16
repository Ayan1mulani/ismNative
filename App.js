import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OneSignal } from "react-native-onesignal";
import notifee, { EventType } from "@notifee/react-native";

import NavigationPage from "./NavigationPage";
import BRAND from "./app/config";
import initializeOneSignal from "./Utils/PushNotifications";
import { RegisterAppOneSignal } from "./services/oneSignalService";
import { visitorServices } from "./services/visitorServices";
import { navigate } from "./NavigationService";
import { registerIOSVisitorCategories, cancelVisitorNotification } from "./Utils/VisitorNotification";

export default function App() {

  /* -------------------------------------------------------
     INIT ONESIGNAL + iOS notification categories
  ------------------------------------------------------- */
  useEffect(() => {
    initializeOneSignal();
    registerIOSVisitorCategories();
  }, []);


  /* -------------------------------------------------------
     FOREGROUND NOTIFEE EVENTS
     Handles tapping body or pressing Accept / Decline
  ------------------------------------------------------- */
  useEffect(() => {

    let isProcessing = false;

    const unsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {

      // Tapped notification body → navigate to Visitors tab
      if (type === EventType.PRESS) {
        const visitId = detail?.notification?.data?.visitId;
        if (!visitId) return;
        navigate("MainApp", { screen: "Visitors" });
        return;
      }

      if (type !== EventType.ACTION_PRESS) return;

      if (isProcessing) {
        console.log("⚠️ Action already processing, skipping duplicate");
        return;
      }
      isProcessing = true;

      const action = detail?.pressAction?.id;
      const visitId = detail?.notification?.data?.visitId || null;

      console.log("🎯 Action pressed:", action, "| visitId:", visitId);

      if (!visitId) {
        console.log("⚠️ No visitId in notification data");
        isProcessing = false;
        return;
      }

      try {

        if (action === "accept") {
          await visitorServices.acceptVisitor({ visit_id: visitId });
          console.log("✅ Visitor accepted");
          await cancelVisitorNotification();
          navigate("MainApp", { screen: "Visitors" });

        } else if (action === "decline") {
          await visitorServices.denyVisitor({ visit_id: visitId });
          console.log("❌ Visitor declined");
          await cancelVisitorNotification();
        }

      } catch (err) {
        console.log("❌ Visitor action error:", err);
      } finally {
        isProcessing = false;
      }

    });

    return unsubscribe;

  }, []);


  /* -------------------------------------------------------
     ONESIGNAL TOKEN REGISTRATION
  ------------------------------------------------------- */
  useEffect(() => {

    const subscriptionListener =
      OneSignal.User.pushSubscription.addEventListener(
        "change",
        async () => {
          try {
            const userInfo = await AsyncStorage.getItem("userInfo");
            if (!userInfo) return;
            await RegisterAppOneSignal();
          } catch (error) {
            console.log("❌ Subscription listener error:", error);
          }
        }
      );

    return () => {
      OneSignal.User.pushSubscription.removeEventListener(
        "change",
        subscriptionListener
      );
    };

  }, []);


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: BRAND.COLORS.safeArea || BRAND.COLORS.background },
        ]}
      >
        
        <StatusBar barStyle="dark-content" />
        <NavigationPage />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});