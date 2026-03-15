import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput
} from "react-native";

import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import AppHeader from "../components/AppHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import SubmitButton from "../components/SubmitButton";

import { otherServices } from "../../services/otherServices";
import { visitorServices } from "../../services/visitorServices";
import { ismServices } from "../../services/ismServices";
import { OneSignal } from "react-native-onesignal";

const SettingsScreen = () => {

  const navigation = useNavigation();

  const [isAway, setIsAway] = useState(false);
  const [visitSound, setVisitSound] = useState(true);
  const [staffNotification, setStaffNotification] = useState(true);
  const [ivrEnabled, setIvrEnabled] = useState(true);

  const [primaryNumber, setPrimaryNumber] = useState("");
  const [secondaryNumber, setSecondaryNumber] = useState("");

  /* ------------------------------
      LOAD USER SETTINGS
  ------------------------------ */

  const loadUserSettings = async () => {
    try {

      /* USER DATA */
      const res = await ismServices.getUserDetails()
      const user = res?.data || res;

      if (user) {

        setIsAway(user.home_away === 1);
        setIvrEnabled(user.ivr_enable === 1);

        setPrimaryNumber(user.ivr_p || "");
        setSecondaryNumber(user.ivr_s || "");

      }

      /* NOTIFICATION SOUND */
      const soundRes = await otherServices.getNotificationSound();

      if (soundRes?.data) {

        soundRes.data.forEach(item => {

          if (item.name === "VISIT") {
            setVisitSound(item.switch === 1);
          }

          if (item.name === "STAFF") {
            setStaffNotification(item.switch === 1);
          }

        });

      }

    } catch (error) {

      console.log("User detail error:", error);

    }
  };

  useEffect(() => {
    loadUserSettings();
  }, []);

  /* ------------------------------
      SAVE IVR + AWAY SETTINGS
  ------------------------------ */

  const handleSave = async () => {
    try {

      const resUser = await ismServices.getUserDetail(); // use /userDetail
      const user = resUser?.data || resUser;

      // modify only the fields we want to update
      user.home_away = isAway ? 1 : 0;
      user.ivr_enable = ivrEnabled ? 1 : 0;
      user.ivr_p = primaryNumber || null;
      user.ivr_s = secondaryNumber || null;

      console.log("FINAL UPDATE PAYLOAD:", user);

      const res = await otherServices.updateUserSettings(user);

      console.log("Settings saved:", res);

      await loadUserSettings();

    } catch (err) {
      console.log("Save error:", err);
    }
  };

  /* ------------------------------
      VISIT SOUND TOGGLE
  ------------------------------ */

  const toggleVisitSound = async (value) => {

    setVisitSound(value);

    try {
      await otherServices.setNotificationSound("VISIT", value);
    } catch (e) {
      console.log("Visit sound error:", e);
    }

  };

  /* ------------------------------
      STAFF SOUND TOGGLE
  ------------------------------ */

  const toggleStaffSound = async (value) => {

    setStaffNotification(value);

    try {
      await otherServices.setNotificationSound("STAFF", value);
    } catch (e) {
      console.log("Staff sound error:", e);
    }

  };

  /* ------------------------------
      TEST PUSH NOTIFICATION
  ------------------------------ */

  // const testNotification = async () => {

  //   const deviceId = await OneSignal.User.pushSubscription.getIdAsync();

  //   console.log("Device ID:", deviceId);

  //   const isOptedIn =
  //     await OneSignal.User.pushSubscription.getOptedInAsync();

  //   console.log("Push Enabled:", isOptedIn);

  //   const res = await otherServices.sendTestNotification();

  //   console.log("API Response:", res);

  // };

  /* ------------------------------
      TEST IVR CALL
  ------------------------------ */

  // const testIVRCall = async () => {
  //   try {

  //     const res = await visitorServices.testIVRCall();

  //     console.log("IVR Test Response:", res);

  //   } catch (error) {
  //     console.log("IVR Test Error:", error);
  //   }
  // };

  return (
    <SafeAreaView style={styles.container}>

      <AppHeader title="Settings" />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* PERSONAL */}
        <Text style={styles.sectionTitle}>Personal</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>I am Away</Text>
            <Switch
              value={isAway}
              onValueChange={setIsAway}
              trackColor={{ false: "#ddd", true: "#1996D3" }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* NOTIFICATIONS */}
        <Text style={styles.sectionTitle}>Notifications</Text>

        <View style={styles.card}>

          <View style={styles.row}>
            <Text style={styles.label}>Visit Sound</Text>
            <Switch
              value={visitSound}
              onValueChange={toggleVisitSound}
              trackColor={{ false: "#ddd", true: "#1996D3" }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Staff</Text>
            <Switch
              value={staffNotification}
              onValueChange={toggleStaffSound}
              trackColor={{ false: "#ddd", true: "#1996D3" }}
            />
          </View>

        </View>

        {/* IVR SETTINGS */}
        <Text style={styles.sectionTitle}>IVR Settings</Text>

        <View style={styles.card}>

          <View style={styles.row}>
            <Text style={styles.label}>Enable IVR</Text>
            <Switch
              value={ivrEnabled}
              onValueChange={setIvrEnabled}
              trackColor={{ false: "#ddd", true: "#1996D3" }}
            />
          </View>

          {ivrEnabled && (
            <>
              <View style={styles.divider} />

              {/* PRIMARY NUMBER */}
              <View style={styles.phoneRow}>
                <Text style={styles.phoneLabel}>Primary</Text>

                <TextInput
                  style={styles.phoneInput}
                  placeholder="Set Primary Number"
                  keyboardType="phone-pad"
                  value={primaryNumber}
                  onChangeText={setPrimaryNumber}
                />
              </View>

              {/* SECONDARY NUMBER */}
              <View style={styles.phoneRow}>
                <Text style={styles.phoneLabel}>Secondary</Text>

                <TextInput
                  style={styles.phoneInput}
                  placeholder="Set Secondary Number"
                  keyboardType="phone-pad"
                  value={secondaryNumber}
                  onChangeText={setSecondaryNumber}
                />
              </View>

              <SubmitButton
                title="Save IVR Settings"
                style={{ marginHorizontal: 15, marginBottom: 15 }}
                onPress={handleSave}
              />
            </>
          )}

        </View>

        {/* NOTE */}
        <Text style={styles.noteTitle}>Important Note</Text>

        <Text style={styles.noteText}>
          You will receive a confirmation call when your visitor arrives.
        </Text>

        <Text style={styles.smallNote}>
          By providing your contact details, you authorize Factech Automation
          Solutions Pvt Ltd to contact you via calls, email, or SMS.
        </Text>

        {/* LANGUAGE */}
        <Text style={styles.sectionTitle}>Language</Text>

        <View style={styles.card}>
          <TouchableOpacity style={styles.row2}>
            <Text style={styles.label}>English</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* TEST BUTTONS */}

        {/* <TouchableOpacity style={styles.testBtn} onPress={testNotification}>
          <Text style={styles.testBtnText}>Test Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testBtn} onPress={testIVRCall}>
          <Text style={styles.testBtnText}>Test IVR Call</Text>
        </TouchableOpacity> */}

        <View style={{ height: 40 }} />

      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  sectionTitle: {
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 20,
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#7eabe645",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === "ios" ? 10 : 0,
    minHeight: Platform.OS === "ios" ? 50 : 40,
  },

  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginHorizontal: 18,
  },

  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    paddingLeft: 20,
    marginBottom: 20
  },

  optionText: {
    fontSize: 15,
    color: "#374151",
  },

  testBtn: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: "#111",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center"
  },

  testBtnText: {
    color: "#fff",
    fontWeight: "600"
  },

  noteTitle: {
    marginTop: 25,
    paddingHorizontal: 20,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center"
  },

  noteText: {
    paddingHorizontal: 20,
    marginTop: 6,
    color: "#4B5563",
    textAlign: "center"
  },

  smallNote: {
    paddingHorizontal: 20,
    marginTop: 6,
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center"
  },

  row2: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 20,
    paddingVertical: 18
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12
  },

  phoneLabel: {
    fontSize: 15,
    color: "#111827"
  },

  phoneInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    height: 36,
    width: 150,
    paddingHorizontal: 10,
    textAlign: "right"
  },


});