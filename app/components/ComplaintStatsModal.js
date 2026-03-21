import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { complaintService } from "../../services/complaintService";
import { useFocusEffect } from '@react-navigation/native';

const ComplaintStats = ({ theme, nightMode, onSegmentPress, selectedSegment }) => {

  const [stats, setStats] = useState({ closed: 0, open: 0, pending: 0, reopen: 0 });

  const closedAnim  = useRef(new Animated.Value(0)).current;
  const openAnim    = useRef(new Animated.Value(0)).current;
  const pendingAnim = useRef(new Animated.Value(0)).current;
  const reopenAnim  = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => { fetchStats(); }, [])
  );

  const fetchStats = async () => {
    try {
      const res = await complaintService.getComplaintStatusCount();
      if (res?.status === "success") {
        const formatted = { open: 0, closed: 0, pending: 0, reopen: 0 };
        (res.data || []).forEach((item) => {
          const s = (item.status || "").toLowerCase().trim();
          if (s === "open")                        formatted.open    = item.count;
          if (s === "closed")                      formatted.closed  = item.count;
          if (s === "wip")                         formatted.pending = item.count;
          if (s === "reopen" || s === "reopened")  formatted.reopen  = item.count;
        });
        setStats(formatted);
      }
    } catch (e) {
      console.log("Stats fetch error:", e);
    }
  };

  useEffect(() => {
    const animate = (anim, isSelected) =>
      Animated.spring(anim, { toValue: isSelected ? 1 : 0, useNativeDriver: true }).start();

    animate(closedAnim,  selectedSegment === "closed");
    animate(openAnim,    selectedSegment === "open");
    animate(pendingAnim, selectedSegment === "pending");
    animate(reopenAnim,  selectedSegment === "reopen");
  }, [selectedSegment]);

  const data = [
    { name: "Closed",  count: stats.closed,  color: "#7B68EE", key: "closed",  anim: closedAnim  },
    { name: "Open",    count: stats.open,    color: "#FF8A65", key: "open",    anim: openAnim    },
    { name: "Pending", count: stats.pending, color: "#4DD0E1", key: "pending", anim: pendingAnim },
    { name: "Reopen",  count: stats.reopen,  color: nightMode ? "#A855F7" : "#9333EA", key: "reopen", anim: reopenAnim },
  ];

  const total       = data.reduce((sum, item) => sum + (item.count || 0), 0);
  const OUTER_R     = 55;
  const INNER_R     = 34;
  const GAP_DEG     = 1.5; // small gap between segments so adjacent colours don't blur

  // ── SVG helpers ────────────────────────────────────────────────────────────
  const polarToCartesian = (r, angleDeg) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: r * Math.cos(rad), y: r * Math.sin(rad) };
  };

  // ─────────────────────────────────────────────────────────────────────────
  // createArc — builds a donut arc path between startAngle and endAngle.
  //
  // BUG FIX: when a single segment is 100 % the arc spans exactly 360°.
  // SVG arcs cannot go from a point back to itself — the path collapses to
  // nothing. The old workaround (clamp to 359.8°) still has start === end
  // for the ONE active segment and renders blank.
  //
  // NEW APPROACH:
  //   • If the arc spans ≥ 359° we render TWO 179.9° half-arcs that together
  //     form a perfect full ring. This is the standard SVG pattern for full
  //     circles drawn with arc commands.
  // ─────────────────────────────────────────────────────────────────────────
  const createArc = (startAngle, endAngle, outerR, innerR) => {
    const span = endAngle - startAngle;

    // ── Full-circle case (100 % segment) ──────────────────────────────────
    if (span >= 359) {
      // Split into two half-arcs so start ≠ end for both
      const mid = startAngle + 180;

      const o1 = polarToCartesian(outerR, startAngle);
      const o2 = polarToCartesian(outerR, mid);
      const i1 = polarToCartesian(innerR, startAngle);
      const i2 = polarToCartesian(innerR, mid);

      return [
        // Outer ring — first half
        "M", o1.x, o1.y,
        "A", outerR, outerR, 0, 1, 1, o2.x, o2.y,
        // Outer ring — second half
        "A", outerR, outerR, 0, 1, 1, o1.x, o1.y,
        // Cut to inner ring
        "L", i1.x, i1.y,
        // Inner ring — second half (reverse direction)
        "A", innerR, innerR, 0, 1, 0, i2.x, i2.y,
        // Inner ring — first half (reverse direction)
        "A", innerR, innerR, 0, 1, 0, i1.x, i1.y,
        "Z",
      ].join(" ");
    }

    // ── Normal arc (< 360°) ───────────────────────────────────────────────
    // Apply gap: shrink each segment by GAP_DEG/2 on each side so a thin
    // background gap shows between adjacent slices.
    const adjStart = startAngle + GAP_DEG / 2;
    const adjEnd   = endAngle   - GAP_DEG / 2;

    // If the gap eats the whole segment (very small slice) skip it
    if (adjEnd <= adjStart) return "";

    const outerStart = polarToCartesian(outerR, adjStart);
    const outerEnd   = polarToCartesian(outerR, adjEnd);
    const innerStart = polarToCartesian(innerR, adjStart);
    const innerEnd   = polarToCartesian(innerR, adjEnd);
    const largeArc   = adjEnd - adjStart > 180 ? "1" : "0";

    return [
      "M", outerStart.x, outerStart.y,
      "A", outerR, outerR, 0, largeArc, 1, outerEnd.x, outerEnd.y,
      "L", innerEnd.x, innerEnd.y,
      "A", innerR, innerR, 0, largeArc, 0, innerStart.x, innerStart.y,
      "Z",
    ].join(" ");
  };

  // ── Build segments ─────────────────────────────────────────────────────────
  let currentAngle = -90;
  const segments = data.map((item) => {
    const percentage = total > 0 ? (item.count / total) * 100 : 0;
    const angle      = total > 0 ? (percentage / 100) * 360  : 0;
    const segment = {
      ...item,
      percentage: Math.round(percentage),
      startAngle: currentAngle,
      endAngle:   currentAngle + angle,
    };
    currentAngle += angle;
    return segment;
  });

  // ── Legend item ────────────────────────────────────────────────────────────
  const renderLegendItem = (item) => {
    if (!item) return null;
    const isSelected = selectedSegment === item.key;
    const dotScale   = item.anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });

    return (
      <TouchableOpacity
        key={item.key}
        style={styles.legendItem}
        onPress={() => onSegmentPress?.(selectedSegment === item.key ? null : item.key)}
      >
        <Animated.View style={[styles.dot, { backgroundColor: item.color, transform: [{ scale: dotScale }] }]} />
        <View style={styles.legendText}>
          <Text
            style={{ color: theme?.textColor || "#000", fontWeight: isSelected ? "700" : "400", fontSize: 13 }}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text style={{ fontSize: 11, color: isSelected ? item.color : "#666" }}>
            {item.count} ({item.percentage}%)
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: nightMode ? "#1E1E2D" : "#FFF" }]}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>

        {/* ── Donut chart ── */}
        <View style={styles.chartWrapper}>
          <Svg width={120} height={120} viewBox="-60 -60 120 120">
            {/* Background ring — always visible so chart looks full even when empty */}
            <Circle cx={0} cy={0} r={(OUTER_R + INNER_R) / 2} stroke="#E0E0E0" strokeWidth={OUTER_R - INNER_R} fill="none" />

            {total > 0 && segments.map((s, i) => {
              const path = createArc(s.startAngle, s.endAngle, OUTER_R, INNER_R);
              if (!path) return null;
              return (
                <Path
                  key={i}
                  d={path}
                  fill={s.color}
                  opacity={selectedSegment ? (selectedSegment === s.key ? 1 : 0.35) : 1}
                />
              );
            })}
          </Svg>

          {/* Centre label — absolutely positioned over SVG */}
          <View style={styles.centerLabel}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: nightMode ? "#fff" : "#111" }}>
              {total}
            </Text>
            <Text style={{ fontSize: 10, color: "#9CA3AF" }}>Total</Text>
          </View>
        </View>

        {/* ── Legend ── */}
        <View style={{ flex: 1 }}>
          <View style={styles.row}>
            {renderLegendItem(data[0])}
            {renderLegendItem(data[1])}
          </View>
          <View style={styles.row}>
            {renderLegendItem(data[2])}
            {renderLegendItem(data[3])}
          </View>
        </View>

      </View>
    </View>
  );
};

export default ComplaintStats;

const styles = StyleSheet.create({
  container: {
    margin:       16,
    padding:      16,
    borderRadius: 16,
  },
  chartWrapper: {
    width:       120,
    height:      120,
    marginRight: 16,
  },
  centerLabel: {
    position:       "absolute",
    width:          120,
    height:         120,
    alignItems:     "center",
    justifyContent: "center",
    // pointer-events none so taps pass through to SVG if needed
  },
  legendItem: {
    flexDirection: "row",
    alignItems:    "center",
    width:         "48%",
    marginBottom:  10,
  },
  legendText: {
    flex:     1,
    overflow: "hidden",
  },
  dot: {
    width:        8,
    height:       8,
    borderRadius: 4,
    marginRight:  6,
    flexShrink:   0,
  },
  row: {
    flexDirection:  "row",
    justifyContent: "space-between",
    marginBottom:   10,
  },
});