import React, { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar, StyleSheet, AppState } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OneSignal } from "react-native-onesignal";

import NavigationPage from "./NavigationPage";
import BRAND from "./app/config";
import initializeOneSignal, { setOnVisitorPending } from "./Utils/PushNotifications";
import { RegisterAppOneSignal } from "./services/oneSignalService";
import { complaintService } from "./services/complaintService";
import { visitorServices } from "./services/visitorServices";
import { navigationRef, navigate } from "./NavigationService";

export default function App() {
  // Blocks duplicate navigation if click callback + AppState fire together
  const isNavigating = useRef(false);

  // Set to true the moment click callback fires — BEFORE any async work
  // Ensures AppState "active" handler sees it in time and skips server poll
  const pendingVisitorHandled = useRef(false);

  /* -------------------------------------------------------
     LOAD CONFIG
  ------------------------------------------------------- */
  const loadSocietyConfig = async () => {
    try {
      const existing = await AsyncStorage.getItem("SOCIETY_CONFIG");
      if (existing) {
        try {
          const parsed = JSON.parse(existing);
          if (parsed && typeof parsed === "object") return;
        } catch {
          console.log("⚠️ Corrupted config, refetching...");
        }
      }
      const res = await complaintService.getSocietyConfigNew();
      if (res && typeof res === "object") {
        await AsyncStorage.setItem("SOCIETY_CONFIG", JSON.stringify(res));
      }
    } catch (error) {
      console.log("❌ Config load error:", error);
    }
  };

  useEffect(() => {
    const initConfig = async () => {
      const user = await AsyncStorage.getItem("userInfo");
      if (user) await loadSocietyConfig();
    };
    initConfig();
  }, []);

  /* -------------------------------------------------------
     CORE NAVIGATION
     - Does NOT call navigate("MainApp") — that resets tab
       navigator to Home tab (was causing redirect-to-home bug)
     - Pushes VisitorApproval directly onto root stack
     - Sets both guards synchronously before any async work
  ------------------------------------------------------- */
  const navigateToVisitor = (visitor) => {
    if (isNavigating.current) {
      console.log("⏳ Already navigating, skipping");
      return;
    }

    if (!visitor?.id) {
      console.log("⚠️ Invalid visitor, skipping");
      return;
    }

    // Set BOTH guards synchronously before any async work
    // AppState "active" fires almost simultaneously with click callback —
    // this ensures it sees the flag before it reads AsyncStorage or hits server
    isNavigating.current = true;
    pendingVisitorHandled.current = true;

    console.log("🚀 Navigating to visitor:", visitor.id);

    const tryNavigate = () => {
      if (!navigationRef.isReady()) {
        console.log("⏳ Nav not ready, retrying...");
        setTimeout(tryNavigate, 300);
        return;
      }

      try {
        // Push VisitorApproval directly — DO NOT call navigate("MainApp")
        // When app resumes from background the user is already inside MainApp.
        // Calling navigate("MainApp") resets the entire tab navigator back to
        // its initial route (Home tab) — that was the redirect-to-home bug.
        navigate("VisitorApproval", { visitor });

        setTimeout(() => {
          isNavigating.current = false;
          console.log("✅ Navigation done, guard reset");
        }, 1000);

      } catch (e) {
        // Always reset guards on error so future taps aren't permanently blocked
        console.log("❌ Navigate error:", e);
        isNavigating.current = false;
        pendingVisitorHandled.current = false;
      }
    };

    tryNavigate();
  };

  /* -------------------------------------------------------
     SERVER POLL — checks if there is a visitor waiting
     Called on:
       1. App resume via icon from background (AppState "active")
       2. App opened from killed state via icon (mount timeout)

     This is the ONLY reliable way to handle icon-open scenarios
     because the OneSignal click event never fires in those cases —
     AsyncStorage never gets PENDING_VISITOR set.

     ⚠️ ADJUST THE FILTER BELOW to match your API response.
        Log `visits` to console after applying this and share
        the output so we can set the exact filter condition.
  ------------------------------------------------------- */
  const checkPendingVisitorFromServer = async () => {
    try {
      // Skip if already handling a notification tap
      if (isNavigating.current || pendingVisitorHandled.current) {
        console.log("⏳ Already navigating, skipping server check");
        return;
      }

      // Skip if not logged in
      const userInfo = await AsyncStorage.getItem("userInfo");
      if (!userInfo) return;

      console.log("🔍 Checking server for pending visitor...");

      const response = await visitorServices.getVisitsForResident();
      const visits = response?.data || [];

      console.log("📋 Total visits from server:", visits.length);

      // ⚠️ ADJUST THIS FILTER to match your actual API response shape.
      // Currently covers the most common patterns.
      // Share your console log output and we will pin down the exact condition.
      const pending = visits.find(v =>
        v.status === "waiting" ||
        v.status === "pending" ||
        v.allow === null ||
        (v.allow === 0 && v.visit_status === "active")
      );

      if (!pending) {
        console.log("✅ No pending visitors found on server");
        return;
      }

      console.log("🔔 Pending visitor found on server:", pending.id, "status:", pending.status, "allow:", pending.allow);

      // ⚠️ ADJUST FIELD NAMES below to match your API response
      const visitor = {
        id: pending.id,
        name: pending.visitor_name,
        phoneNumber: pending.visitor_phone_no,
        photo: pending.visitor_img,
        purpose: pending.visit_purpose,
        startTime: pending.visit_start_time,
      };

      navigateToVisitor(visitor);

    } catch (e) {
      console.log("❌ checkPendingVisitorFromServer error:", e);
    }
  };

  /* -------------------------------------------------------
     INIT ONESIGNAL + REGISTER CALLBACK
     setOnVisitorPending is registered immediately after init
     so even if click fires fast, callback is ready
  ------------------------------------------------------- */
  useEffect(() => {
    initializeOneSignal();

    // Handles background tap and killed-state tap
    // Click event calls this directly — no timer race
    setOnVisitorPending((visitor) => {
      console.log("📲 Visitor callback received:", visitor.id);
      navigateToVisitor(visitor);
    });
  }, []);

  /* -------------------------------------------------------
     KILLED STATE — App opened via icon after being killed
     Two paths:
       A) Notification was tapped → OneSignal click fires →
          _onVisitorPending → navigateToVisitor (fast path)
          pendingVisitorHandled will be true → server poll skips
       B) App icon tapped directly → click never fires →
          server poll is the only option (this timeout below)
  ------------------------------------------------------- */
  useEffect(() => {
    const timer = setTimeout(() => {
      checkPendingVisitorFromServer();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  /* -------------------------------------------------------
     BACKGROUND → FOREGROUND (AppState)
     - "background": reset flags so next notification tap is fresh
     - "active":
         If notification was tapped → pendingVisitorHandled is true
           → skip server poll (notification click already handled it)
         If icon was tapped → pendingVisitorHandled is false
           → server poll runs → finds pending visitor → navigate
  ------------------------------------------------------- */
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "background") {
        // Reset flags so next notification tap starts fresh
        pendingVisitorHandled.current = false;
        isNavigating.current = false;
        console.log("📱 App backgrounded — flags reset");
      }

      if (state === "active") {
        console.log("📱 App resumed");

        if (pendingVisitorHandled.current || isNavigating.current) {
          // Notification tap already handled — don't poll server
          console.log("⏳ Already handled by notification tap, skipping server check");
          return;
        }

        // Icon tap from background — poll server for pending visitor
        checkPendingVisitorFromServer();
      }
    });

    return () => subscription.remove();
  }, []);

  /* -------------------------------------------------------
     ONESIGNAL TOKEN REGISTER
  ------------------------------------------------------- */
  useEffect(() => {
    const subscriptionListener =
      OneSignal.User.pushSubscription.addEventListener("change", async () => {
        try {
          const userInfo = await AsyncStorage.getItem("userInfo");
          if (!userInfo) return;
          await RegisterAppOneSignal();
        } catch (error) {
          console.log("❌ Subscription listener error:", error);
        }
      });

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
  safeArea: { flex: 1 },
});