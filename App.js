import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import NavigationPage from "./NavigationPage";
import { SafeAreaView } from "react-native-safe-area-context";
import BRAND from "./app/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OneSignal } from "react-native-onesignal";

import initializeOneSignal from "./Utils/GlobalFunctions/PushNotifications";
import { RegisterAppOneSignal } from "./services/oneSignalService";

export default function App() {

  useEffect(() => {

    // Initialize OneSignal
    initializeOneSignal();

    const checkAndRegister = async () => {
      try {

        console.log("🔍 [App.js] Checking for User Session...");
        const userInfo = await AsyncStorage.getItem("userInfo");

        if (!userInfo) {
          console.log("ℹ️ No user logged in. Skipping push registration.");
          return;
        }

        console.log("✅ User session found");

        // Wait until OneSignal Player ID is available
        let deviceId = null;

        for (let i = 0; i < 10; i++) {

          deviceId = await OneSignal.User.pushSubscription.getIdAsync();

          if (deviceId) break;

          console.log("⏳ Waiting for OneSignal Player ID...");
          await new Promise(res => setTimeout(res, 1000));
        }

        if (!deviceId) {
          console.log("❌ OneSignal Player ID not ready");
          return;
        }

        console.log("📡 Player ID ready:", deviceId);

        const isRegistered = await RegisterAppOneSignal();

        if (isRegistered) {
          console.log("🎉 OneSignal Registration SUCCESS");
        } else {
          console.log("❌ OneSignal Registration FAILED");
        }

      } catch (e) {
        console.error("⚠️ Auto-register error:", e);
      }
    };

    checkAndRegister();

  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: BRAND.COLORS.SafeAreaa }]}
      >
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