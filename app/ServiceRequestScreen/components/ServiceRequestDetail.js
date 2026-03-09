import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  StatusBar,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import { complaintService } from "../../../services/complaintService";
import { usePermissions } from "../../../Utils/ConetextApi";
import AppHeader from "../../components/AppHeader";

const BRAND_BLUE = "#1996D3";

/*
 * ─────────────────────────────────────────────────────────────────────────────
 *  KEYBOARD STRATEGY (Best cross-platform approach)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  iOS:
 *    • behavior="padding"  → KAV adds bottom padding equal to keyboard height.
 *    • keyboardVerticalOffset = StatusBar height + AppHeader height (~90px).
 *      This tells KAV where the top of the KAV is so it doesn't over-pad.
 *    • Works perfectly because iOS keyboard pushes a known frame change.
 *
 *  Android:
 *    • The #1 recommended fix is  android:windowSoftInputMode="adjustResize"
 *      in AndroidManifest.xml <activity> tag. This makes the OS resize the
 *      window when the keyboard opens — no JS needed at all.
 *    • With adjustResize set, behavior="padding" on Android is a safe no-op.
 *    • If you CANNOT edit AndroidManifest (e.g. Expo managed workflow), use
 *      behavior="height" as a fallback — it shrinks the KAV container height.
 *
 *  AndroidManifest.xml addition (inside your <activity ...> tag):
 *    android:windowSoftInputMode="adjustResize"
 *
 *  Why NOT adjustPan?
 *    • adjustPan just moves the whole screen up blindly — it can cut off the
 *      header and gives no control over what scrolls.
 *
 *  Why NOT "position" behavior on iOS?
 *    • It uses absolute positioning under the hood which breaks scroll + KAV
 *      interaction on complex layouts.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Offset = StatusBar (varies: ~44 notch iPhone, ~20 older) + AppHeader (~56)
// Using 90 is safe for most devices. If using react-navigation, you can import
// useHeaderHeight() from '@react-navigation/elements' for a precise value.
const KAV_OFFSET = Platform.OS === "ios" ? 90 : 30;

// ── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  Open:          { label: "Open",        color: BRAND_BLUE,  bg: "#CCE7FF", icon: "radio-button-on"    },
  WIP:           { label: "In Progress", color: "#E67E00",   bg: "#FFF3CD", icon: "sync"               },
  "In Progress": { label: "In Progress", color: "#E67E00",   bg: "#FFF3CD", icon: "sync"               },
  Pending:       { label: "Pending",     color: "#F59E0B",   bg: "#FEF3C7", icon: "time-outline"        },
  Closed:        { label: "Closed",      color: "#28A745",   bg: "#D4EDDA", icon: "checkmark-circle"    },
  Resolved:      { label: "Resolved",    color: "#28A745",   bg: "#D4EDDA", icon: "checkmark-circle"    },
  Completed:     { label: "Completed",   color: "#28A745",   bg: "#D4EDDA", icon: "checkmark-circle"    },
};

const getStatusConfig = (status) =>
  STATUS_CONFIG[status] || {
    label: status || "Unknown",
    color: "#6B7280",
    bg: "#E9ECEF",
    icon: "help-circle-outline",
  };

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateString) => {
  if (!dateString || dateString === "0000-00-00") return null;
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch {
    return dateString;
  }
};

// ── InfoRow ──────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value, theme }) => {
  if (!value || value === "-") return null;
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: theme.sub }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
const ServiceRequestDetailScreen = () => {
  const route      = useRoute();
  const navigation = useNavigation();
  const { nightMode } = usePermissions();
  const complaint  = route.params?.complaint || {};

  const scrollRef = useRef(null);

  const [comments,    setComments]    = useState([]);
  const [message,     setMessage]     = useState("");
  const [ratingModal, setRatingModal] = useState(false);
  const [rating,      setRating]      = useState(0);
  const [feedback,    setFeedback]    = useState("");

  const theme = nightMode
    ? { bg: "#0F0F14", card: "#18181F", text: "#fff",  sub: "#9CA3AF", border: "#2C2C2C", inputBg: "#252525" }
    : { bg: "#F4F6FA", card: "#fff",   text: "#111",  sub: "#6B7280", border: "#E5E7EB", inputBg: "#F3F4F6" };

  // ── Derived state ───────────────────────────────────────────────────────────
  const isClosed  = ["Closed", "Resolved", "Completed"].includes(complaint.status);
  const hasRating = complaint.rating !== null &&
                    complaint.rating !== undefined &&
                    parseFloat(complaint.rating) > 0;

  const statusConfig = getStatusConfig(complaint.status);

  const statusHistory = (() => {
    try {
      return JSON.parse(complaint.data || "{}")?.status_history || [];
    } catch {
      return [];
    }
  })();

  // ── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => { loadComments(); }, []);

  // ── API calls ───────────────────────────────────────────────────────────────
  const loadComments = async () => {
    try {
      const res = await complaintService.getComplaintComments(complaint.id);
      setComments(res || []);
    } catch (e) { console.log(e); }
  };

  const sendComment = async () => {
    if (!message.trim()) return;
    try {
      await complaintService.addComment(complaint.id, message);
      setMessage("");
      loadComments();
      // Scroll to bottom after sending so new comment is visible
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    } catch (e) { console.log(e); }
  };

  const submitRating = async () => {
    if (!rating) {
      Alert.alert("Rating Required", "Please select a star rating before submitting.");
      return;
    }
    try {
      const payload = {
        ...complaint,
        status:           "Closed",
        rating:           String(rating),
        resident_remarks: feedback,
      };
      await complaintService.updateComplaintStatus(payload, "Closed");
      setRatingModal(false);
      Alert.alert("Thank you!", "Your rating has been submitted.");
      navigation.goBack();
    } catch (e) { console.log(e); }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    /*
     * SafeAreaView edges={["bottom"]} — only apply safe area to the bottom.
     * The top safe area is handled by AppHeader, so we skip it here to
     * prevent double padding that would break the KAV offset calculation.
     */
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={["bottom"]}>
      <AppHeader title={complaint.complaint_type_name || "Service Request"} />

      {/*
       * KeyboardAvoidingView wraps [ScrollView + commentBox] as siblings.
       *
       * iOS:   behavior="padding" + keyboardVerticalOffset=90
       *        → KAV shrinks its bottom padding by keyboard height minus offset.
       *          The commentBox (in normal flow) is pushed up exactly right.
       *
       * Android: behavior="padding" is safe here because adjustResize in
       *          AndroidManifest already handles the resize. If you haven't
       *          set adjustResize, change this to "height" for Android.
       */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={KAV_OFFSET}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Card 1: Main Details ── */}
          <View style={[styles.card, { backgroundColor: theme.card }]}>

            {/* Header: #number + status badge */}
            <View style={styles.cardHeader}>
              <Text style={[styles.requestNo, { color: BRAND_BLUE }]}>
                #{complaint.com_no || complaint.id}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                <Ionicons name={statusConfig.icon} size={13} color={statusConfig.color} style={{ marginRight: 4 }} />
                <Text style={[styles.statusText, { color: statusConfig.color }]}>
                  {statusConfig.label}
                </Text>
              </View>
            </View>

            {/* Title + description */}
            <Text style={[styles.subCategory, { color: theme.sub }]}>
              {complaint.sub_category}
            </Text>
            <Text style={[styles.description, { color: theme.text }]}>
              {complaint.description || "No description provided."}
            </Text>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            {/* Data fields */}
            <InfoRow label="Added By"   value={complaint.createdBy}        theme={theme} />
            <InfoRow label="Updated By" value={complaint.updatedBy}        theme={theme} />
            <InfoRow label="Block"      value={complaint.block}            theme={theme} />
            <InfoRow label="Unit"       value={complaint.display_unit_no}  theme={theme} />
            <InfoRow label="Severity"   value={complaint.severity}         theme={theme} />
            <InfoRow label="Phone"      value={complaint.phone_no}         theme={theme} />
            {complaint.probable_date && complaint.probable_date !== "0000-00-00" && (
              <InfoRow
                label="Scheduled"
                value={`${formatDate(complaint.probable_date)}  •  ${complaint.probable_time || ""}`}
                theme={theme}
              />
            )}

            {/* Staff remarks */}
            {!!complaint.remarks && (
              <>
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                <Text style={[styles.remarksLabel, { color: theme.sub }]}>Staff Remarks</Text>
                <Text style={[styles.remarksText, { color: theme.text }]}>
                  {complaint.remarks}
                </Text>
              </>
            )}
          </View>

          {/* ── Card 2: Rating display (closed + has rating) ── */}
          {isClosed && hasRating && (
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Rating</Text>
              <View style={{ flexDirection: "row", marginBottom: 8 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons
                    key={s}
                    name={s <= parseFloat(complaint.rating) ? "star" : "star-outline"}
                    size={24}
                    color="#F59E0B"
                    style={{ marginRight: 4 }}
                  />
                ))}
              </View>
              {!!complaint.resident_remarks && (
                <Text style={[styles.remarksText, { color: theme.sub }]}>
                  "{complaint.resident_remarks}"
                </Text>
              )}
            </View>
          )}

          {/* ── Action Buttons ── */}
          {isClosed && !hasRating && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#F59E0B" }]}
              onPress={() => setRatingModal(true)}
            >
              <Ionicons name="star-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>Rate this Service</Text>
            </TouchableOpacity>
          )}

          {!isClosed && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#22C55E" }]}
              onPress={() => setRatingModal(true)}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.actionBtnText}>Mark as Closed</Text>
            </TouchableOpacity>
          )}

          {/* ── Card 3: Status History ── */}
          {statusHistory.length > 0 && (
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Status History</Text>
              {statusHistory.map((item, index) => {
                const sc = getStatusConfig(item.status);
                return (
                  <View key={index} style={styles.historyRow}>
                    <View style={[styles.historyDot, { backgroundColor: sc.color }]} />
                    <Text style={[styles.historyStatus, { color: sc.color }]}>{item.status}</Text>
                    <Text style={[styles.historyTime, { color: theme.sub }]}>
                      {formatDate(item.timestamp)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* ── Card 4: Activities / Comments ── */}
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Activities {comments.length > 0 ? `(${comments.length})` : ""}
            </Text>

            {comments.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.sub }]}>No comments yet.</Text>
            ) : (
              comments.map((item) => (
                <View key={item.id} style={styles.commentRow}>
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={16} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.commentName, { color: theme.text }]}>{item.name}</Text>
                    <Text style={[styles.commentText, { color: theme.sub }]}>{item.remarks}</Text>
                    <Text style={styles.timeText}>{formatDate(item.created_at)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/*
         * Comment box sits as a NORMAL FLOW sibling of ScrollView inside KAV.
         * When the keyboard opens:
         *   iOS   → KAV adds padding at the bottom, pushing this box up.
         *   Android → adjustResize shrinks the window, this box naturally
         *             moves up with the layout.
         * NEVER use position: "absolute" here — it breaks KAV on both platforms.
         */}
        <View style={[styles.commentBox, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
          <TextInput
            placeholder="Add a comment..."
            placeholderTextColor={theme.sub}
            value={message}
            onChangeText={setMessage}
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text }]}
            returnKeyType="send"
            onSubmitEditing={sendComment}
            /*
             * blurOnSubmit=false keeps keyboard open after sending on iOS
             * so the user can type multiple messages without re-tapping.
             */
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: message.trim() ? BRAND_BLUE : theme.border }]}
            onPress={sendComment}
            disabled={!message.trim()}
          >
            <Ionicons name="send" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── Rating / Close Modal ── */}
      <Modal visible={ratingModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {isClosed ? "Rate the Service" : "Close & Rate"}
            </Text>
            <Text style={styles.modalSubtitle}>
              {isClosed
                ? "How satisfied are you with the resolution?"
                : "Mark this request as closed and leave a rating."}
            </Text>

            <View style={{ flexDirection: "row", justifyContent: "center", marginVertical: 16 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setRating(s)} style={{ padding: 4 }}>
                  <Ionicons
                    name={s <= rating ? "star" : "star-outline"}
                    size={36}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              placeholder="Write your feedback (optional)"
              value={feedback}
              onChangeText={setFeedback}
              style={styles.feedbackInput}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#E5E7EB" }]}
                onPress={() => { setRatingModal(false); setRating(0); setFeedback(""); }}
              >
                <Text style={{ color: "#374151", fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#22C55E" }]}
                onPress={submitRating}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ServiceRequestDetailScreen;

const styles = StyleSheet.create({
  // ── Cards ──
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  requestNo: {
    fontSize: 15,
    fontWeight: "700",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  subCategory: {
    fontSize: 13,
    marginBottom: 6,
    textTransform: "capitalize",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },

  // ── Info rows ──
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "right",
  },
  remarksLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  remarksText: {
    fontSize: 13,
    lineHeight: 19,
  },

  // ── Section ──
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },

  // ── Action button ──
  actionBtn: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  // ── History ──
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  historyStatus: {
    fontSize: 13,
    fontWeight: "600",
    marginRight: 8,
    flex: 1,
  },
  historyTime: {
    fontSize: 12,
  },

  // ── Comments ──
  emptyText: {
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 8,
  },
  commentRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BRAND_BLUE,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    flexShrink: 0,
  },
  commentName: {
    fontWeight: "600",
    fontSize: 13,
    marginBottom: 2,
  },
  commentText: {
    fontSize: 13,
    lineHeight: 18,
  },
  timeText: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },

  // ── Comment box ──
  commentBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    fontSize: 14,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#fff",
    width: "88%",
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: "#ffffff",
    borderRadius: 8,
    padding: 10,
    height: 80,
    fontSize: 14,
  },
  modalBtns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  modalBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});