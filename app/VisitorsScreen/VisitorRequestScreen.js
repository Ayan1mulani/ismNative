import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from 'react-native-linear-gradient';
import { usePermissions } from "../../Utils/ConetextApi";
import { visitorServices } from "../../services/visitorServices";

const { width } = Dimensions.get("window");

const VisitDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { nightMode } = usePermissions();

  const visit = route.params?.visit;

  const [allowStatus, setAllowStatus] = useState(visit?.allow);
  const [attendedStatus, setAttendedStatus] = useState(visit?.attended);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ visible: false, message: "", success: true });

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const modalScale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (modal.visible) {
      Animated.spring(modalScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }).start();
    } else {
      modalScale.setValue(0.85);
    }
  }, [modal.visible]);

  // ─── Theme ────────────────────────────────────────────────────────────────
  const theme = nightMode
    ? {
        bg: "#0A0F1E",
        surface: "#111827",
        card: "#1A2235",
        text: "#F1F5F9",
        sub: "#8B9BB4",
        border: "rgba(255,255,255,0.07)",
        heroBg: ["#0A0F1E", "#111827"],
      }
    : {
        bg: "#F0F4FA",
        surface: "#FFFFFF",
        card: "#FFFFFF",
        text: "#0F172A",
        sub: "#64748B",
        border: "rgba(0,0,0,0.06)",
        heroBg: ["#1E3A5F", "#2E8BC0"],
      };

  const palette = {
    success: "#22C55E",
    danger: "#F43F5E",
    warning: "#F59E0B",
    grey: "#64748B",
    primary: "#3B82F6",
    cyan: "#06B6D4",
  };

  // ─── Button Logic ─────────────────────────────────────────────────────────
  const enableAllowDeny = allowStatus === null && attendedStatus === null;
  const enableAttendance = allowStatus === 1 && attendedStatus === null;

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleAllowDeny = async (value) => {
    try {
      setLoading(true);
      await visitorServices.allowVisit({ allow: value, visitId: visit.id });
      setAllowStatus(value);
      setModal({ visible: true, message: value === 1 ? "Visitor Allowed ✓" : "Visitor Denied", success: value === 1 });
    } catch {
      setModal({ visible: true, message: "Action failed. Try again.", success: false });
    } finally {
      setLoading(false);
    }
  };

  const handleAttendance = async (value) => {
    try {
      setLoading(true);
      await visitorServices.visitAttended({ visit_id: visit.id, attended: value });
      setAttendedStatus(value);
      setModal({ visible: true, message: value === 1 ? "Marked as Attended ✓" : "Marked as Not Visited", success: value === 1 });
    } catch {
      setModal({ visible: true, message: "Failed to update attendance.", success: false });
    } finally {
      setLoading(false);
    }
  };

  // ─── Status ───────────────────────────────────────────────────────────────
  const getStatus = () => {
    if (allowStatus === 0)                         return { text: "REJECTED",    color: palette.grey,    icon: "close-circle",     glow: "#64748B33" };
    if (allowStatus === null)                      return { text: "PENDING",     color: palette.warning, icon: "time",             glow: "#F59E0B33" };
    if (allowStatus === 1 && attendedStatus === null) return { text: "APPROVED", color: palette.cyan,    icon: "checkmark-circle", glow: "#06B6D433" };
    if (attendedStatus === 1)                      return { text: "ATTENDED",    color: palette.success, icon: "person-done",      glow: "#22C55E33" };
    return                                                { text: "NOT VISITED", color: palette.grey,    icon: "person-remove",    glow: "#64748B33" };
  };

  const status = getStatus();

  // ─── Info Row ─────────────────────────────────────────────────────────────
  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      <View style={[styles.iconWrap, { backgroundColor: theme.border }]}>
        <Ionicons name={icon} size={15} color={palette.cyan} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.infoLabel, { color: theme.sub }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
      </View>
    </View>
  );

  // ─── Action Button ────────────────────────────────────────────────────────
  const ActionButton = ({ label, icon, color, onPress, disabled }) => {
    const pressAnim = useRef(new Animated.Value(1)).current;

    const onPressIn = () => Animated.spring(pressAnim, { toValue: 0.95, useNativeDriver: true }).start();
    const onPressOut = () => Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true }).start();

    return (
      <Animated.View style={[{ flex: 1, transform: [{ scale: pressAnim }] }]}>
        <TouchableOpacity
          disabled={disabled}
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={disabled ? ["#2A3344", "#2A3344"] : [color + "DD", color]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.actionBtn, { opacity: disabled ? 0.35 : 1 }]}
          >
            <Ionicons name={icon} size={18} color="#fff" style={{ marginRight: 7 }} />
            <Text style={styles.btnText}>{label}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      {/* ── HERO ── */}
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: visit?.image }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.82)"]}
          style={StyleSheet.absoluteFill}
        />

        {/* Back button */}
        <SafeAreaView style={styles.heroHeader} edges={["top"]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Visit Detail</Text>
          <View style={{ width: 38 }} />
        </SafeAreaView>

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: status.glow, borderColor: status.color + "66" }]}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
        </View>

        {/* Visitor name on hero */}
        <View style={styles.heroFooter}>
          <Text style={styles.heroName}>{visit?.name}</Text>
          <View style={styles.heroMobile}>
            <Ionicons name="call" size={13} color="rgba(255,255,255,0.7)" />
            <Text style={styles.heroMobileText}>{visit?.mobile}</Text>
          </View>
        </View>
      </View>

      {/* ── SCROLLABLE BODY ── */}
      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── INFO CARD ── */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardHeading, { color: theme.sub }]}>VISIT INFORMATION</Text>
            <InfoRow icon="compass-outline" label="Purpose" value={visit?.purpose ?? "—"} />
            <View style={[styles.sep, { backgroundColor: theme.border }]} />
            <InfoRow icon="calendar-outline" label="Date" value={visit?.date ?? "—"} />
            {visit?.notes ? (
              <>
                <View style={[styles.sep, { backgroundColor: theme.border }]} />
                <InfoRow icon="document-text-outline" label="Notes" value={visit.notes} />
              </>
            ) : null}
          </View>

          {/* ── SECTION LABEL ── */}
          <Text style={[styles.sectionLabel, { color: theme.sub }]}>ACTIONS</Text>

          {/* ── ALLOW / DENY ── */}
          <View style={styles.buttonRow}>
            <ActionButton
              label="Allow"
              icon="checkmark-circle-outline"
              color={palette.success}
              disabled={!enableAllowDeny}
              onPress={() => handleAllowDeny(1)}
            />
            <ActionButton
              label="Deny"
              icon="close-circle-outline"
              color={palette.danger}
              disabled={!enableAllowDeny}
              onPress={() => handleAllowDeny(0)}
            />
          </View>

          {/* ── ATTENDANCE ── */}
          <View style={styles.buttonRow}>
            <ActionButton
              label="Attended"
              icon="person-add-outline"
              color={palette.cyan}
              disabled={!enableAttendance}
              onPress={() => handleAttendance(1)}
            />
            <ActionButton
              label="Not Visited"
              icon="person-remove-outline"
              color={palette.grey}
              disabled={!enableAttendance}
              onPress={() => handleAttendance(0)}
            />
          </View>

          {/* ── STATE HINT ── */}
          {!enableAllowDeny && !enableAttendance && (
            <View style={[styles.hintBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="information-circle-outline" size={16} color={theme.sub} />
              <Text style={[styles.hintText, { color: theme.sub }]}>
                {allowStatus === 0
                  ? "This visit was denied. No further actions available."
                  : attendedStatus !== null
                  ? "Attendance has been recorded for this visit."
                  : "Awaiting allow/deny action."}
              </Text>
            </View>
          )}
        </Animated.View>
      </Animated.ScrollView>

      {/* ── MODAL ── */}
      <Modal transparent visible={modal.visible} animationType="fade" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalBox, { transform: [{ scale: modalScale }] }]}>
            <LinearGradient
              colors={modal.success ? ["#0D2E1E", "#0F1E2E"] : ["#2E0D16", "#1E0F14"]}
              style={styles.modalGradient}
            >
              <View style={[styles.modalIconCircle, { backgroundColor: (modal.success ? palette.success : palette.danger) + "22" }]}>
                <Ionicons
                  name={modal.success ? "checkmark-circle" : "alert-circle"}
                  size={36}
                  color={modal.success ? palette.success : palette.danger}
                />
              </View>
              <Text style={[styles.modalMessage, { color: modal.success ? palette.success : palette.danger }]}>
                {modal.message}
              </Text>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: modal.success ? palette.success : palette.danger }]}
                onPress={() => { setModal({ ...modal, visible: false }); navigation.goBack(); }}
              >
                <Text style={styles.modalBtnText}>Done</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>

      {/* ── LOADER ── */}
      {loading && (
        <View style={styles.loader}>
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color={palette.cyan} />
            <Text style={styles.loaderText}>Processing…</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default VisitDetailScreen;

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // ── Hero ──
  heroContainer: {
    height: 310,
    width: "100%",
    position: "relative",
    justifyContent: "space-between",
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  heroFooter: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  heroName: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroMobile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  heroMobileText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "500",
  },

  // ── Status badge ──
  statusBadge: {
    position: "absolute",
    top: 80,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },

  // ── Card ──
  card: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeading: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 4,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  sep: {
    height: 1,
    marginVertical: 10,
    marginLeft: 44,
  },

  // ── Section label ──
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 14,
  },

  // ── Buttons ──
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 14,
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  // ── Hint ──
  hintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  hintText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: width * 0.82,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
  modalGradient: {
    padding: 28,
    alignItems: "center",
  },
  modalIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: 0.2,
  },
  modalBtn: {
    paddingHorizontal: 40,
    paddingVertical: 13,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
  },
  modalBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.3,
  },

  // ── Loader ──
 loader: {
  ...StyleSheet.absoluteFill,
  backgroundColor: "rgba(0,0,0,0.55)",
  justifyContent: "center",
  alignItems: "center",
},
  loaderBox: {
    backgroundColor: "#1A2235",
    padding: 28,
    borderRadius: 20,
    alignItems: "center",
    gap: 12,
  },
  loaderText: {
    color: "#8B9BB4",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});