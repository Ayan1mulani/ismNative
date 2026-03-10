import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import NavigationPage from "./NavigationPage";
import { SafeAreaView } from "react-native-safe-area-context";
import BRAND from "./app/config";
import AsyncStorage from "@react-native-async-storage/async-storage";

import initializeOneSignal from "./Utils/GlobalFunctions/PushNotifications";
import { RegisterAppOneSignal } from "./app/OneSignal/RegisterOnesignal";

export default function App() {

  useEffect(() => {

    initializeOneSignal();

    const checkAndRegister = async () => {

      const userInfo = await AsyncStorage.getItem("userInfo");

      if (!userInfo) {
        console.log("ℹ️ No user session");
        return;
      }

      console.log("👤 User session found");

      const isRegistered = await RegisterAppOneSignal();

      if (isRegistered) {
        console.log("🎉 Push registration success");
      } else {
        console.log("❌ Push registration failed");
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