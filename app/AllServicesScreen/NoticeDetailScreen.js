import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import AppHeader from "../components/AppHeader";

const { height } = Dimensions.get("window");

// Wraps raw HTML fragment in a full styled document
const buildHtml = (bodyContent = "") => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          max-width: 100%;
        }
      body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 15px;
  line-height: 1.7;
  color: #374151;
  padding: 4px 2px 24px 2px;

  /* 🔥 FIX START */
  overflow-x: hidden;
  word-break: break-word;
  overflow-wrap: break-word;
}
        h1, h2, h3, h4, h5, h6 {
          color: #111827;
          margin-top: 16px;
          margin-bottom: 8px;
          font-weight: 700;
        }
        p {
          margin-bottom: 12px;
        }
        ul, ol {
          padding-left: 20px;
          margin-bottom: 12px;
        }
        li {
          margin-bottom: 4px;
        }
        a {
          color: #1565A9;
          text-decoration: underline;
        }
        img {
          max-width: 100%;
          height: auto;
          border-radius: 6px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
           table-layout: fixed;
  word-break: break-word;
        }
        th, td {
          border: 1px solid #E5E7EB;
          padding: 8px 10px;
          text-align: left;
          font-size: 14px;
        }
        th {
          background-color: #F3F4F6;
          font-weight: 600;
          color: #111827;
        }
        blockquote {
          border-left: 3px solid #1565A9;
          padding-left: 12px;
          color: #6B7280;
          font-style: italic;
          margin-bottom: 12px;
        }
        strong, b {
          font-weight: 700;
          color: #111827;
        }
        hr {
          border: none;
          border-top: 1px solid #E5E7EB;
          margin: 16px 0;
        }
          p, div, span, td, th {
  word-break: break-word;
  overflow-wrap: break-word;
}
      </style>
    </head>
    <body>
      ${bodyContent}
    </body>
  </html>
`;

const NoticeDetailScreen = ({ route }) => {
  const { notice } = route.params;
  const [loading, setLoading] = useState(true);

  const formattedDate = notice.published_at
    ? new Date(notice.published_at).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    : "";

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Notice Details" showBack />

      {/* Static header — title + meta */}
      <View style={styles.header}>
        <Text style={styles.title}>{notice.subject}</Text>
        <Text style={styles.meta}>
          {notice.category}
          {notice.category && formattedDate ? " • " : ""}
          {formattedDate}
        </Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* WebView for HTML body */}
      <View style={styles.webViewWrapper}>
        {loading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="small" color="#1565A9" />
          </View>
        )}

        <WebView
          originWhitelist={["*"]}
          source={{ html: buildHtml(notice.notice) }}
          style={styles.webView}
          onLoadEnd={() => setLoading(false)}
          scrollEnabled
          javaScriptEnabled={false}
          domStorageEnabled={false}
          mixedContentMode="never"

          onShouldStartLoadWithRequest={(request) => {
            const url = request.url;

            // ✅ Allow safe links only
            if (
              url.startsWith("http://") ||
              url.startsWith("https://") ||
              url.startsWith("about:blank")
            ) {
              return true;
            }

            // ❌ Block dangerous protocols
            if (
              url.startsWith("javascript:") ||
              url.startsWith("data:")
            ) {
              console.log("Blocked malicious URL:", url);
              return false;
            }

            return false;
          }}
        />
      </View>
    </SafeAreaView>
  );
};

export default NoticeDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 26,
  },
  meta: {
    marginTop: 6,
    fontSize: 13,
    color: "#6B7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F2F4",
    marginHorizontal: 16,
  },
  webViewWrapper: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 4,
  },
  loaderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    zIndex: 10,
  },
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },
});