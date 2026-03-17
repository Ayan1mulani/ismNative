import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import ProviderSelector from "../components/ProviderSelector";
import CalendarSelector from "../components/Calender";
import StatusModal from "../../components/StatusModal";
import { visitorServices } from "../../../services/visitorServices";
import { useNavigation } from "@react-navigation/native";
import BRAND from "../../config";
import SubmitButton from "../../components/SubmitButton";
import { useRoute } from "@react-navigation/native";


const SingleDeliveryForm = ({ theme }) => {
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [visitDate, setVisitDate] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [errors, setErrors] = useState({});
  const navigation = useNavigation();

  const route = useRoute();
  const onGoBack = route.params?.onGoBack;

  const handleSubmit = async () => {
    let newErrors = {};

    if (!selectedProvider) {
      newErrors.provider = "Please select delivery company";
    }

    if (!visitDate) {
      newErrors.date = "Please select visit date";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      const formattedDate =
        visitDate instanceof Date
          ? visitDate.toISOString().split("T")[0]
          : visitDate;

      const payload = {
        date_time: formattedDate,
        company_name: selectedProvider?.name || selectedProvider,
        type: "delivery",
      };
      setModalType("loading");
      const res = await visitorServices.addMyVisitor(payload);
      if (res) {
        setModalType("success");

        setTimeout(() => {
          setModalType(null);

          if (onGoBack) {
            onGoBack(); // ✅ refresh VisitorSection
          }

          navigation.goBack();
        }, 1400);
      } else {
        setModalType("error");
        setTimeout(() => setModalType(null), 2000);
      }
    } catch (error) {
      setModalType("error");
      setTimeout(() => setModalType(null), 2000);
    }
  };

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Provider */}
        <ProviderSelector
          visitorType="delivery"
          theme={theme}
          required={true}
          selectedProvider={selectedProvider}
          setSelectedProvider={(val) => {
            setSelectedProvider(val);
            if (errors.provider)
              setErrors((prev) => ({ ...prev, provider: null }));
          }}
          stylesFromParent={styles}
        />
        {errors.provider && (
          <Text style={styles.errorText}>{errors.provider}</Text>
        )}

        {/* Visit Date */}
        <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
          <CalendarSelector
            selectedDate={visitDate}
            onDateSelect={(date) => {
              setVisitDate(date);
              if (errors.date)
                setErrors((prev) => ({ ...prev, date: null }));
            }}
            label="Visit Date"
            required={true}
            nightMode={false}
          />
          {errors.date && (
            <Text style={styles.errorText}>{errors.date}</Text>
          )}
        </View>

        {/* Submit */}
        <SubmitButton
          title="Schedule Delivery"
          onPress={handleSubmit}
          loading={modalType === "loading"}
        />
      </ScrollView>

      {/* Reusable Modal */}
      <StatusModal
        visible={!!modalType}
        type={modalType}
        title={
          modalType === "loading"
            ? "Scheduling..."
            : modalType === "success"
              ? "Delivery Scheduled"
              : "Failed!"
        }
        subtitle={
          modalType === "loading"
            ? "Please wait"
            : modalType === "success"
              ? "Delivery pass created"
              : "Please try again"
        }
      />
    </>
  );
};


export default SingleDeliveryForm;

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 16,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
  },

  phoneRow: {
    flexDirection: "row",
    gap: 8,
  },

  countryCode: {
    width: 60,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  phoneInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
  },

  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  counterBtn: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  counterText: {
    fontSize: 18,
    fontWeight: "600",
  },

  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
    position: "relative",
    bottom: 0,
    marginHorizontal: '3%',
    backgroundColor: BRAND.COLORS.button
  },

  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});