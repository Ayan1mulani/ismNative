import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Animated,           // ← Alert import REMOVED
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePermissions } from '../../../Utils/ConetextApi';
import AppHeader from '../../components/AppHeader';
import { visitorServices } from '../../../services/visitorServices';
import { useNavigation } from '@react-navigation/native';
import StatusModal from '../../components/StatusModal';
import useAlert from '../../components/UseAlert';


const BASE_URL = "https://ism-vms.s3.amazonaws.com/company-logo/";
const DEFAULT_GUEST_IMAGE =
  "https://app.factech.co.in/user/assets/images/visitor/default-guest.png";


const PassDetailsScreen = ({ route }) => {
  const hasChanges = useRef(false);
  const pass = route?.params?.pass || {};
  const { nightMode } = usePermissions() || { nightMode: false };
  const navigation = useNavigation();
  const onGoBack = route?.params?.onGoBack;


  const [modalConfig, setModalConfig] = useState({
    visible: false,
    type: "loading",
    title: "",
    subtitle: "",
  });

  // ── STEP 2: destructure showAlert and AlertComponent from the hook ──
  const { showAlert, AlertComponent } = useAlert(nightMode);

  const LOCAL_IMAGES = {
    cab: require('../../../assets/images/cab.jpg'),
    delivery: require('../../../assets/images/delivery.jpg'),
  };

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
    if (String(pass.status) === "1") return { label: "INACTIVE", color: "#EF4444" };
    return { label: "PENDING", color: "#F59E0B" };
  };

  const getLogo = () => {
    const purpose = pass.purpose?.toLowerCase();
    const name = pass.company_name?.toLowerCase() || pass.name?.toLowerCase();

    if (purpose === "cab") {
      if (!name || name === "any") return LOCAL_IMAGES.cab;
      return { uri: `${BASE_URL}${name.replace(/\s+/g, "-")}.png` };
    }

    if (purpose === "delivery") {
      if (!name || name === "any") return LOCAL_IMAGES.delivery;
      return { uri: `${BASE_URL}${name.replace(/\s+/g, "-")}.png` };
    }

    return { uri: DEFAULT_GUEST_IMAGE };
  };

  // ── STEP 3: replace Alert.alert() with showAlert() ──────────────────
  const handleDelete = () => {
    showAlert({
      title: "Delete Pass",
      message: "Are you sure you want to delete this pass? This cannot be undone.",
      buttons: [
        {
          text: "Cancel",
          style: "cancel",
          // no onPress needed for cancel
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setModalConfig({
                visible: true,
                type: "loading",
                title: "Deleting Pass",
                subtitle: "Please wait...",
              });

              const res = await visitorServices.cancelPass(pass.id);

              if (res?.status === "success") {
                hasChanges.current = true; // ✅ VERY IMPORTANT
                setModalConfig({
                  visible: true,
                  type: "success",
                  title: "Deleted!",
                  subtitle: "The pass has been removed.",
                });

                setTimeout(() => {
                  setModalConfig((prev) => ({ ...prev, visible: false }));

                  if (hasChanges.current && onGoBack) {
                    onGoBack(); // ✅ only when delete happened
                  }

                  navigation.goBack();
                }, 1500);

              } else {
                setModalConfig({
                  visible: true,
                  type: "error",
                  title: "Failed to delete",
                  subtitle: res?.message || "Could not remove this pass.",
                });
              }
            } catch (error) {
              setModalConfig({
                visible: true,
                type: "error",
                title: "Error",
                subtitle: "Something went wrong. Please check your connection.",
              });
            }
          },
        },
      ],
    });
  };
  // ────────────────────────────────────────────────────────────────────

  const status = getStatus();
  const isCab = pass.purpose?.toLowerCase() === "cab";
  const isGuest = pass.purpose?.toLowerCase() === "guest";
  const validMobile = !!pass.mobile && pass.mobile !== 0 && pass.mobile !== "0";

  if (!pass?.id) return null;

  // Reusable row component
  const InfoRow = ({ label, value, isLast = false }) => (
    <>
      <View style={styles.infoRow}>
        <Text style={[styles.infoLabel, { color: theme.subText }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">
          {value}
        </Text>
      </View>
      {!isLast && <View style={[styles.rowDivider, { backgroundColor: theme.border }]} />}
    </>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={['top', 'left', 'right']}
    >
      <AppHeader title="Pass Details" nightMode={nightMode} showBack={true} />

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
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
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image source={getLogo()} style={styles.logo} resizeMode="contain" />
          </View>

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: `${status.color}15` }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>

          {/* Info rows grouped box */}
          <View style={[styles.infoBox, { borderColor: theme.border }]}>
            <InfoRow
              label={isGuest ? "Visitor Name" : "Company Name"}
              value={pass.company_name || pass.name || "-"}
            />

            {validMobile && (
              <InfoRow label="Phone" value={String(pass.mobile)} />
            )}

            {isGuest && pass.pass_no && (
              <InfoRow label="Pass No." value={pass.pass_no} />
            )}

            <InfoRow
              label="Visit Date"
              value={pass?.date_time ? formatDate(pass.date_time) : "-"}
              isLast={true}
            />
          </View>

          {/* Cab Box */}
          {isCab && pass.pass_no && (
            <View style={[styles.cabBox, { backgroundColor: nightMode ? '#2C2C2C' : '#F3F4F6' }]}>
              <Text style={[styles.cabLabel, { color: theme.subText }]}>Cab No.</Text>
              <Text style={[styles.cabNumber, { color: theme.text }]}>{pass.pass_no}</Text>
            </View>
          )}

          {/* Delete Button */}
          <TouchableOpacity
            style={[styles.deleteButton, { opacity: modalConfig.visible ? 0.7 : 1 }]}
            onPress={handleDelete}
            disabled={modalConfig.visible}
            activeOpacity={0.8}
          >
            <Text style={styles.deleteText}>Delete Pass</Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={[styles.footerText, { color: theme.subText }]}>
            Created at {pass?.created_at ? formatDate(pass.created_at) : "-"}
          </Text>
        </Animated.View>
      </ScrollView>

      <StatusModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        subtitle={modalConfig.subtitle}
        onClose={() => setModalConfig((prev) => ({ ...prev, visible: false }))}
      />

      {/* STEP 4: mount AlertComponent once at the bottom — that's it! */}
      <AlertComponent />

    </SafeAreaView>
  );
};

export default PassDetailsScreen;

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    margin: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  statusBadge: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 14,
  },
  statusText: {
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  infoBox: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowDivider: {
    height: 1,
    width: '100%',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  cabBox: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cabLabel: {
    fontSize: 11,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cabNumber: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 4,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 4,
  },
  deleteText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});