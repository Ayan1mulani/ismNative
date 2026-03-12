import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Platform
} from "react-native";

import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import AppHeader from "../components/AppHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import SubmitButton from "../components/SubmitButton";

import { otherServices } from "../../services/otherServices";
import { visitorServices } from "../../services/visitorServices";
import { OneSignal } from "react-native-onesignal";

const SettingsScreen = () => {

  const navigation = useNavigation();

  const [isAway, setIsAway] = useState(false);
  const [visitSound, setVisitSound] = useState(true);
  const [staffNotification, setStaffNotification] = useState(true);
  const [ivrEnabled, setIvrEnabled] = useState(true);
  const [ivrType, setIvrType] = useState("Enabled");

  /* ------------------------------
      SAVE SETTINGS
  ------------------------------ */
  const handleSave = async () => {
    try {

      const payload = {
        home_away: isAway ? 1 : 0,
        ivr_enable: ivrEnabled ? 1 : 0,
        ivr_p: "8668361520",
        ivr_s: null,
        notification_sound: JSON.stringify({
          VISIT: { switch: visitSound ? 1 : 0 },
          STAFF: { switch: staffNotification ? 1 : 0 }
        })
      };

      const res = await otherServices.updateUserSettings(payload);

      console.log("Settings saved:", res);

    } catch (err) {
      console.log("Save error:", err);
    }
  };

  /* ------------------------------
      TEST NOTIFICATION
  ------------------------------ */
  const testNotification = async () => {

    const deviceId = await OneSignal.User.pushSubscription.getIdAsync();

    console.log("Device ID:", deviceId);
    console.log("Push Enabled:", OneSignal.User.pushSubscription.optedIn);

    const res = await otherServices.sendTestNotification();

    console.log("API Response:", res);

  };

  /* ------------------------------
      TEST IVR CALL
  ------------------------------ */
  const testIVRCall = async () => {
    try {

      const res = await visitorServices.testIVRCall();

      console.log("IVR Test Response:", res);

    } catch (error) {
      console.log("IVR Test Error:", error);
    }
  };

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
              onValueChange={setVisitSound}
              trackColor={{ false: "#ddd", true: "#1996D3" }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Staff</Text>
            <Switch
              value={staffNotification}
              onValueChange={setStaffNotification}
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

              {["Enabled", "Primary", "Secondary"].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.optionRow}
                  onPress={() => setIvrType(item)}
                >
                  <Text style={styles.optionText}>{item}</Text>

                  {ivrType === item && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color="#22C55E"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}

        </View>

        {/* SAVE BUTTON */}
        <SubmitButton
          title="Save Changes"
          style={{ marginHorizontal: 15, marginTop: 16 }}
          onPress={handleSave}
        />

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

        <TouchableOpacity style={styles.testBtn} onPress={testNotification}>
          <Text style={styles.testBtnText}>Test Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.testBtn} onPress={testIVRCall}>
          <Text style={styles.testBtnText}>Test IVR Call</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />

      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;

/* ================================
   STYLES
================================ */

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
  }

});