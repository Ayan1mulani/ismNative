import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OneSignal } from "react-native-onesignal";

import NavigationPage from "./NavigationPage";
import BRAND from "./app/config";
import initializeOneSignal from "./Utils/GlobalFunctions/PushNotifications";
import { RegisterAppOneSignal } from "./services/oneSignalService";

export default function App() {

  useEffect(() => {
    initializeOneSignal();
  }, []);

  useEffect(() => {
    const subscriptionListener = OneSignal.User.pushSubscription.addEventListener(
      "change",
      async (subscription) => {
        try {
          const userInfo = await AsyncStorage.getItem("userInfo");
          if (!userInfo) {
            console.log("No user session");
            return;
          }
          const result = await RegisterAppOneSignal();
          if (result) {
            console.log("Push registration success");
          } else {
            console.log("Push registration failed");
          }
        } catch (error) {
          console.log("Subscription change error:", error);
        }
      }
    );

    return () => {
      OneSignal.User.pushSubscription.removeEventListener("change", subscriptionListener);
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: BRAND.COLORS.safeArea || BRAND.COLORS.background }
        ]}
      >
        <StatusBar barStyle={"dark-content"} />
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