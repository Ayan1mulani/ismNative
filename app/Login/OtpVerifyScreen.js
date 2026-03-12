import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform
} from "react-native";

import {
  useNavigation,
  useRoute,
  CommonActions
} from "@react-navigation/native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { ismServices } from "../../services/ismServices";
import BRAND from "../config";

import AccountSelectorModal from "./SelectUserMode";
import ErrorPopupModal from "../PopUps/MessagePop";

import { usePermissions } from "../../Utils/ConetextApi";
import { RegisterAppOneSignal } from "../../services/oneSignalService";

const OtpVerifyScreen = () => {

  const navigation = useNavigation();
  const route = useRoute();

  const { otpData, identity, message } = route.params || {};

  const { loadPermissions } = usePermissions();

  const inputRef = useRef(null);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const [timer, setTimer] = useState(otpData?.expire_in || 0);

  const [verifyMessage, setVerifyMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [accounts, setAccounts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [authToken, setAuthToken] = useState(null);

  const [showError, setShowError] = useState(false);
  const [errorTitle, setErrorTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const ALLOWED_ROLES = ["member", "resident", "tenant"];

  /* ===============================
        AUTO FOCUS + TIMER
  =============================== */

  useEffect(() => {

    inputRef.current?.focus();

    const interval = setInterval(() => {

      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });

    }, 1000);

    return () => clearInterval(interval);

  }, []);

  const formatTime = () => {

    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;

    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  };

  /* ===============================
        SAVE USER
  =============================== */

  const saveUserAndNavigate = async (userData) => {

    let cleanData = { ...userData };

    if (typeof cleanData.id === "string" && cleanData.id.startsWith("{")) {
      try {

        const parsed = JSON.parse(cleanData.id);

        cleanData.id = parsed.unit_id;
        cleanData.unit_id = parsed.unit_id;
        cleanData.flat_no = parsed.flat_no;
        cleanData.role_id = parsed.group_id;
        cleanData.societyId = parsed.society_id;

      } catch (e) {

        console.log("ID Parse Failed");

      }
    }

    if (cleanData.unit_id) {
      cleanData.id = cleanData.unit_id;
    }

    const role = cleanData?.role?.toLowerCase();

    if (!ALLOWED_ROLES.includes(role)) {

      setErrorTitle("Access Denied");
      setErrorMessage(`This app is not for ${cleanData.role}`);
      setShowError(true);
      return;

    }

    await AsyncStorage.setItem("userInfo", JSON.stringify(cleanData));

    await AsyncStorage.removeItem("permissions");

    await loadPermissions();

    await RegisterAppOneSignal();

    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "MainApp" }]
      })
    );

  };

  /* ===============================
        LOGIN WITH ACCOUNT
  =============================== */

  const loginWithAccount = async (account, token) => {

    try {

      const logMeInResponse = await ismServices.logMeIn(token, account);

      if (logMeInResponse.status === "success") {

        await saveUserAndNavigate(logMeInResponse.data);

      } else {

        setErrorTitle("Login Failed");
        setErrorMessage(logMeInResponse?.message || "Unable to login.");
        setShowError(true);

      }

    } catch (error) {

      setErrorTitle("Login Failed");
      setErrorMessage("Something went wrong.");
      setShowError(true);

    }

  };

  /* ===============================
        VERIFY OTP
  =============================== */

  const handleVerifyOtp = async () => {

    if (!otp || otp.length < 4) {

      setVerifyMessage("Please enter a valid OTP.");
      setMessageType("error");
      return;

    }

    setLoading(true);

    try {

      const response = await ismServices.verifyOtp({
        id: otpData?.id,
        otp
      });

      if (response.status === "success") {

        const token = response.data.token;

        setAuthToken(token);

        const accountResponse = await ismServices.getMyAccounts(token);

        if (accountResponse.data.length > 1) {

          setAccounts(accountResponse.data);
          setModalVisible(true);
          return;

        }

        await loginWithAccount(accountResponse.data[0], token);

      } else {

        setVerifyMessage(response?.message || "Invalid OTP");
        setMessageType("error");

      }

    } catch (error) {

      setVerifyMessage("Something went wrong. Please try again.");
      setMessageType("error");

    } finally {

      setLoading(false);

    }

  };

  /* ===============================
        ACCOUNT SELECT
  =============================== */

  const handleAccountSelect = async (account) => {

    setModalVisible(false);

    await loginWithAccount(account, authToken);

  };

  return (

    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >

      <Text style={styles.heading}>Verify OTP</Text>

      <Text style={styles.subText}>
        Enter OTP sent to {identity}
      </Text>

      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder="Enter OTP"
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
      />

      {/* OTP INFO MESSAGE */}
      {message && (
        <Text style={styles.infoMessage}>
          {message}
        </Text>
      )}

      {/* OTP ERROR MESSAGE */}
      {verifyMessage !== "" && (
        <Text
          style={[
            styles.verifyMessage,
            messageType === "error"
              ? styles.errorText
              : styles.successText
          ]}
        >
          {verifyMessage}
        </Text>
      )}

      {/* TIMER */}
      {timer > 0 && (
        <Text style={styles.timer}>
          OTP expires in {formatTime()}
        </Text>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={handleVerifyOtp}
        disabled={loading}
      >

        <Text style={styles.buttonText}>
          {loading ? "Verifying..." : "Verify OTP"}
        </Text>

      </TouchableOpacity>

      {/* PASSWORD LOGIN OPTION */}
      {verifyMessage !== "" && (
        <TouchableOpacity
          style={styles.altLogin}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.altLoginText}>
            Login with Email & Password
          </Text>
        </TouchableOpacity>
      )}

      <AccountSelectorModal
        visible={modalVisible}
        accounts={accounts}
        onSelect={handleAccountSelect}
        onClose={() => setModalVisible(false)}
      />

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

/* ===============================
        STYLES
=============================== */

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
    marginBottom: 20
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 15,
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center"
  },

  infoMessage: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 5
  },

  verifyMessage: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 10
  },

  errorText: {
    color: "#DC2626"
  },

  successText: {
    color: "#16A34A"
  },

  timer: {
    textAlign: "center",
    color: "#EF4444",
    marginBottom: 20
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
  },

  altLogin: {
    marginTop: 20,
    alignItems: "center"
  },

  altLoginText: {
    color: BRAND.PRIMARY_COLOR,
    fontWeight: "600"
  }

});