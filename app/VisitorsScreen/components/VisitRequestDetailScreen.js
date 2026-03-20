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
  const onGoBack = route.params?.onGoBack;

  const [allowLoading, setAllowLoading] = useState(false);
  const [denyLoading, setDenyLoading]   = useState(false);

  const [modal, setModal] = useState({
    visible: false,
    message: "",
    success: true
  });

  const [allowStatus, setAllowStatus]       = useState(visit?.allow ?? null);
  const [attendedStatus, setAttendedStatus] = useState(visit?.attended ?? null);

  const theme = {
    bg:      nightMode ? "#121212" : "#F3F4F6",
    card:    nightMode ? "#1E1E1E" : "#FFFFFF",
    text:    nightMode ? "#FFFFFF" : "#111827",
    sub:     nightMode ? "#9CA3AF" : "#6B7280",
    border:  nightMode ? "#2C2C2C" : "#E5E7EB",
    success: "#10B981",
    danger:  "#EF4444",
    grey:    "#6B7280",
    primary: "#2E8BC0"
  };

  const isPending   = allowStatus === null;
  const isDenied    = allowStatus === 0;
  const isAllowed   = allowStatus === 1 && attendedStatus === null;
  const isCompleted = allowStatus === 1 && attendedStatus !== null;

  const getStatus = () => {
    if (isDenied)                            return { text: "REJECTED",    color: theme.grey    };
    if (isCompleted && attendedStatus === 1) return { text: "ATTENDED",    color: theme.success };
    if (isCompleted && attendedStatus === 0) return { text: "NOT VISITED", color: theme.grey    };
    if (isAllowed)                           return { text: "APPROVED",    color: theme.primary };
    return                                          { text: "PENDING",     color: theme.danger  };
  };

  const status = getStatus();

  const formatDateTime = (date) => {
    if (!date) return "—";
    const d = new Date(date.replace(" ", "T"));
    return isNaN(d.getTime()) ? "—" : d.toLocaleString();
  };

  // ✅ Safe flat_no — handles both string and already-parsed object
  const getFlatNo = () => {
    try {
      const parsed =
        typeof visit?.whom_to_meet === "string"
          ? JSON.parse(visit.whom_to_meet)
          : visit?.whom_to_meet;
      return parsed?.[0]?.flat_no ?? "—";
    } catch {
      return "—";
    }
  };

  const closeModal = () => setModal(prev => ({ ...prev, visible: false }));

  // ─── Allow Visitor ────────────────────────────────────────────────────────
  const allowVisitor = async () => {
    try {
      setAllowLoading(true);

      const flat_no = getFlatNo(); // ✅ no raw JSON.parse crash

      await visitorServices.acceptVisitor(visit.id, flat_no);

      // ✅ Don't let notification cancel crash the success flow
      try { await cancelVisitorNotification(); } catch {}

      setAllowStatus(1);
      setModal({ visible: true, message: "Visitor Approved", success: true });

      setTimeout(() => {
        closeModal();
        if (onGoBack) onGoBack();
        navigation.goBack();
      }, 1200);

    } catch (e) {
      setModal({ visible: true, message: "Failed to approve visitor", success: false });
      setTimeout(closeModal, 1500);
    } finally {
      setAllowLoading(false);
    }
  };

  // ─── Deny Visitor ─────────────────────────────────────────────────────────
  const denyVisitor = async () => {
    try {
      setDenyLoading(true);

      // ✅ FIXED: removed res.status check — was throwing error even on success
      // because backend doesn't always return { status: "success" }
      await visitorServices.denyVisitor(visit.id);

      // ✅ Don't let notification cancel crash the success flow
      try { await cancelVisitorNotification(); } catch {}

      setAllowStatus(0);
      setModal({ visible: true, message: "Visitor Denied", success: true });

      setTimeout(() => {
        closeModal();
        if (onGoBack) onGoBack();
        navigation.goBack();
      }, 1200);

    } catch (e) {
      setModal({
        visible: true,
        message: e?.message || "Failed to deny visitor",
        success: false
      });
      setTimeout(closeModal, 1500);
    } finally {
      setDenyLoading(false);
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

          <Text style={[styles.name, { color: theme.text }]}>{visit?.name}</Text>

          <View style={styles.row}>
            <Ionicons name="call-outline" size={16} color={theme.sub} />
            <Text style={[styles.subText, { color: theme.sub }]}>{visit?.mobile}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.rowBetween}>
            <Text style={[styles.label, { color: theme.sub }]}>Purpose</Text>
            <Text style={[styles.value, { color: theme.text }]}>{visit?.purpose ?? "—"}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.rowBetween}>
            <Text style={[styles.label, { color: theme.sub }]}>Flat No</Text>
            <Text style={[styles.value, { color: theme.text }]}>{getFlatNo()}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.rowBetween}>
            <Text style={[styles.label, { color: theme.sub }]}>Extra Visitors</Text>
            <Text style={[styles.value, { color: theme.text }]}>{visit?.extra_visitors ?? 0}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.rowBetween}>
            <Text style={[styles.label, { color: theme.sub }]}>Entry Time</Text>
            <Text style={[styles.value, { color: theme.text }]}>{formatDateTime(visit?.start_time)}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.rowBetween}>
            <Text style={[styles.label, { color: theme.sub }]}>Exit Time</Text>
            <Text style={[styles.value, { color: theme.text }]}>{formatDateTime(visit?.end_time)}</Text>
          </View>

        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            disabled={!isPending || allowLoading || denyLoading}
            onPress={allowVisitor}
            style={[
              styles.button,
              { backgroundColor: theme.success, opacity: isPending && !denyLoading ? 1 : 0.3 }
            ]}
          >
            {allowLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Allow</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!isPending || allowLoading || denyLoading}
            onPress={denyVisitor}
            style={[
              styles.button,
              { backgroundColor: theme.danger, opacity: isPending && !allowLoading ? 1 : 0.3 }
            ]}
          >
            {denyLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Deny</Text>
            }
          </TouchableOpacity>
        </View>

      </ScrollView>

      <Modal
        transparent
        visible={modal.visible}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableOpacity activeOpacity={1} style={styles.modalOverlay} onPress={closeModal}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalBox}>

              <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <Ionicons
                name={modal.success ? "checkmark-circle-outline" : "close-circle-outline"}
                size={48}
                color={modal.success ? "#10B981" : "#EF4444"}
                style={{ marginBottom: 12 }}
              />

              <Text style={[styles.modalText, { color: modal.success ? "#10B981" : "#EF4444" }]}>
                {modal.message}
              </Text>

            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
};

export default VisitDetailScreen;

const styles = StyleSheet.create({
  image:    { width: "100%", height: 180, borderRadius: 12, marginVertical: 12 },
  card: {
    padding: 14, borderRadius: 12, marginBottom: 20,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2
  },
  name:       { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  row:        { flexDirection: "row", alignItems: "center", gap: 6 },
  subText:    { fontSize: 14 },
  divider:    { height: 1, marginVertical: 10 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label:      { fontSize: 13 },
  value:      { fontSize: 13, fontWeight: "600" },
  buttonRow:  { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  button: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    alignItems: "center", minWidth: "45%"
  },
  btnText:     { color: "#fff", fontWeight: "600" },
  statusBadge: {
    alignSelf: "flex-start", paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 20, marginBottom: 4
  },
  statusText:   { color: "#fff", fontSize: 12, fontWeight: "700" },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center", alignItems: "center"
  },
  modalBox: {
    backgroundColor: "#fff", padding: 24, borderRadius: 16,
    width: "80%", alignItems: "center", position: "relative"
  },
  modalText: { fontSize: 16, fontWeight: "600", textAlign: "center" },
  closeBtn:  { position: "absolute", top: 10, right: 10, padding: 5 },
});