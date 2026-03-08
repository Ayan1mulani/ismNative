import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";

import AppHeader from "../components/AppHeader";
import { visitorServices } from "../../services/visitorServices";

const MembersScreen = ({ navigation }) => {

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuIndex, setMenuIndex] = useState(null);

  useEffect(() => {
    loadMembers();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMembers();
    }, [])
  );

  const loadMembers = async () => {
    try {

      const res = await visitorServices.getFamilyMembers();

      if (res?.status === "success") {
        setMembers(res.data || []);
      }

    } catch (error) {
      console.log("Members error:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);

    await loadMembers();

    setRefreshing(false);
  };

  const handleDelete = (memberId) => {

    console.log(memberId)
    Alert.alert(
      "Delete Member",
      "Are you sure you want to delete this member?",
      [
        { text: "Cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {

            try {

              await visitorServices.deleteFamilyMember(memberId);

              setMembers(prev => prev.filter(m => m.id !== memberId));

            } catch (error) {
              console.log(error);
            }

          }
        }
      ]
    );
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.card}>

      {/* Avatar */}
      <View style={styles.avatar}>
        < Ionicons name="person" size={22} color="#6B7280" />
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.sub}>{item.relation}</Text>
        <Text style={styles.sub}>{item.phone_no}</Text>
      </View>

      {/* 3 dots */}
      <TouchableOpacity
        onPress={() => setMenuIndex(menuIndex === index ? null : index)}
      >
        < Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
      </TouchableOpacity>

      {/* Menu */}
      {menuIndex === index && (
        <View style={styles.menu}>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuIndex(null);
              navigation.navigate("AddMember", { member: item });
            }}
          >
            < Ionicons name="create-outline" size={18} color="#111" />
            <Text style={styles.menuText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuIndex(null);
              handleDelete(item.id);
            }}
          >
            < Ionicons name="trash-outline" size={18} color="red" />
            <Text style={[styles.menuText, { color: "red" }]}>
              Delete
            </Text>
          </TouchableOpacity>

        </View>
      )}

    </View>
  );

  return (
    <SafeAreaView style={styles.container}>

      <AppHeader title="Family Members" />

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      ) : (
      <FlatList
  data={members}
  renderItem={renderItem}
  keyExtractor={(item) => item.id.toString()}
  contentContainerStyle={{ padding: 16, flexGrow: 1 }}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={["#1565A9"]}
      tintColor="#1565A9"
    />
  }
/>
      )}

      {/* Floating Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("AddMember")}
      >
        < Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

    </SafeAreaView>
  );
};

export default MembersScreen;

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F4F6F9",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF2F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },

  sub: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },

  menu: {
    position: "absolute",
    top: 40,
    right: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    width: 130,
    paddingVertical: 6,
    elevation: 5,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },

  menuText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#111",
  },

  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1565A9",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },

});