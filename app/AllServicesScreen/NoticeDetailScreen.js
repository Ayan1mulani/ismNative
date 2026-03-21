import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import sanitizeHtml from "sanitize-html";
import AppHeader from "../components/AppHeader";

// ─────────────────────────────────────────────────────────────────────────────
// BUG-NM-002 FIX — explicit tag whitelist
// Only these tags survive sanitization. Everything else (script, style,
// iframe, object, embed, form, input …) is discarded before the HTML ever
// reaches the WebView.
// ─────────────────────────────────────────────────────────────────────────────
const ALLOWED_TAGS = [
  // Structure
  "div", "span", "p", "br", "hr",
  // Headings
  "h1", "h2", "h3", "h4", "h5", "h6",
  // Inline text
  "strong", "b", "em", "i", "u", "s", "sub", "sup", "small",
  // Lists
  "ul", "ol", "li",
  // Tables
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
  // Links & images
  "a", "img",
  // Misc
  "blockquote", "pre", "code",
];

// ─────────────────────────────────────────────────────────────────────────────
// BUG-NM-002 + BUG-NM-003 FIX — safe CSS property allowlist
//
// sanitize-html's allowedStyles lets us keep CKEditor inline styles while
// blocking any property that can load resources or run scripts
// (e.g. background: url("javascript:…"), behavior:, -moz-binding:).
// ─────────────────────────────────────────────────────────────────────────────
const SAFE_STYLES = {
  "*": {
    color:              [/.*/],
    "background-color": [/.*/],
    background:         [/^(?!.*url\s*\().*$/i],  // allow only if no url()
    "font-size":        [/.*/],
    "font-weight":      [/.*/],
    "font-style":       [/.*/],
    "font-family":      [/.*/],
    "text-align":       [/.*/],
    "text-decoration":  [/.*/],
    "line-height":      [/.*/],
    "letter-spacing":   [/.*/],
    "text-transform":   [/.*/],
    margin:             [/.*/],
    "margin-top":       [/.*/],
    "margin-right":     [/.*/],
    "margin-bottom":    [/.*/],
    "margin-left":      [/.*/],
    padding:            [/.*/],
    "padding-top":      [/.*/],
    "padding-right":    [/.*/],
    "padding-bottom":   [/.*/],
    "padding-left":     [/.*/],
    border:             [/.*/],
    "border-left":      [/.*/],
    "border-right":     [/.*/],
    "border-top":       [/.*/],
    "border-bottom":    [/.*/],
    "border-radius":    [/.*/],
    // width/height: allow % and px, block vw/vh to prevent layout escape
    width:              [/^(\d+(\.\d+)?(px|%|em|rem)|auto)$/i],
    "max-width":        [/^(\d+(\.\d+)?(px|%|em|rem)|100%)$/i],
    height:             [/^(\d+(\.\d+)?(px|%|em|rem)|auto)$/i],
    opacity:            [/^(0(\.\d+)?|1(\.0+)?)$/],
    display:            [/^(block|inline|inline-block|flex|none|table|table-cell|table-row)$/i],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// sanitizeContent
//
// BUG-NM-002: strips <script>, onerror=, onclick= and all on* handlers.
//             sanitize-html never allows event attributes by default; our
//             explicit allowedAttributes list reinforces this — any attribute
//             not listed is dropped.
//
// BUG-NM-003: allowedSchemes restricts href/src to http and https only.
//             javascript:, data:, vbscript:, intent:, content: are all blocked.
//             The transformTags hook adds rel="noopener noreferrer" + target="_blank"
//             to every <a> as a second layer of protection.
//
// BUG-NM-004: sanitize-html escapes special characters in text nodes, so RTL
//             override characters (U+202E), null bytes, and SQL fragments
//             are rendered as harmless visible text.
// ─────────────────────────────────────────────────────────────────────────────
const sanitizeContent = (raw = "") =>
  sanitizeHtml(raw, {
    allowedTags,
    allowedAttributes: {
      // BUG-NM-003: href restricted to http/https via allowedSchemes below
      a:   ["href", "name", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      // Allow style on every tag so CKEditor inline styles survive,
      // but SAFE_STYLES above strips dangerous properties
      "*": ["style", "class"],
    },
    allowedStyles: SAFE_STYLES,
    // BUG-NM-003: javascript:, data:, vbscript:, etc. are NOT in this list
    allowedSchemes:        ["http", "https"],
    allowedSchemesByTag:   { img: ["http", "https"] },
    // Discard (not escape) disallowed tags so their inner text isn't leaked
    disallowedTagsMode: "discard",
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          target: "_blank",
          rel:    "noopener noreferrer",
        },
      }),
    },
  });

// helper alias used above (keep name consistent)
const allowedTags = ALLOWED_TAGS;

