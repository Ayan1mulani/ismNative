import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from "react-native";

import { useNavigation, useRoute, CommonActions } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ismServices } from "../../services/ismServices";
import BRAND from "../config";

import AccountSelectorModal from "./SelectUserMode";
import ErrorPopupModal from "../PopUps/MessagePop";

const OtpVerifyScreen = () => {

  const navigation = useNavigation();
  const route = useRoute();

  const { otpData, phone } = route.params;

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const [accounts, setAccounts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [showError, setShowError] = useState(false);
  const [errorTitle, setErrorTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleVerifyOtp = async () => {

    if (!otp || otp.length < 4) {
      setErrorTitle("Invalid OTP");
      setErrorMessage("Please enter a valid OTP.");
      setShowError(true);
      return;
    }

    setLoading(true);

    try {

      const payload = {
        id: otpData.id,
        otp: otp
      };

      const response = await ismServices.verifyOtp(payload);

      console.log("VERIFY OTP RESPONSE:", response);

      if (response.status === "multipleLogin") {

        setAccounts(response.data);
        setModalVisible(true);

      }
      else if (response.status === "success") {

        await AsyncStorage.setItem(
          "userInfo",
          JSON.stringify(response.data)
        );

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "MainApp" }]
          })
        );

      }
      else {

        setErrorTitle("Verification Failed");
        setErrorMessage(response?.message || "Invalid OTP");
        setShowError(true);

      }

    } catch (error) {

      console.log("OTP VERIFY ERROR:", error);

      setErrorTitle("Error");
      setErrorMessage("Something went wrong. Please try again.");
      setShowError(true);

    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelect = async (selectedUserId) => {

    setModalVisible(false);

    try {

      const payload = {
        user_id: selectedUserId.user_id,
        identity: phone,
        otp: otp
      };

      const response = await ismServices.verifyOtp(payload);

      if (response.status === "success") {

        await AsyncStorage.setItem(
          "userInfo",
          JSON.stringify(response.data)
        );

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "MainApp" }]
          })
        );

      }

    } catch (error) {
      console.log("Account select error:", error);
    }
  };

  return (

    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >

      <Text style={styles.heading}>Verify OTP</Text>

      <Text style={styles.subText}>
        Enter OTP sent to {phone}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter OTP"
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleVerifyOtp}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Verifying..." : "Verify OTP"}
        </Text>
      </TouchableOpacity>

      {/* Bottom modal (slides from bottom) */}

      <AccountSelectorModal
        visible={modalVisible}
        accounts={accounts}
        onSelect={handleAccountSelect}
        onClose={() => setModalVisible(false)}
      />

      {/* Error Popup */}

      <ErrorPopupModal
        visible={showError}
        onClose={() => setShowError(false)}
        title={errorTitle}
        message={errorMessage}
        type="error"
        buttonText="OK"
      />

    </KeyboardAvoidingView>

  );

};

export default OtpVerifyScreen;

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: "center",
    padding: 25
  },

  heading: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 10
  },

  subText: {
    fontSize: 14,
    marginBottom: 30
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center"
  },

  button: {
    backgroundColor: BRAND.COLORS.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center"
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16
  }

});