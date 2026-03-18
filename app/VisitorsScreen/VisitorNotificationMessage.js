import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { navigate } from "../../NavigationService";

const VisitorNotificationMessage = ({ route }) => {
  const { message } = route.params || {};

  const handleOk = () => {
    // 🔥 Go to Visitors tab
    navigate("MainApp", {
      screen: "Visitors",
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔔 Visitor Alert</Text>

      <Text style={styles.message}>
        {message || "Visitor is at the gate. Please allow them."}
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleOk}>
        <Text style={styles.buttonText}>OK</Text>
      </TouchableOpacity>
    </View>
  );
};

export default VisitorNotificationMessage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#555",
  },
  button: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});