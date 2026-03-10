import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePermissions } from '../../../Utils/ConetextApi';
import AppHeader from '../../components/AppHeader';
import { visitorServices } from '../../../services/visitorServices';
import { useNavigation } from '@react-navigation/native';
import StatusModal from '../../components/StatusModal'; // Make sure this path is correct


const BASE_URL = "https://ism-vms.s3.amazonaws.com/company-logo/";
const DEFAULT_GUEST_IMAGE =
  "https://app.factech.co.in/user/assets/images/visitor/default-guest.png";


const PassDetailsScreen = ({ route }) => {
  // 1. Safety fallback in case params are undefined
  const pass = route?.params?.pass || {};
  const { nightMode } = usePermissions() || { nightMode: false };
  const navigation = useNavigation();

  const [imageFailed, setImageFailed] = useState(false); // Track broken S3 images

  // 2. Setup the StatusModal State
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    type: "loading",
    title: "",
    subtitle: "",
  });

  const LOCAL_IMAGES = {
    cab: require('../../../assets/images/cab.jpg'),
    delivery: require('../../../assets/images/delivery.jpg'),
  };
  // Animation values for a premium entrance
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const theme = {
    background: nightMode ? '#121212' : '#F4F6F9',
    card: nightMode ? '#1E1E1E' : '#FFFFFF',
    text: nightMode ? '#FFFFFF' : '#111827',
    subText: nightMode ? '#9CA3AF' : '#6B7280',
    border: nightMode ? '#2C2C2C' : '#E5E7EB',
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const getStatus = () => {
    if (String(pass.status) === "0") return { label: "ACTIVE", color: "#34C759" };
    if (String(pass.status) === "1") return { label: "INACTIVE", color: "#EF4444" }; // Softer red
    return { label: "PENDING", color: "#F59E0B" }; // Modern amber
  };
  const getLogo = () => {

    const purpose = pass.purpose?.toLowerCase();
    const name =
      pass.company_name?.toLowerCase() ||
      pass.name?.toLowerCase();

    // CAB
    if (purpose === "cab") {

      if (!name || name === "any") {
        return LOCAL_IMAGES.cab;
      }

      return {
        uri: `${BASE_URL}${name.replace(/\s+/g, "-")}.png`
      };
    }

    // DELIVERY
    if (purpose === "delivery") {

      if (!name || name === "any") {
        return LOCAL_IMAGES.delivery;
      }

      return {
        uri: `${BASE_URL}${name.replace(/\s+/g, "-")}.png`
      };
    }

    // GUEST
    return { uri: DEFAULT_GUEST_IMAGE };
  };
  // 3. Updated Delete function to use StatusModal
  const handleDelete = () => {
    Alert.alert(
      "Delete Pass",
      "Are you sure you want to delete this pass? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Show Loading Modal
              setModalConfig({
                visible: true,
                type: "loading",
                title: "Deleting Pass",
                subtitle: "Please wait...",
              });

              const res = await visitorServices.cancelPass(pass.id);

              if (res?.status === "success") {
                // Show Success Modal
                setModalConfig({
                  visible: true,
                  type: "success",
                  title: "Deleted!",
                  subtitle: "The pass has been removed.",
                });

                // Wait for the animation to finish, then go back
                setTimeout(() => {
                  setModalConfig((prev) => ({ ...prev, visible: false }));
                  navigation.goBack();
                }, 1500);

              } else {
                // Show Error Modal
                setModalConfig({
                  visible: true,
                  type: "error",
                  title: "Failed to delete",
                  subtitle: res?.message || "Could not remove this pass.",
                });
              }
            } catch (error) {
              // Show Error Modal on network failure
              setModalConfig({
                visible: true,
                type: "error",
                title: "Error",
                subtitle: "Something went wrong. Please check your connection.",
              });
            }
          },
        },
      ]
    );
  };

  const status = getStatus();
  const isCab = pass.purpose?.toLowerCase() === "cab";
  const isGuest = pass.purpose?.toLowerCase() === "guest";
  const validMobile = !!pass.mobile && pass.mobile !== 0 && pass.mobile !== "0";

  if (!pass?.id) return null; // Prevent rendering if pass data is missing

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={['top', 'left', 'right']}
    >
      <AppHeader
        title="Pass Details"
        nightMode={nightMode}
        showBack={true}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.logoContainer}>
            <Image
              source={getLogo()}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={[styles.statusBadge, { backgroundColor: `${status.color}15` }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.subText }]}>
              {isGuest ? "Visitor Name" : "Company Name"}
            </Text>
            <Text style={[styles.value, { color: theme.text }]}>
              {pass.company_name || pass.name || "-"}
            </Text>
          </View>

          {validMobile && (
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.subText }]}>Phone</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {pass.mobile}
              </Text>
            </View>
          )}

          {isCab && pass.pass_no && (
            <View style={[styles.cabBox, { backgroundColor: nightMode ? '#2C2C2C' : '#F3F4F6' }]}>
              <Text style={[styles.cabLabel, { color: theme.subText }]}>Cab No.</Text>
              <Text style={[styles.cabNumber, { color: theme.text }]}>
                {pass.pass_no}
              </Text>
            </View>
          )}

          {isGuest && pass.pass_no && (
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.subText }]}>Pass No.</Text>
              <Text style={[styles.value, { color: theme.text }]}>{pass.pass_no}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.subText }]}>Visit Date</Text>
            <Text style={[styles.value, { color: theme.text }]}>
              {pass?.date_time ? formatDate(pass.date_time) : "-"}
            </Text>
          </View>

          <View style={styles.deleteContainer}>
            <TouchableOpacity
              style={[styles.deleteButton, { opacity: modalConfig.visible ? 0.7 : 1 }]}
              onPress={handleDelete}
              disabled={modalConfig.visible} // Disable button while modal is showing
              activeOpacity={0.8}
            >
              <Text style={styles.deleteText}>Delete Pass</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <Text style={[styles.footerText, { color: theme.subText }]}>
              Created at {pass?.created_at ? formatDate(pass.created_at) : "-"}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* 4. Mount the StatusModal here */}
      <StatusModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        subtitle={modalConfig.subtitle}
        onClose={() => setModalConfig((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
};

export default PassDetailsScreen;

const styles = StyleSheet.create({
  card: {
    borderRadius: 24, // Slightly rounder for a modern feel
    margin: 16,
    padding: 24, // More padding for breathing room
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  logo: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
  },
  statusBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 20,
  },
  statusText: {
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  section: {
    marginTop: 18,
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  value: {
    fontSize: 17,
    fontWeight: '500',
  },
  cabBox: {
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginVertical: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cabLabel: {
    fontSize: 13,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cabNumber: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 4,
  },
  deleteContainer: {
    marginTop: 32,
  },
  deleteButton: {
    backgroundColor: '#EF4444', // Softer red matching Tailwind CSS
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
  },
});