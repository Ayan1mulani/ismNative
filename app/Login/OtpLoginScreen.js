import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommonActions } from "@react-navigation/native";
import { LoginSrv } from "../../services/LoginSrv";

const OtpLoginScreen = ({ navigation }) => {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpId, setOtpId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOtp = async () => {
    if (mobile.length !== 10) {
      alert("Enter valid 10 digit mobile number");
      return;
    }

    try {
      setLoading(true);

      const res = await LoginSrv.generateOtp({
        identity: mobile,
        app_roles: ["member", "resident", "tenant"],
      });

      if (res.data.status === "success") {
        setOtpId(res.data.data.id);
        setTimer(600);
      } else {
        alert(res.data.message);
      }
    } catch (error) {
      alert("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      alert("Enter OTP");
      return;
    }

    try {
      setLoading(true);

      const res = await LoginSrv.validateOtp({
        id: otpId,
        otp: otp,
      });

      if (res.data.status === "success") {
        await AsyncStorage.setItem(
          "userInfo",
          JSON.stringify(res.data.data)
        );

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "MainApp" }],
          })
        );
      } else {
        alert("Invalid OTP");
      }
    } catch (error) {
      alert("OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Login via OTP</Text>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Mobile Number"
          keyboardType="number-pad"
          maxLength={10}
          value={mobile}
          onChangeText={setMobile}
          style={styles.input}
        />
      </View>

      {!otpId ? (
        <TouchableOpacity
          style={styles.button}
          onPress={handleSendOtp}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Send OTP</Text>
          )}
        </TouchableOpacity>
      ) : (
        <>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Enter OTP"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              style={styles.input}
            />
          </View>

          <Text style={styles.timer}>
            {timer > 0
              ? `Expires in ${Math.floor(timer / 60)}:${(
                  "0" + (timer % 60)
                ).slice(-2)}`
              : "OTP Expired"}
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={handleVerifyOtp}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                Verify OTP
              </Text>
            )}
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ marginTop: 20 }}
      >
        <Text style={{ color: "#1565A9" }}>
          Back to Login
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default OtpLoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 30,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 12,
    height: 55,
    justifyContent: "center",
  },
  input: {
    fontSize: 16,
  },
  button: {
    backgroundColor: "#1996D3",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
  timer: {
    textAlign: "center",
    marginBottom: 15,
  },
});