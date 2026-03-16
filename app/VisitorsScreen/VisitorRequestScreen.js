import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";

export default function VisitorCallScreen({ route }) {

  const { visitor } = route.params || {};

  if (!visitor) {
    return (
      <View style={styles.container}>
        <Text>No visitor data</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Visitor Photo */}
      <Image
        source={{
          uri: visitor.image || "https://via.placeholder.com/150"
        }}
        style={styles.avatar}
      />

      {/* Visitor Name */}
      <Text style={styles.title}>{visitor.name}</Text>

      {/* Visitor Details */}
      <View style={styles.details}>

        <Text style={styles.label}>Phone:</Text>
        <Text style={styles.value}>{visitor.mobile}</Text>

        <Text style={styles.label}>Purpose:</Text>
        <Text style={styles.value}>{visitor.purpose}</Text>

        <Text style={styles.label}>Visitor ID:</Text>
        <Text style={styles.value}>#{visitor.id}</Text>

        <Text style={styles.label}>Time:</Text>
        <Text style={styles.value}>
          {visitor.start_time
            ? new Date(visitor.start_time).toLocaleString()
            : "—"}
        </Text>

      </View>

      {/* Accept / Decline Buttons */}
      <View style={styles.buttons}>

        <TouchableOpacity style={styles.decline}>
          <Text style={styles.text}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.accept}>
          <Text style={styles.text}>Accept</Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20
  },

  title: {
    fontSize: 26,
    fontWeight: "bold"
  },

  details: {
    marginTop: 20,
    width: "100%"
  },

  label: {
    fontSize: 14,
    color: "#777",
    marginTop: 10
  },

  value: {
    fontSize: 18,
    fontWeight: "600"
  },

  buttons: {
    flexDirection: "row",
    marginTop: 40
  },

  accept: {
    backgroundColor: "green",
    padding: 18,
    borderRadius: 8,
    marginHorizontal: 10
  },

  decline: {
    backgroundColor: "red",
    padding: 18,
    borderRadius: 8,
    marginHorizontal: 10
  },

  text: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16
  }

});