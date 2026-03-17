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
import StatusModal from "../../app/components/StatusModal";

import { otherServices } from "../../services/otherServices";
import { ismServices } from "../../services/ismServices";

const SettingsScreen = () => {

  const navigation = useNavigation();

  const [isAway, setIsAway] = useState(false);
  const [visitSound, setVisitSound] = useState(true);
  const [staffNotification, setStaffNotification] = useState(true);
  const [ivrEnabled, setIvrEnabled] = useState(true);

  const [primaryNumber, setPrimaryNumber] = useState("");
  const [secondaryNumber, setSecondaryNumber] = useState("");

  const [initialData, setInitialData] = useState({});

  const [statusModal, setStatusModal] = useState({
    visible: false,
    type: "success",
    title: "",
    subtitle: ""
  });

  /* ------------------------------
      VALIDATION
  ------------------------------ */
  const isValidPhone = (num) => {
    if (!num) return true;
    return /^[6-9]\d{9}$/.test(num);
  };

  /* ------------------------------
      LOAD USER SETTINGS
  ------------------------------ */

  const loadUserSettings = async () => {
    try {

      const res = await ismServices.getUserDetails()
      const user = res?.data || res;

      if (user) {

        const away = user.home_away === 1;
        const ivr = user.ivr_enable === 1;
        const p = user.ivr_p || "";
        const s = user.ivr_s || "";

        setIsAway(away);
        setIvrEnabled(ivr);
        setPrimaryNumber(p);
        setSecondaryNumber(s);

        // ✅ store initial
        setInitialData({
          isAway: away,
          ivrEnabled: ivr,
          primaryNumber: p,
          secondaryNumber: s
        });
      }

      const soundRes = await otherServices.getNotificationSound();

      if (soundRes?.data) {
        soundRes.data.forEach(item => {
          if (item.name === "VISIT") setVisitSound(item.switch === 1);
          if (item.name === "STAFF") setStaffNotification(item.switch === 1);
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

      // ❌ VALIDATION
      if (!isValidPhone(primaryNumber)) {
        setStatusModal({
          visible: true,
          type: "error",
          title: "Invalid Number",
          subtitle: "Enter valid 10-digit primary number"
        });
        return;
      }

      if (secondaryNumber && !isValidPhone(secondaryNumber)) {
        setStatusModal({
          visible: true,
          type: "error",
          title: "Invalid Number",
          subtitle: "Enter valid 10-digit secondary number"
        });
        return;
      }

      // ❌ NO CHANGE CHECK
      if (
        initialData.isAway === isAway &&
        initialData.ivrEnabled === ivrEnabled &&
        initialData.primaryNumber === primaryNumber &&
        initialData.secondaryNumber === secondaryNumber
      ) {
        setStatusModal({
          visible: true,
          type: "info",
          title: "No Changes",
          subtitle: "Nothing to update"
        });
        return;
      }

      // ⏳ LOADING
      setStatusModal({
        visible: true,
        type: "loading",
        title: "Saving Settings",
        subtitle: "Please wait..."
      });

      const payload = {
        home_away: isAway ? 1 : 0,
        ivr_enable: ivrEnabled ? 1 : 0,
        ivr_p: primaryNumber || null,
        ivr_s: secondaryNumber || null
      };


      const res = await otherServices.updateUserSettings(payload);

      console.log("Settings saved:", res);

      // ✅ SUCCESS
      setStatusModal({
        visible: true,
        type: "success",
        title: "Saved Successfully",
        subtitle: "Your IVR settings have been updated"
      });

      await loadUserSettings();

    } catch (err) {
      console.log("Save error:", err);

      setStatusModal({
        visible: true,
        type: "error",
        title: "Save Failed",
        subtitle: "Unable to update settings"
      });
    }
  };

  /* ------------------------------
      TOGGLES
  ------------------------------ */

  const toggleVisitSound = async (value) => {
    setVisitSound(value);
    try {
      await otherServices.setNotificationSound("VISIT", value);
    } catch (e) {
      console.log("Visit sound error:", e);
    }
  };

  const toggleStaffSound = async (value) => {
    setStaffNotification(value);
    try {
      await otherServices.setNotificationSound("STAFF", value);
    } catch (e) {
      console.log("Staff sound error:", e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      <AppHeader title="Settings" />

      <ScrollView showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionTitle}>Personal</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>I am Away</Text>
            <Switch value={isAway} onValueChange={setIsAway} trackColor={{ false: "#ddd", true: "#1996D3" }} thumbColor="#fff" />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Notifications</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Visit Sound</Text>
            <Switch value={visitSound} onValueChange={toggleVisitSound} trackColor={{ false: "#ddd", true: "#1996D3" }} />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Staff</Text>
            <Switch value={staffNotification} onValueChange={toggleStaffSound} trackColor={{ false: "#ddd", true: "#1996D3" }} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>IVR Settings</Text>

        <View style={styles.card}>

          <View style={styles.row}>
            <Text style={styles.label}>Enable IVR</Text>
            <Switch value={ivrEnabled} onValueChange={setIvrEnabled} trackColor={{ false: "#ddd", true: "#1996D3" }} />
          </View>

          {ivrEnabled && (
            <>
              <View style={styles.divider} />

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
                disabled={
                  !ivrEnabled ||
                  !primaryNumber ||
                  !isValidPhone(primaryNumber) ||
                  (secondaryNumber && !isValidPhone(secondaryNumber))
                }
              />
            </>
          )}
        </View>

        <View style={{ height: 40 }} />

      </ScrollView>

      {/* ✅ MODAL */}
      <StatusModal
        visible={statusModal.visible}
        type={statusModal.type}
        title={statusModal.title}
        subtitle={statusModal.subtitle}
        onClose={() => setStatusModal(prev => ({ ...prev, visible: false }))}
      />

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