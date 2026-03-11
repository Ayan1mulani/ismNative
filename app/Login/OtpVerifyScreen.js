import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
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

  const { otpData, identity } = route.params || {};

  const { loadPermissions } = usePermissions();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const [accounts, setAccounts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [authToken, setAuthToken] = useState(null);

  const [showError, setShowError] = useState(false);
  const [errorTitle, setErrorTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const ALLOWED_ROLES = ["Member", "resident", "tenant", "member"];

  /* ===============================
        SAVE USER & NAVIGATE

        logMeIn returns same shape as login
        but id field comes as JSON string —
        we fix it to equal unit_id so all
        API calls like getMyBalance work correctly
  =============================== */

  const saveUserAndNavigate = async (userData) => {

  let cleanData = { ...userData };

  // 🔥 Fix ID if backend sends JSON string
  if (typeof cleanData.id === "string" && cleanData.id.startsWith("{")) {
    try {
      const parsed = JSON.parse(cleanData.id);

      cleanData.id = parsed.unit_id;
      cleanData.unit_id = parsed.unit_id;
      cleanData.flat_no = parsed.flat_no;
      cleanData.role_id = parsed.group_id;
      cleanData.societyId = parsed.society_id;

    } catch (e) {
      console.log("Failed to parse id:", e);
    }
  }

  // Ensure id = unit_id (same as normal login)
  if (cleanData.unit_id) {
    cleanData.id = cleanData.unit_id;
  }

  console.log("FINAL USER STORED:", cleanData);

  const role = cleanData?.role?.toLowerCase();

  const ALLOWED_ROLES = ["member", "resident", "tenant"];

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

        Sends token in URL + full account
        object in body — server validates
        token (who you are) and reads account
        body (which account to log into)
  =============================== */
  const loginWithAccount = async (account, token) => {

    try {

      const logMeInResponse = await ismServices.logMeIn(token, account);

      console.log("LOGMEIN RESPONSE:", JSON.stringify(logMeInResponse, null, 2));

      if (logMeInResponse.status === "success") {
        const user = await AsyncStorage.getItem("userInfo");
console.log(JSON.parse(user));

        await saveUserAndNavigate(logMeInResponse.data);

      } else {

        setErrorTitle("Login Failed");
        setErrorMessage(logMeInResponse?.message || "Unable to login.");
        setShowError(true);

      }

    } catch (error) {

      console.log("loginWithAccount error:", error);
      setErrorTitle("Login Failed");
      setErrorMessage("Something went wrong. Please try again.");
      setShowError(true);

    }

  };

  /* ===============================
        VERIFY OTP
  =============================== */
  const handleVerifyOtp = async () => {

    if (loading) return;

    if (!otp || otp.length < 4) {
      setErrorTitle("Invalid OTP");
      setErrorMessage("Please enter a valid OTP.");
      setShowError(true);
      return;
    }

    setLoading(true);

    try {

      const payload = {
        id:  otpData?.id,
        otp: otp
      };

      const response = await ismServices.verifyOtp(payload);

      console.log("VERIFY OTP RESPONSE:", JSON.stringify(response, null, 2));

      if (response.status === "success") {

        const token = response.data.token;

        // Keep in state for modal account select flow
        setAuthToken(token);

        const accountResponse = await ismServices.getMyAccounts(token);

        console.log("GET ACCOUNTS RESPONSE:", JSON.stringify(accountResponse, null, 2));

        if (accountResponse.status === "success") {

          if (accountResponse.data.length > 1) {
            // Multiple accounts — show picker modal
            setAccounts(accountResponse.data);
            setModalVisible(true);
            return;
          }

          // Single account — login directly
          await loginWithAccount(accountResponse.data[0], token);

        } else {

          setErrorTitle("Account Error");
          setErrorMessage(accountResponse?.message || "Failed to fetch accounts.");
          setShowError(true);

        }

      } else {

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

  /* ===============================
        ACCOUNT SELECT
  =============================== */
  const handleAccountSelect = async (selectedUser) => {

    setModalVisible(false);

    try {

      // authToken safely set before modal opened
      await loginWithAccount(selectedUser, authToken);

    } catch (error) {

      console.log("Account select error:", error);
      setErrorTitle("Login Failed");
      setErrorMessage("Unable to login. Please try again.");
      setShowError(true);

    }

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