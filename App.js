import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar, StyleSheet } from "react-native";
import NavigationPage from "./NavigationPage";
import { SafeAreaView } from "react-native-safe-area-context";
import BRAND from "./app/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OneSignal } from "react-native-onesignal";

import initializeOneSignal from "./Utils/GlobalFunctions/PushNotifications";
import { RegisterAppOneSignal } from "./services/oneSignalService";

export default function App() {

  useEffect(() => {

    initializeOneSignal();

    const subscriptionListener = async () => {

      const subscription = OneSignal.User.pushSubscription;

      if (!subscription?.id) {
        console.log("OneSignal subscription not ready yet");
        return;
      }

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

    };

    OneSignal.User.pushSubscription.addEventListener("change", subscriptionListener);

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