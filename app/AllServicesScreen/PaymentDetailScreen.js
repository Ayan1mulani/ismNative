import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking
} from "react-native";
import AppHeader from "../components/AppHeader";

const PaymentDetailScreen = ({ route }) => {

  const payment = route.params?.payment || {};

  const isCredit =
    payment.type === "CREDIT" || payment.p_type === "CR";

  const openReceipt = () => {
    if (payment.url) Linking.openURL(payment.url);
  };

  const formatAmount = (amt) => {
    return parseFloat(amt || 0).toFixed(0);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F4F6F9" }}>

      <AppHeader title="Payment Details" />

      <ScrollView contentContainerStyle={{ padding: 16 }}>

        {/* Amount Card */}
        <View style={{
          backgroundColor: "#fff",
          padding: 20,
          borderRadius: 16,
          marginBottom: 12,
          alignItems: "center"
        }}>
          <Text style={{
            fontSize: 26,
            fontWeight: "800",
            color: isCredit ? "#16A34A" : "#EF4444"
          }}>
            ₹ {formatAmount(payment.amount)}
          </Text>

          <Text style={{
            marginTop: 6,
            fontSize: 13,
            color: "#6B7280"
          }}>
            {isCredit ? "Credit" : "Debit"}
          </Text>
        </View>

        {/* Details Card */}
        <View style={{
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: 16,
          marginBottom: 12
        }}>

          <Row label="Status" value={payment.status} />
          <Row label="Type" value={payment.type} />
          <Row label="Mode" value={payment.mode} />
          <Row label="Flat No" value={payment.flat_no} />
          <Row label="Date" value={payment.transaction_date_time} />
          <Row label="Remarks" value={payment.remarks} />
          <Row label="Sequence No" value={payment.sequence_no} />
          <Row label="URN" value={payment.urn} />

        </View>

        {/* Receipt Button */}
        {payment.url && (
          <TouchableOpacity
            onPress={openReceipt}
            style={{
              backgroundColor: "#1996D3",
              padding: 14,
              borderRadius: 10,
              alignItems: "center"
            }}
          >
            <Text style={{
              color: "#fff",
              fontWeight: "600"
            }}>
              View Receipt
            </Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </View>
  );
};

const Row = ({ label, value }) => {
  if (!value) return null;

  return (
    <View style={{
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderColor: "#eee"
    }}>
      <Text style={{ color: "#6B7280", fontSize: 13 }}>
        {label}
      </Text>

      <Text style={{
        color: "#111827",
        fontSize: 13,
        fontWeight: "600",
        maxWidth: "60%",
        textAlign: "right"
      }}>
        {value}
      </Text>
    </View>
  );
};

export default PaymentDetailScreen;