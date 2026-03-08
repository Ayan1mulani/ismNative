import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import AppHeader from "../components/AppHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { Platform } from "react-native";
import SubmitButton from "../components/SubmitButton";


const SettingsScreen = () => {
  const navigation = useNavigation();

  const [isAway, setIsAway] = useState(false);
  const [visitSound, setVisitSound] = useState(true);
  const [staffNotification, setStaffNotification] = useState(true);
  const [ivrEnabled, setIvrEnabled] = useState(true);
  const [ivrType, setIvrType] = useState("Enabled");

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

        {/* IVR CARD */}
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
                    < Ionicons
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

        <SubmitButton
  title="Save Changes"
  style={{ marginHorizontal: 15, marginTop: 16 }}
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
            < Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", // pure
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
    paddingVertical: 0,
    elevation: 0.1,
    shadowColor: "#000",
    borderWidth: 1,
    borderColor: '#7eabe645',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 0.1,

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
    marginBottom:20
  },

  optionText: {
    fontSize: 15,
    color: "#374151",
  },

  saveButton: {
    margin: 18,
    backgroundColor: "#1996D3",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  saveText: {
    color: "#fff",
    fontWeight: "600",
  },

  noteTitle: {
    marginTop: 25,
    paddingHorizontal: 20,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",   // 👈 important

  },

  noteText: {
    paddingHorizontal: 20,
    marginTop: 6,
    color: "#4B5563",
    textAlign: "center",   // 👈 important

  },

  smallNote: {
    paddingHorizontal: 20,
    marginTop: 6,
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",   // 👈 important


  },
  row2: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 20,
    paddingVertical: 18
  }
});