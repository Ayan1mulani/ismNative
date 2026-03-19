import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { ismServices } from "../../services/ismServices";
import AppHeader from "../components/AppHeader";
import BRAND from "../config";

const BillPaymentScreen = ({ navigation, route }) => {
  const COLORS = BRAND.COLORS;

  const [billTypes, setBillTypes] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [amount, setAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadBillTypes();
  }, []);

  useEffect(() => {
    if (route?.params?.amount) {
      setAmount(route.params.amount.toString());
    }
  }, []);

  const loadBillTypes = async () => {
    try {
      const res = await ismServices.getBillTypes();

      if (res?.status === "success") {
        const sorted = (res.data || []).sort(
          (a, b) => a.display_order - b.display_order
        );
        setBillTypes(sorted);
      }
    } catch (err) {
      console.log("Bill type error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBillSelect = (item) => {
    setSelectedBill(item);
    setModalVisible(false);
  };

  const handlePayment = async () => {
    try {
      if (!selectedBill) {
        Alert.alert("Error", "Please select bill type");
        return;
      }

      if (!amount || parseFloat(amount) <= 0) {
        Alert.alert("Error", "Enter valid amount");
        return;
      }

      const paymentUrl = await ismServices.makePayment(
        amount,
        selectedBill,
        remark
      );

      Linking.openURL(paymentUrl);

    } catch (error) {
      console.log("Payment error:", error);
      Alert.alert("Error", "Payment failed");
    }
  };

  const renderBillItem = ({ item }) => {
    const isSelected = selectedBill?.id === item.id;

    return (
      <TouchableOpacity
        style={styles.modalItem}
        onPress={() => handleBillSelect(item)}
      >
        <Text style={styles.modalText}>{item.name}</Text>

        {isSelected && (
          <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Make Payment" onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <View style={styles.content}>

          {/* BILL TYPE */}
          <Text style={styles.label}>Select Bill Type</Text>

          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setModalVisible(true)}
          >
            <Text
              style={[
                styles.dropdownText,
                !selectedBill && styles.placeholder,
              ]}
            >
              {selectedBill ? selectedBill.name : "Select bill type"}
            </Text>

            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>

          {/* AMOUNT */}
          <Text style={styles.label}>Enter Amount</Text>

          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="₹ Enter amount"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />

          {/* REMARK */}
          <Text style={styles.label}>Remark (Optional)</Text>

          <TextInput
            value={remark}
            onChangeText={setRemark}
            placeholder="Add remark..."
            placeholderTextColor="#9CA3AF"
            style={[styles.input, { height: 50 }]}
            multiline
          />

          {/* BUTTON */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: COLORS.primary }]}
            onPress={handlePayment}
          >
            <Text style={styles.buttonText}>Make Payment</Text>
          </TouchableOpacity>

        </View>
      )}

      {/* MODAL */}
      <Modal transparent visible={modalVisible} animationType="none">
        <Pressable
          style={styles.overlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={styles.modal}>

            <View style={styles.handle} />

            <Text style={styles.modalTitle}>Select Bill Type</Text>

            <FlatList
              data={billTypes}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderBillItem}
            />

          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default BillPaymentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F9",
  },

  content: {
    padding: 16,
    marginHorizontal: 10

  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 6,
    color: "#111827",
  },

  dropdown: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  dropdownText: {
    fontSize: 14,
    color: "#111827",
  },

  placeholder: {
    color: "#9CA3AF",
  },

  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: 14,
    color: "#111827",
  },

  button: {
    marginTop: 30,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  /* MODAL */

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    maxHeight: "70%",
  },

  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginVertical: 10,
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 20,
    marginBottom: 10,
  },

  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  modalText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
});