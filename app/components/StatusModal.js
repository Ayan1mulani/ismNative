import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Modal,
  TouchableOpacity,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const StatusModal = ({
  visible,
  type = "loading", // loading | success | error
  title,
  subtitle,
  onClose,
  autoClose = true,
}) => {
  const [internalVisible, setInternalVisible] = useState(visible);

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const rotationAnim = useRef(null);

  useEffect(() => {
    if (visible) {
      setInternalVisible(true);

      // Open animation
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Start rotation for loading
      if (type === "loading") {
        rotation.setValue(0);
        rotationAnim.current = Animated.loop(
          Animated.timing(rotation, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          })
        );
        rotationAnim.current.start();
      }

      // Auto close success
      if (type === "success" && autoClose) {
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    } else {
      handleClose();
    }

    return () => {
      if (rotationAnim.current) rotationAnim.current.stop();
      rotation.stopAnimation();
    };
  }, [visible, type]);

  const handleClose = () => {
    if (rotationAnim.current) rotationAnim.current.stop();

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setInternalVisible(false);
      if (onClose) onClose();
    });
  };

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const renderIcon = () => {
    if (type === "success")
      return (
        < Ionicons name="checkmark-circle" size={60} color="#22C55E" />
      );

    if (type === "error")
      return (
        < Ionicons name="close-circle" size={60} color="#EF4444" />
      );

    return (
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        < Ionicons name="sync" size={50} color="#1996D3" />
      </Animated.View>
    );
  };

  if (!internalVisible) return null;

  return (
    <Modal transparent visible={internalVisible} animationType="none">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.box,
            {
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          {renderIcon()}

          {title && <Text style={styles.title}>{title}</Text>}

          {subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}

          {type === "error" && (
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

export default StatusModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    width: 280,
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 18,
    alignItems: "center",
    elevation: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
    color: "#6B7280",
  },
  closeBtn: {
    marginTop: 20,
    backgroundColor: "#EF4444",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  closeText: {
    color: "#fff",
    fontWeight: "600",
  },
});