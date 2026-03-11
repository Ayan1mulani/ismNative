import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import { usePermissions } from "../../Utils/ConetextApi";
import ErrorPopupModal from "../PopUps/MessagePop";
import { ismServices } from "../../services/ismServices";
import BRAND from "../config";

const OtpPhoneScreen = () => {

  const navigation = useNavigation();
  const { nightMode } = usePermissions();

  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  const [showError, setShowError] = useState(false);
  const [errorTitle, setErrorTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const theme = nightMode
    ? {
        bg: "#121212",
        text: "#fff",
        sub: "#B3B3B3",
        inputBg: "#2a2a2a",
        border: "#1565C0"
      }
    : {
        bg: "#f8f9fa",
        text: "#074B7C",
        sub: "#6c757d",
        inputBg: "#fff",
        border: "#1996D3"
      };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSendOtp = async () => {

    if (!inputValue) {
      setErrorTitle("Validation Error");
      setErrorMessage("Enter mobile number or email");
      setShowError(true);
      return;
    }

    const isPhone = /^[0-9]{10}$/.test(inputValue);
    const isEmail = isValidEmail(inputValue);

    if (!isPhone && !isEmail) {
      setErrorTitle("Validation Error");
      setErrorMessage("Enter valid mobile number or email");
      setShowError(true);
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {

      const response = await ismServices.generateOtp(inputValue);

      console.log("OTP RESPONSE:", response);

      if (response?.status === "success") {

        navigation.navigate("OtpVerify", {
          otpData: response.data,
          identity: inputValue
        });

      } else {

        setErrorTitle("Failed");
        setErrorMessage(response?.message || "Failed to send OTP");
        setShowError(true);

      }

    } catch (error) {

      console.log("OTP ERROR:", error);

      setErrorTitle("Error");
      setErrorMessage("Something went wrong");
      setShowError(true);

    } finally {
      setLoading(false);
    }
  };

  return (

    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>

        <SafeAreaView style={styles.inner}>

          <Text style={[styles.heading, { color: theme.text }]}>
            OTP LOGIN
          </Text>

          <Text style={[styles.subText, { color: theme.sub }]}>
            Enter your mobile number or email to receive OTP
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBg,
                color: theme.text,
                borderColor: theme.border
              }
            ]}
            placeholder="Enter Mobile Number or Email"
            placeholderTextColor={nightMode ? "#888" : "#999"}
            keyboardType="default"
            value={inputValue}
            onChangeText={setInputValue}
            editable={!loading}
          />

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: loading ? "#b0b0b0" : BRAND.COLORS.primary }
            ]}
            onPress={handleSendOtp}
            disabled={loading}
          >

            <Text style={styles.buttonText}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </Text>

          </TouchableOpacity>

        </SafeAreaView>

      </TouchableWithoutFeedback>

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

export default OtpPhoneScreen;

const styles = StyleSheet.create({

  container: {
    flex: 1
  },

  inner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },

  heading: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 10
  },

  subText: {
    fontSize: 14,
    marginBottom: 30
  },

  input: {
    width: "90%",
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 20
  },

  button: {
    width: "90%",
    padding: 16,
    borderRadius: 10,
    alignItems: "center"
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16
  }

});