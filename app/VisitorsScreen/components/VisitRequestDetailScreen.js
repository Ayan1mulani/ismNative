import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import AppHeader from "../../components/AppHeader";
import { usePermissions } from "../../../Utils/ConetextApi";
import { SafeAreaView } from "react-native-safe-area-context";
import { visitorServices } from "../../../services/visitorServices";

const VisitDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { nightMode } = usePermissions();

  const visit = route.params?.visit;

  const [allowTime, setAllowTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ visible: false, message: "", success: true });

  // 👇 important — track attended locally
  const [attendedStatus, setAttendedStatus] = useState(
    visit?.attended ?? null
  );

  const theme = {
    bg: nightMode ? "#121212" : "#ffffff",
    card: nightMode ? "#1E1E1E" : "#FFFFFF",
    text: nightMode ? "#FFFFFF" : "#111827",
    sub: nightMode ? "#9CA3AF" : "#6B7280",
    border: nightMode ? "#2C2C2C" : "#E5E7EB",
    primary: "#2E8BC0",
    success: "#10B981",
    danger: "#EF4444",
    grey: "#6B7280",
  };

  const markAttendance = async (value) => {
    if (attendedStatus !== null) return; // already marked

    try {
      setLoading(true);

      const response = await visitorServices.visitAttended(visit.id, value);

      console.log("Attendance Response:", response);

      if (response?.status === "success") {
        setAttendedStatus(value);
        setModal({
          visible: true,
          message: value === 1 ? "Marked as Attended" : "Marked as Not Visited",
          success: true,
        });
      } else {
        setModal({
          visible: true,
          message: response?.message || "Failed to update",
          success: false,
        });
      }
    } catch (error) {
      setModal({
        visible: true,
        message: "Something went wrong",
        success: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = () => {
    if (attendedStatus === 1) return { text: "ATTENDED", color: theme.success };
    if (attendedStatus === 0) return { text: "NOT VISITED", color: theme.grey };
    return { text: "PENDING", color: theme.danger };
  };

  const status = getStatusLabel();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>

      <AppHeader
        title="Visit Detail"
        nightMode={nightMode}
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={{ padding: 16 }}>

        {/* STATUS BADGE */}
        <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
          <Text style={styles.statusText}>{status.text}</Text>
        </View>

        {/* IMAGE */}
        <Image
          source={{ uri: visit?.image || "https://via.placeholder.com/400" }}
          style={styles.image}
        />

        {/* INFO CARD */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.name, { color: theme.text }]}>
            {visit?.name}
          </Text>

          <View style={styles.row}>
            < Ionicons name="call-outline" size={16} color={theme.sub} />
            <Text style={[styles.subText, { color: theme.sub }]}>
              {visit?.mobile}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.rowBetween}>
            <Text style={[styles.label, { color: theme.sub }]}>Purpose</Text>
            <Text style={[styles.value, { color: theme.text }]}>
              {visit?.purpose}
            </Text>
          </View>
        </View>

        {/* ATTENDANCE BUTTONS */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            disabled={attendedStatus !== null || loading}
            style={[
              styles.actionBtn,
              {
                backgroundColor:
                  attendedStatus !== null ? "#ccc" : theme.success,
              },
            ]}
            onPress={() => markAttendance(1)}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Attended</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            disabled={attendedStatus !== null || loading}
            style={[
              styles.actionBtn,
              {
                backgroundColor:
                  attendedStatus !== null ? "#ccc" : theme.grey,
              },
            ]}
            onPress={() => markAttendance(0)}
          >
            <Text style={styles.btnText}>Not Visited</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* SUCCESS / ERROR MODAL */}
      <Modal transparent visible={modal.visible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: modal.success ? theme.success : theme.danger,
              }}
            >
              {modal.message}
            </Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModal({ ...modal, visible: false });
                navigation.goBack();
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default VisitDetailScreen;

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginVertical: 12,
  },
  card: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  subText: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
  },
  value: {
    fontSize: 13,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
  },
  modalButton: {
    marginTop: 15,
    backgroundColor: "#2E8BC0",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
});