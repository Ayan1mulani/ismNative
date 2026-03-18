import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator
} from "react-native";

import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import AppHeader from "../../components/AppHeader";
import { usePermissions } from "../../../Utils/ConetextApi";
import { SafeAreaView } from "react-native-safe-area-context";
import { visitorServices } from "../../../services/visitorServices";
import { cancelVisitorNotification } from "../../../Utils/VisitorNotification";

const VisitDetailScreen = () => {

  const navigation = useNavigation();
  const route = useRoute();
  const { nightMode } = usePermissions();

  const visit = route.params?.visit;
  const onGoBack = route.params?.onGoBack; // ✅ ADDED

  const [loading, setLoading] = useState(false);

  const [modal, setModal] = useState({
    visible: false,
    message: "",
    success: true
  });

  const [allowStatus, setAllowStatus] = useState(visit?.allow ?? null);
  const [attendedStatus, setAttendedStatus] = useState(visit?.attended ?? null);

  const theme = {
    bg: nightMode ? "#121212" : "#F3F4F6",
    card: nightMode ? "#1E1E1E" : "#FFFFFF",
    text: nightMode ? "#FFFFFF" : "#111827",
    sub: nightMode ? "#9CA3AF" : "#6B7280",
    border: nightMode ? "#2C2C2C" : "#E5E7EB",
    success: "#10B981",
    danger: "#EF4444",
    grey: "#6B7280",
    primary: "#2E8BC0"
  };

  const isPending = allowStatus === null;
  const isDenied = allowStatus === 0;
  const isAllowed = allowStatus === 1 && attendedStatus === null;
  const isCompleted = allowStatus === 1 && attendedStatus !== null;

  const getStatus = () => {
    if (isDenied) return { text: "REJECTED", color: theme.grey };
    if (isCompleted && attendedStatus === 1) return { text: "ATTENDED", color: theme.success };
    if (isCompleted && attendedStatus === 0) return { text: "NOT VISITED", color: theme.grey };
    if (isAllowed) return { text: "APPROVED", color: theme.primary };
    return { text: "PENDING", color: theme.danger };
  };

  const status = getStatus();

  // ✅ ADDED helper
  const formatDateTime = (date) => {
    if (!date) return "—";
    const d = new Date(date.replace(" ", "T"));
    return d.toLocaleString();
  };

  // ─── Allow Visitor ────────────────────────────────────────────────────────
  const allowVisitor = async () => {
    try {
      setLoading(true);

      const whomToMeet = JSON.parse(visit.whom_to_meet);
      const flat_no = whomToMeet[0].flat_no;

      await visitorServices.acceptVisitor(visit.id, flat_no);
      await cancelVisitorNotification();

      setAllowStatus(1);

      // ✅ UPDATED
      setModal({ visible: true, message: "Visitor Approved", success: true });

      setTimeout(() => {
        setModal(prev => ({ ...prev, visible: false })); // ✅ CLOSE MODAL
        if (onGoBack) onGoBack();
        navigation.goBack();
      }, 1200);
    }

    catch (e) {
        setModal({ visible: true, message: "Failed to approve visitor", success: false });

        setTimeout(() => {
          setModal(prev => ({ ...prev, visible: false }));
        }, 1500);
      } finally {
        setLoading(false);
      }
    };

    // ─── Deny Visitor ─────────────────────────────────────────────────────────
    const denyVisitor = async () => {
      try {
        setLoading(true);

        await visitorServices.denyVisitor(visit.id);
        await cancelVisitorNotification();

        setAllowStatus(0);

        // ✅ UPDATED
        setModal({ visible: true, message: "Visitor Denied", success: true });

        setTimeout(() => {
          setModal(prev => ({ ...prev, visible: false })); // ✅ CLOSE MODAL
          if (onGoBack) onGoBack();
          navigation.goBack();
        }, 1200);

      } catch (e) {
        setModal({ visible: true, message: "Failed to deny visitor", success: false });
      } finally {
        setLoading(false);
      }
    };

    // ─── Mark Attendance ──────────────────────────────────────────────────────
    const markAttendance = async (value) => {
      try {
        setLoading(true);

        await visitorServices.visitAttended(visit.id, value);

        setAttendedStatus(value);
        setModal({
          visible: true,
          message: value === 1 ? "Visitor Attended" : "Visitor Not Visited",
          success: true
        });

      }
      catch (e) {
        setModal({ visible: true, message: "Failed to deny visitor", success: false });

        setTimeout(() => {
          setModal(prev => ({ ...prev, visible: false }));
        }, 1500);
      } finally {
        setLoading(false);
      }
    };

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>

        <AppHeader
          title="Visit Detail"
          nightMode={nightMode}
          showBack
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView contentContainerStyle={{ padding: 16 }}>

          <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
            <Text style={styles.statusText}>{status.text}</Text>
          </View>

          <Image
            source={{ uri: visit?.image || "https://via.placeholder.com/400" }}
            style={styles.image}
          />

          <View style={[styles.card, { backgroundColor: theme.card }]}>

            <Text style={[styles.name, { color: theme.text }]}>
              {visit?.name}
            </Text>

            <View style={styles.row}>
              <Ionicons name="call-outline" size={16} color={theme.sub} />
              <Text style={[styles.subText, { color: theme.sub }]}>
                {visit?.mobile}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.rowBetween}>
              <Text style={[styles.label, { color: theme.sub }]}>Purpose</Text>
              <Text style={[styles.value, { color: theme.text }]}>{visit?.purpose}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.rowBetween}>
              <Text style={[styles.label, { color: theme.sub }]}>Flat No</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {(() => {
                  try {
                    return JSON.parse(visit?.whom_to_meet)?.[0]?.flat_no ?? "—";
                  } catch {
                    return "—";
                  }
                })()}
              </Text>
            </View>

            {/* ✅ ADDED FIELDS */}

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.rowBetween}>
              <Text style={[styles.label, { color: theme.sub }]}>Extra Visitors</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {visit?.extra_visitors ?? 0}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.rowBetween}>
              <Text style={[styles.label, { color: theme.sub }]}>Entry Time</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {formatDateTime(visit?.start_time)}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.rowBetween}>
              <Text style={[styles.label, { color: theme.sub }]}>Exit Time</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {formatDateTime(visit?.end_time)}
              </Text>
            </View>

          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              disabled={!isPending || loading}
              onPress={allowVisitor}
              style={[styles.button, { backgroundColor: theme.success, opacity: isPending ? 1 : 0.3 }]}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Allow</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              disabled={!isPending || loading}
              onPress={denyVisitor}
              style={[styles.button, { backgroundColor: theme.danger, opacity: isPending ? 1 : 0.3 }]}
            >
              <Text style={styles.btnText}>Deny</Text>
            </TouchableOpacity>

            {/* <TouchableOpacity
            disabled={!isAllowed || loading}
            onPress={() => markAttendance(1)}
            style={[styles.button, { backgroundColor: theme.success, opacity: isAllowed ? 1 : 0.3 }]}
          >
            <Text style={styles.btnText}>Attended</Text>
          </TouchableOpacity> */}

            {/* <TouchableOpacity
            disabled={!isAllowed || loading}
            onPress={() => markAttendance(0)}
            style={[styles.button, { backgroundColor: theme.grey, opacity: isAllowed ? 1 : 0.3 }]}
          >
            <Text style={styles.btnText}>Not Visited</Text>
          </TouchableOpacity> */}
          </View>

        </ScrollView>

        <Modal transparent visible={modal.visible} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Ionicons
                name={modal.success ? "checkmark-circle-outline" : "close-circle-outline"}
                size={40}
                color={modal.success ? theme.success : theme.danger}
                style={{ marginBottom: 10 }}
              />

              <Text style={{
                fontSize: 16,
                fontWeight: "600",
                color: modal.success ? theme.success : theme.danger,
                textAlign: "center"
              }}>
                {modal.message}
              </Text>
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
      marginVertical: 12
    },
    card: {
      padding: 14,
      borderRadius: 12,
      marginBottom: 20,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2
    },
    name: {
      fontSize: 18,
      fontWeight: "700",
      marginBottom: 6
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6
    },
    subText: {
      fontSize: 14
    },
    divider: {
      height: 1,
      marginVertical: 10
    },
    rowBetween: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center"
    },
    label: {
      fontSize: 13
    },
    value: {
      fontSize: 13,
      fontWeight: "600"
    },
    buttonRow: {
      flexDirection: "row",
      gap: 10,
      flexWrap: "wrap"
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: "center",
      minWidth: "45%"
    },
    btnText: {
      color: "#fff",
      fontWeight: "600"
    },
    statusBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginBottom: 4
    },
    statusText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "700"
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "center",
      alignItems: "center"
    },
    modalBox: {
      backgroundColor: "#fff",
      padding: 24,
      borderRadius: 16,
      width: "80%",
      alignItems: "center"
    },
    modalButton: {
      marginTop: 15,
      backgroundColor: "#2E8BC0",
      paddingHorizontal: 28,
      paddingVertical: 10,
      borderRadius: 8
    }
  });