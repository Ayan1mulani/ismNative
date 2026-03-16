import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator
} from "react-native";
import { visitorServices } from "../../services/visitorServices";
import { cancelVisitorNotification } from "../../Utils/VisitorNotification";
import notifee from "@notifee/react-native";

export default function VisitorCallScreen({ notification }) {

  // Notifee passes the notification object as a prop to full-screen components
  const data      = notification?.data || {};
  const visitId   = data.visitId;
  const visitor   = data.visitor ? JSON.parse(data.visitor) : null;

  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [result, setResult]   = useState("");

  const dismiss = async () => {
    await cancelVisitorNotification();
    await notifee.stopForegroundService();   // closes the full-screen overlay
  };

  const handleAccept = async () => {
    try {
      setLoading(true);
      await visitorServices.acceptVisitor({ visit_id: visitId });
      setResult("✅ Visitor Accepted");
      setDone(true);
    } catch (e) {
      setResult("Failed to accept");
      setDone(true);
    } finally {
      setLoading(false);
      await dismiss();
    }
  };

  const handleDecline = async () => {
    try {
      setLoading(true);
      await visitorServices.denyVisitor({ visit_id: visitId });
      setResult("❌ Visitor Declined");
      setDone(true);
    } catch (e) {
      setResult("Failed to decline");
      setDone(true);
    } finally {
      setLoading(false);
      await dismiss();
    }
  };

  if (!visitId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No visitor data</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <Image
        source={{ uri: visitor?.image || "https://via.placeholder.com/150" }}
        style={styles.avatar}
      />

      <Text style={styles.title}>{visitor?.name || "Visitor"}</Text>
      <Text style={styles.subtitle}>is requesting entry</Text>

      {visitor?.mobile ? (
        <Text style={styles.detail}>📞 {visitor.mobile}</Text>
      ) : null}

      {visitor?.purpose ? (
        <Text style={styles.detail}>📋 {visitor.purpose}</Text>
      ) : null}

      {done ? (

        <Text style={styles.resultText}>{result}</Text>

      ) : (

        <View style={styles.buttons}>

          <TouchableOpacity
            style={styles.decline}
            onPress={handleDecline}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Decline</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.accept}
            onPress={handleAccept}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Accept</Text>
            }
          </TouchableOpacity>

        </View>

      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#0f0f0f"
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "#fff"
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff"
  },
  subtitle: {
    fontSize: 16,
    color: "#aaa",
    marginTop: 4,
    marginBottom: 16
  },
  detail: {
    fontSize: 15,
    color: "#ccc",
    marginTop: 6
  },
  buttons: {
    flexDirection: "row",
    marginTop: 40,
    gap: 20
  },
  accept: {
    backgroundColor: "#10B981",
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 50
  },
  decline: {
    backgroundColor: "#EF4444",
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 50
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16
  },
  resultText: {
    marginTop: 40,
    fontSize: 20,
    fontWeight: "700",
    color: "#fff"
  },
  errorText: {
    color: "#aaa",
    fontSize: 16
  }
});