import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";

const ACTIONS = [
  { id: "1", title: "Pass", icon: "create-outline", screen: "Visitors" },
  { id: "2", title: "Amenities", icon: "bookmark-outline", screen: "AmenitiesListScreen" },
  { id: "3", title: "Raise", icon: "alert-circle-outline", screen: "RaiseComplaintScreen" },
  { id: "4", title: "Bookings", icon: "calendar-outline", screen: "MyBookings" },
  { id: "5", title: "My Vehicles", icon: "car-outline", screen: "MyVehiclesScreen" },
];

const QuickActionsScreen = () => {
  const navigation = useNavigation();

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() => navigation.navigate(item.screen)}
    >
      <View style={styles.iconWrapper}>
        < Ionicons name={item.icon} size={22} color="#fff" />
      </View>
      <Text style={styles.label} numberOfLines={1}>{item.title}</Text>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={ACTIONS}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.row}
    />
  );
};

export default QuickActionsScreen;

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 16,
    alignItems: "center",
    marginLeft: 10, // To offset the first gap
  },
  card: {
    alignItems: "center",
    gap: 6,
    width: 60,
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#5a7cc6",
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
  },
});