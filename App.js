import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import NavigationPage from "./NavigationPage";
import { SafeAreaView } from "react-native-safe-area-context";
import BRAND from "./app/config";

// import OneSignal from "react-native-onesignal";
// import { APP_ID_ONE_SIGNAL } from "@env";

export default function App() {

  // useEffect(() => {

  //   // Initialize OneSignal
  //   OneSignal.initialize(APP_ID_ONE_SIGNAL);

  //   // Request notification permission
  //   OneSignal.Notifications.requestPermission(true);

  //   // Notification click handler
  //   OneSignal.Notifications.addEventListener("click", (event) => {
  //     console.log("Notification opened:", event);
  //   });

  // }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: BRAND.COLORS.SafeAreaa }
        ]}
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