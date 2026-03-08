import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView
} from "react-native";

import { ismServices } from "../../services/ismServices";

const NoticeTickerScreen = () => {

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const translateX = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {

      const res = await ismServices.getMyNotices("TICKER");

      if (res?.status === "success") {
        setNotices(res.data || []);
      }

    } catch (error) {
      console.log("Notice API Error:", error);
    } finally {
      setLoading(false);
      startTicker();
    }
  };

  const startTicker = () => {

    translateX.setValue(400);

    Animated.loop(
      Animated.timing(translateX, {
        toValue: -1000,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  };

  const cleanHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]+>/g, "");
  };

  const openNotice = (notice) => {
    setSelectedNotice(notice);
    setModalVisible(true);
  };

  const tickerText =
    notices.length > 0
      ? notices.map((n) => cleanHtml(n.notice)).join("   •   ")
      : "No notices available";

  return (

    <View style={styles.container}>

      {/* Title */}
      <Text style={styles.title}>Notices</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#1565A9" />
      ) : (

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.tickerBox}
          onPress={() => notices.length > 0 && openNotice(notices[0])}
        >

          <Animated.Text
            numberOfLines={1}
            style={[
              styles.tickerText,
              { transform: [{ translateX }] }
            ]}
          >
            {tickerText}
          </Animated.Text>

        </TouchableOpacity>

      )}

      {/* Modal */}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
      >

        <View style={styles.modalOverlay}>

          <View style={styles.modalContainer}>

            <Text style={styles.modalTitle}>
              {selectedNotice?.subject}
            </Text>

            <ScrollView>

              <Text style={styles.modalText}>
                {cleanHtml(selectedNotice?.notice)}
              </Text>

            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>

          </View>

        </View>

      </Modal>

    </View>
  );
};

export default NoticeTickerScreen;

const styles = StyleSheet.create({

  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#111827"
  },

  tickerBox: {
    height: 40,
    borderRadius: 6,
    backgroundColor: "#f1e3e3",
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: 10
  },

  tickerText: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "500"
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20
  },

  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 18,
    maxHeight: "90%",
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#111827"
  },

  modalText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#374151"
  },

  closeButton: {
    marginTop: 20,
    alignSelf: "flex-end",
    backgroundColor: "#1565A9",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6
  },

  closeText: {
    color: "#FFF",
    fontWeight: "600"
  }

});