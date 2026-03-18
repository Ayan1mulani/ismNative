import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar, StyleSheet } from "react-native"; // ← FIX: Import from 'react-native'
import { SafeAreaView } from "react-native-safe-area-context"; // ← Keep this
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OneSignal } from "react-native-onesignal";

import NavigationPage from "./NavigationPage";
import BRAND from "./app/config";
import initializeOneSignal from "./Utils/PushNotifications";
import { RegisterAppOneSignal } from "./services/oneSignalService";




export default function App() {

  /* -------------------------------------------------------
     INIT ONESIGNAL
  ------------------------------------------------------- */
  useEffect(() => {
    initializeOneSignal();
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