import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import CalendarSelector from "../components/Calender";
import { visitorServices } from "../../../services/visitorServices";
import StatusModal from "../../components/StatusModal";
import SubmitButton from "../../components/SubmitButton";
import BRAND from "./../../config";

const SingleVisitorForm = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const theme = {
    cardBg: "#FFFFFF",
    text: "#1F2937",
    textSecondary: "#6B7280",
    inputBg: "#F9FAFB",
    border: "#E5E7EB",
    primaryBlue: "#1996D3",
  };

  const [visitorName, setVisitorName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [visitDate, setVisitDate] = useState(null);
  const [vehicleNo, setVehicleNo] = useState("");
  const [selectedParking, setSelectedParking] = useState(null);
  const [modalType, setModalType] = useState(null);

  /* ===============================
     RECEIVE PARKING SLOT
     =============================== */

  useEffect(() => {
    if (route.params?.selectedParking) {
      setSelectedParking(route.params.selectedParking);

      // clear param so it doesn't trigger again
      navigation.setParams({ selectedParking: undefined });
    }
  }, [route.params?.selectedParking]);

  /* ===============================
     FORMAT PARKING DATE
     =============================== */

  const formatParkingDateRange = (from, to) => {
    if (!from || !to) return "";

    const start = new Date(from);
    const end = new Date(to);
    const today = new Date();

    const isSameDay = start.toDateString() === end.toDateString();

    const isToday =
      start.toDateString() === today.toDateString() &&
      end.toDateString() === today.toDateString();

    const formatDate = (date) =>
      date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      });

    if (isToday) return "Today";
    if (isSameDay) return formatDate(start);

    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  /* ===============================
     SUBMIT VISITOR
     =============================== */

  const handleSubmit = async () => {
    if (!visitorName || !mobileNumber || !visitDate) return;

    try {
      setModalType("loading");

      const formattedDate =
        visitDate instanceof Date
          ? visitDate.toISOString().split("T")[0]
          : visitDate;

      // 1️⃣ Create Visitor
      const visitorRes = await visitorServices.addMyVisitor({
        date_time: formattedDate,
        mobile: mobileNumber,
        name: visitorName,
        type: "guest",
      });

      const visitorId = visitorRes?.data?.id;

      // 2️⃣ Book Parking if selected
      if (visitorId && selectedParking) {
        await visitorServices.bookParking({
          booking_from: selectedParking.booking_from,
          booking_to: selectedParking.booking_to,
          location_id: selectedParking.location_id,
          reference_id: visitorId,
          data: {
            name: visitorName,
            phone_no: mobileNumber,
            vehicle_no: vehicleNo || "",
            type: "PARKING",
          },
        });
      }

      setModalType("success");

      setTimeout(() => {
        setModalType(null);
        navigation.goBack();
      }, 1200);

    } catch (err) {
      console.log("Error:", err);
      setModalType("error");
      setTimeout(() => setModalType(null), 2000);
    }
  };

  /* ===============================
     UI
     =============================== */

  return (
    <>
      {/* Visitor Name */}
      <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
        <Text style={[styles.label, { color: theme.text }]}>
          Visitor Name *
        </Text>

        <TextInput
          value={visitorName}
          onChangeText={setVisitorName}
          placeholder="Enter visitor name"
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.input,
            { backgroundColor: theme.inputBg, borderColor: theme.border },
          ]}
        />
      </View>

      {/* Mobile */}
      <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
        <Text style={[styles.label, { color: theme.text }]}>
          Mobile Number *
        </Text>

        <TextInput
          value={mobileNumber}
          onChangeText={setMobileNumber}
          keyboardType="phone-pad"
          maxLength={10}
          placeholder="Enter 10-digit mobile"
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.input,
            { backgroundColor: theme.inputBg, borderColor: theme.border },
          ]}
        />
      </View>

      {/* Date */}
      <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
        <CalendarSelector
          selectedDate={visitDate}
          onDateSelect={setVisitDate}
          label="Scheduled Date"
          required
          nightMode={false}
        />
      </View>

      {/* Vehicle */}
      <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
        <Text style={[styles.label, { color: theme.text }]}>
          Vehicle Number (Last 4 Digits - Optional)
        </Text>

        <TextInput
          value={vehicleNo}
          onChangeText={setVehicleNo}
          keyboardType="number-pad"
          maxLength={4}
          placeholder="0000"
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.input,
            { backgroundColor: theme.inputBg, borderColor: theme.border },
          ]}
        />
      </View>

      {/* Parking */}
      <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
        <Text style={[styles.label, { color: theme.text }]}>
          Need parking?
        </Text>

        <TouchableOpacity
          style={[
            styles.selectButton,
            { backgroundColor: theme.inputBg, borderColor: theme.border },
          ]}
          onPress={() => {
            if (!visitDate) {
              alert("Please select visit date first");
              return;
            }

            navigation.navigate("AmenitiesListScreen", {
              type: "PARKING",
              title: "Parking",
            });
          }}
        >
          < Ionicons name="car" size={20} color={BRAND.COLORS.icon} />

          <Text
            style={[
              styles.selectButtonText,
              { color: theme.textSecondary },
            ]}
          >
           {selectedParking?.booking_from
  ? `${formatParkingDateRange(
      selectedParking.booking_from,
      selectedParking.booking_to
    )} • ${selectedParking.slot}`
  : "Select Parking"}
          </Text>

          < Ionicons
            name="chevron-forward"
            size={20}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Submit */}
      <SubmitButton
        title="Add Visitor"
        onPress={handleSubmit}
        loading={modalType === "loading"}
      />

      <StatusModal visible={!!modalType} type={modalType} />
    </>
  );
};

export default SingleVisitorForm;

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: -10,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    letterSpacing: 1,
  },

  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
  },

  selectButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
});