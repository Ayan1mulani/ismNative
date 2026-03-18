import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import Svg, { Path } from "react-native-svg";
import { complaintService } from "../../services/complaintService";
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

const ComplaintStats = ({ theme, nightMode, onSegmentPress, selectedSegment }) => {

  const [stats, setStats] = useState({
    closed: 0,
    open: 0,
    pending: 0,
    reopen: 0,
  });

  const closedAnim = useRef(new Animated.Value(0)).current;
  const openAnim = useRef(new Animated.Value(0)).current;
  const pendingAnim = useRef(new Animated.Value(0)).current;
  const reopenAnim = useRef(new Animated.Value(0)).current;

  // 🔥 FETCH DATA FROM API
  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const fetchStats = async () => {
    try {
      const res = await complaintService.getComplaintStatusCount();

      if (res?.status === "success") {
        const formatted = {
          closed: 0,
          open: 0,
          pending: 0,
          reopen: 0,
        };

        res.data.forEach(item => {
          const status = item.status.toLowerCase();

          if (status === "closed") formatted.closed = item.count;
          if (status === "open") formatted.open = item.count;
          if (status === "wip") formatted.pending = item.count;
          if (status === "reopen") formatted.reopen = item.count;
        });

        console.log("📊 API Stats:", formatted);
        setStats(formatted);
      }

    } catch (error) {
      console.log("Stats fetch error:", error);
    }
  };

  // 🎯 Animation
  useEffect(() => {
    const animate = (anim, isSelected) => {
      Animated.spring(anim, {
        toValue: isSelected ? 1 : 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    };

    animate(closedAnim, selectedSegment === "closed");
    animate(openAnim, selectedSegment === "open");
    animate(pendingAnim, selectedSegment === "pending");
    animate(reopenAnim, selectedSegment === "reopen");
  }, [selectedSegment]);

  const data = [
    { name: "Closed", count: stats.closed, color: "#7B68EE", key: "closed", anim: closedAnim },
    { name: "Open", count: stats.open, color: "#FF8A65", key: "open", anim: openAnim },
    { name: "Pending", count: stats.pending, color: "#4DD0E1", key: "pending", anim: pendingAnim },
    { name: "Reopen", count: stats.reopen, color: nightMode ? "#A855F7" : "#9333EA", key: "reopen", anim: reopenAnim },
  ];

  const total = data.reduce((sum, item) => sum + item.count, 0);

  const radius = 55;
  const innerRadius = 34;

  let currentAngle = -90;

  const segments = data.map((item) => {
    const percentage = total > 0 ? (item.count / total) * 100 : 0;
    const angle = total > 0 ? (percentage / 100) * 360 : 0;

    const segment = {
      ...item,
      percentage: Math.round(percentage),
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
    };

    currentAngle += angle;
    return segment;
  });

  const polarToCartesian = (r, angle) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: r * Math.cos(rad), y: r * Math.sin(rad) };
  };

  const createArc = (startAngle, endAngle, outerR, innerR) => {
    if (endAngle - startAngle >= 359.9) endAngle = 359.8;

    const start = polarToCartesian(outerR, endAngle);
    const end = polarToCartesian(outerR, startAngle);
    const innerStart = polarToCartesian(innerR, endAngle);
    const innerEnd = polarToCartesian(innerR, startAngle);

    const largeArc = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M", start.x, start.y,
      "A", outerR, outerR, 0, largeArc, 0, end.x, end.y,
      "L", innerEnd.x, innerEnd.y,
      "A", innerR, innerR, 0, largeArc, 1, innerStart.x, innerStart.y,
      "Z",
    ].join(" ");
  };

  const renderLegendItem = (item) => {
    const isSelected = selectedSegment === item.key;

    // Scale animation for dot
    const dotScale = item.anim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.5],
    });

    // Underline width animation
    const underlineWidth = item.anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    // Opacity animation for text
    const textOpacity = item.anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.7, 1],
    });

    return (
      <TouchableOpacity
        key={item.key}
        style={styles.legendItem}
        onPress={() => {
          if (selectedSegment === item.key) {
            onSegmentPress?.(null); // 🔥 reset → show all
          } else {
            onSegmentPress?.(item.key);
          }
        }}
        activeOpacity={0.7}
      >
        <Animated.View
          style={[
            styles.dot,
            {
              backgroundColor: item.color,
              transform: [{ scale: dotScale }],
              shadowColor: item.color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: isSelected ? 0.6 : 0,
              shadowRadius: isSelected ? 4 : 0,
              elevation: isSelected ? 3 : 0,
            }
          ]}
        />

        <View style={{ flex: 1 }}>
          <Animated.Text
            style={{
              color: theme?.textColor || "#000",
              fontWeight: isSelected ? "700" : "400",
              opacity: textOpacity,
              fontSize: isSelected ? 13 : 12,
            }}
          >
            {item.name}
          </Animated.Text>
          <View style={styles.countContainer}>
            <Animated.Text
              style={{
                color: isSelected ? item.color : "#666",
                fontSize: 10,
                fontWeight: isSelected ? "700" : "500",
                opacity: textOpacity,
              }}
            >
              {item.count} ({item.percentage}%)
            </Animated.Text>
            <Animated.View
              style={[
                styles.underline,
                {
                  backgroundColor: item.color,
                  transform: [{ scaleX: underlineWidth }]
                }
              ]}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: nightMode ? "#1E1E2D" : "#FFF" }]}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>

        <View style={{ marginRight: 16 }}>
          <Svg width={120} height={120} viewBox="-60 -60 120 120">
            {total === 0 ? (
              <Path d={createArc(0, 360, radius, innerRadius)} fill="#E0E0E0" />
            ) : (
              segments.map((s, i) => {
                const isSelected = selectedSegment === s.key;

                return (
                  <Path
                    key={i}
                    d={createArc(s.startAngle, s.endAngle, radius, innerRadius)}
                    fill={s.color}
                    opacity={
                      selectedSegment
                        ? isSelected ? 1 : 0.4
                        : 1
                    }
                  />
                );
              })
            )}
          </Svg>

          <View style={styles.centerLabel}>
            <Text style={{
              fontSize: 20,
              fontWeight: "700",
              color: theme?.textColor || "#000"
            }}>
              {total}
            </Text>
            <Text style={{
              fontSize: 9,
              color: theme?.inactiveTextColor || "#666",
              marginTop: 2
            }}>
              Total
            </Text>
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            {renderLegendItem(segments[0])}
            {renderLegendItem(segments[1])}
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
            {renderLegendItem(segments[2])}
            {renderLegendItem(segments[3])}
          </View>
        </View>

      </View>
    </View>
  );
};

export default ComplaintStats;

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  centerLabel: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    height: 120,
  },
  countContainer: {
    position: "relative",
  },
  underline: {
    height: 2,
    marginTop: 2,
    borderRadius: 1,
    transformOrigin: "left",
  },
});