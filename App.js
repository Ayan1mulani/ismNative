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
import { complaintService } from "./services/complaintService";




export default function App() {

  const loadSocietyConfig = async () => {
    try {
      const existing = await AsyncStorage.getItem("SOCIETY_CONFIG");

      if (existing) {
        try {
          const parsed = JSON.parse(existing);

          if (parsed && typeof parsed === "object") {
            console.log("📦 Config already exists, skipping API");
            return;
          }
        } catch (e) {
          console.log("⚠️ Corrupted config, refetching...");
        }
      }

      console.log("🌐 Fetching config from API...");

      const res = await complaintService.getSocietyConfigNew();

      if (res && typeof res === "object") {
        await AsyncStorage.setItem(
          "SOCIETY_CONFIG",
          JSON.stringify(res)
        );

        console.log("✅ Society config stored:", res);
      }

    } catch (error) {
      console.log("❌ Config load error:", error);
    }
  };

  useEffect(() => {
    const initConfig = async () => {
      const user = await AsyncStorage.getItem("userInfo");

      if (user) {
        console.log("👤 User found, loading config...");
        await loadSocietyConfig();
      } else {
        console.log("🚫 No user, skipping config");
      }
    };

    initConfig();
  }, []);
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