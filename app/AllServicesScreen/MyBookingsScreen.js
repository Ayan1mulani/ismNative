import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePermissions } from "../../Utils/ConetextApi";
import { otherServices } from "../../services/otherServices";
import AppHeader from "../components/AppHeader";
import Ionicons from "react-native-vector-icons/Ionicons";

const MyBookingsScreen = ({ navigation }) => {
  const { nightMode } = usePermissions();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const theme = {
    background: nightMode ? "#0F172A" : "#F9FAFB",
    text: nightMode ? "#F1F5F9" : "#111827",
    card: nightMode ? "#1E293B" : "#FFFFFF",
    border: nightMode ? "#334155" : "#E5E7EB",
    primary: "#1996D3",
  };

  useEffect(() => {
    fetchBookings();
  }, []);
const fetchBookings = async () => {
  try {
    setLoading(true);

    const response = await otherServices.getMyAmenityBookings();

    if (response?.status === "success") {
      const allBookings = response.data || [];

      const sortedBookings = [...allBookings].sort((a, b) => {
        return new Date(b.booking_from) - new Date(a.booking_from);
      });

      setBookings(sortedBookings);
    } else {
      setBookings([]);
    }
  } catch (error) {
    console.log("Fetch bookings error:", error);
    setBookings([]);
  } finally {
    setLoading(false);
  }
};
  const renderItem = ({ item }) => {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        {item.location?.image?.[0] && (
          <Image
            source={{ uri: item.location.image[0] }}
            style={styles.image}
          />
        )}

        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.text }]}>
            {item.location?.name}
          </Text>

          <Text style={[styles.date, { color: theme.text }]}>
            From: {item.booking_from}
          </Text>

          <Text style={[styles.date, { color: theme.text }]}>
            To: {item.booking_to}
          </Text>
        </View>

        < Ionicons
          name="calendar-outline"
          size={20}
          color={theme.primary}
        />
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <AppHeader title="My Bookings" />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.primary}
          style={{ marginTop: 30 }}
        />
      ) : bookings.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.text }]}>
          No bookings found
        </Text>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </SafeAreaView>
  );
};

export default MyBookingsScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  date: {
    fontSize: 13,
    marginBottom: 3,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 15,
  },
});