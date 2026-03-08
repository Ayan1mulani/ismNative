import React from "react";
import { View, StyleSheet, ScrollView, Dimensions, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RenderHtml from "react-native-render-html";
import AppHeader from "../components/AppHeader";

const { width } = Dimensions.get("window");

const NoticeDetailScreen = ({ route }) => {
  const { notice } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Notice Details" showBack />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{notice.subject}</Text>

        <Text style={styles.meta}>
          {notice.category} •{" "}
          {new Date(notice.published_at).toLocaleDateString()}
        </Text>

        <View style={{ marginTop: 16 }}>
          <RenderHtml
            contentWidth={width - 32}
            source={{ html: notice.notice }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NoticeDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  meta: {
    marginTop: 6,
    fontSize: 13,
    color: "#6B7280",
  },
});