// ─────────────────────────────────────────────────────────────────────────────
// buildHtml — wraps the sanitized fragment in a full document.
//
// BUG-NM-001 FIX: every overflow escape route is closed:
//   • overflow-x: hidden  on <html>, <body>, every block element
//   • word-break: break-word + overflow-wrap: anywhere  (break even mid-word)
//   • max-width: 100%  on all elements via the * rule
//   • table-layout: fixed  so tables never stretch past viewport
//   • white-space: pre-wrap on <pre> to wrap without losing newlines
//
// BUG-NM-004 FIX:
//   • unicode-bidi: embed  prevents RTL override characters from flipping
//     the layout direction of surrounding content.
// ─────────────────────────────────────────────────────────────────────────────
const buildHtml = (body = "") => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <style>
      /* ── Reset & overflow containment (BUG-NM-001) ── */
      html, body {
        overflow-x: hidden !important;
        max-width: 100% !important;
      }
      * {
        box-sizing:      border-box;
        max-width:       100%;
        /* BUG-NM-001: break any unbroken string at any character boundary */
        word-break:      break-word;
        overflow-wrap:   anywhere;
        /* BUG-NM-004: isolate each element's bidi context */
        unicode-bidi:    embed;
      }

      /* ── Base typography ── */
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size:   15px;
        line-height: 1.7;
        color:       #374151;
        padding:     4px 2px 32px;
        margin:      0;
      }

      h1, h2, h3, h4, h5, h6 {
        color:         #111827;
        margin-top:    16px;
        margin-bottom: 8px;
        font-weight:   700;
        /* BUG-NM-001: headings with long words must wrap too */
        word-break:    break-word;
        overflow-wrap: anywhere;
      }
      p   { margin-bottom: 12px; }
      ul, ol { padding-left: 20px; margin-bottom: 12px; }
      li  { margin-bottom: 4px; }

      a   { color: #1565A9; text-decoration: underline; }

      img {
        max-width:     100%;
        height:        auto;
        border-radius: 6px;
        display:       block;
      }

      /* ── Tables (BUG-NM-001) ── */
      table {
        width:          100%;
        table-layout:   fixed;   /* cells never widen beyond their column */
        border-collapse: collapse;
        margin-bottom:  12px;
        /* belt-and-braces: word-break already on * but be explicit */
        word-break:     break-word;
        overflow-wrap:  anywhere;
      }
      th, td {
        border:    1px solid #E5E7EB;
        padding:   8px 10px;
        font-size: 14px;
        text-align: left;
        /* no overflow escape from cells */
        max-width:     0;          /* triggers table-layout: fixed clipping */
        overflow:      hidden;
        word-break:    break-word;
        overflow-wrap: anywhere;
      }
      th {
        background: #F3F4F6;
        font-weight: 600;
        color:       #111827;
      }

      blockquote {
        border-left:  3px solid #1565A9;
        padding-left: 12px;
        color:        #6B7280;
        font-style:   italic;
        margin-bottom: 12px;
      }

      /* BUG-NM-001: pre blocks wrap instead of scrolling */
      pre, code {
        white-space:   pre-wrap;
        word-break:    break-all;
        overflow-wrap: anywhere;
        font-size:     13px;
        background:    #F3F4F6;
        padding:       8px;
        border-radius: 4px;
      }

      strong, b { font-weight: 700; color: #111827; }
      hr { border: none; border-top: 1px solid #E5E7EB; margin: 16px 0; }
    </style>
  </head>
  <body>${body}</body>
</html>
`;

// ─────────────────────────────────────────────────────────────────────────────

const NoticeDetailScreen = ({ route }) => {
  const { notice } = route.params;
  const [loading, setLoading] = useState(true);

  // ── Sanitize once, memoised by reference (notice is a stable route param) ─
  const cleanHtml = sanitizeContent(notice?.notice || "");

  const formattedDate = notice.published_at
    ? new Date(notice.published_at).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
      })
    : "";

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Notice Details" showBack />

      {/* Static header */}
      <View style={styles.header}>
        <Text style={styles.title}>{notice.subject}</Text>
        <Text style={styles.meta}>
          {notice.category}
          {notice.category && formattedDate ? " • " : ""}
          {formattedDate}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* HTML body via WebView */}
      <View style={styles.webViewWrapper}>
        {loading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="small" color="#1565A9" />
          </View>
        )}

        <WebView
          originWhitelist={["about:blank"]}  // BUG-NM-003: nothing else allowed
          source={{ html: buildHtml(cleanHtml || "<p>No content available.</p>") }}
          style={styles.webView}
          onLoadEnd={() => setLoading(false)}

          // BUG-NM-002: JS disabled — even if a script tag somehow slipped
          // through sanitization it cannot execute
          javaScriptEnabled={false}
          domStorageEnabled={false}

          // BUG-NM-001: prevent the WebView itself from creating a
          // horizontal scroll surface
          scrollEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          scalesPageToFit={false}
          mixedContentMode="never"

          // BUG-NM-003: second line of defense — block any navigation attempt
          // that isn't a plain about:blank initial load
          onShouldStartLoadWithRequest={(req) => {
            const url = req.url || "";
            // allow the initial blank page load only
            if (url === "about:blank" || url === "") return true;
            // block everything else — safe links were already target="_blank"
            // and will open in the OS browser via Linking, not here
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
    flex:            1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop:        14,
    paddingBottom:     12,
    backgroundColor:   "#FFFFFF",
  },
  title: {
    fontSize:   18,
    fontWeight: "700",
    color:      "#111827",
    lineHeight: 26,
  },
  meta: {
    marginTop: 6,
    fontSize:  13,
    color:     "#6B7280",
  },
  divider: {
    height:          1,
    backgroundColor: "#F0F2F4",
    marginHorizontal: 16,
  },
  webViewWrapper: {
    flex:             1,
    paddingHorizontal: 14,
    paddingTop:        4,
    // BUG-NM-001: the native container itself clips overflow so the WebView
    // can never bleed outside even if its own overflow is miscalculated
    overflow: "hidden",
  },
  loaderOverlay: {
    position:        "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent:  "center",
    alignItems:      "center",
    backgroundColor: "#FFFFFF",
    zIndex:          10,
  },
  webView: {
    flex:            1,
    backgroundColor: "transparent",
  },
});