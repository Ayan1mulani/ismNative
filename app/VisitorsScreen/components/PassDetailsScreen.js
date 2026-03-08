import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePermissions } from '../../../Utils/ConetextApi';
import AppHeader from '../../components/AppHeader';
import { visitorServices } from '../../../services/visitorServices';
import { useNavigation } from '@react-navigation/native';

const BASE_URL = "https://ism-vms.s3.amazonaws.com/company-logo/";
const DEFAULT_GUEST_IMAGE =
  "https://app.factech.co.in/user/assets/images/visitor/default-guest.png";

const PassDetailsScreen = ({ route }) => {
  const { pass } = route.params;
  const { nightMode } = usePermissions();
  const navigation = useNavigation();
  const [deleting, setDeleting] = useState(false);

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
    if (String(pass.status) === "1") {
      return { label: "ACTIVE", color: "#34C759" };
    }

    if (String(pass.status) === "0") {
      return { label: "INACTIVE", color: "#FF3B30" };
    }
    return { label: "PENDING", color: "#FF9500" };
  };

 const getLogo = () => {
  if (!pass) return DEFAULT_GUEST_IMAGE;

  if (pass.purpose?.toLowerCase() === 'guest') {
    return DEFAULT_GUEST_IMAGE;
  }

  if (typeof pass.company_name === "string") {
    const fileName = pass.company_name
      .toLowerCase()
      .replace(/\s+/g, '-');

    return `${BASE_URL}${fileName}.png`;
  }

  return DEFAULT_GUEST_IMAGE;
};

  const handleDelete = () => {
    Alert.alert(
      "Delete Pass",
      "Are you sure you want to delete this pass?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeleting(true);

              const res = await visitorServices.cancelPass(pass.id);

              if (res?.status === "success") {
                navigation.goBack({ refresh: true });
              } else {
                Alert.alert("Error", res?.message || "Failed to delete");
              }
            } catch (error) {
              Alert.alert("Error", "Something went wrong");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const status = getStatus();
  const isCab = pass.purpose?.toLowerCase() === "cab";
  const isGuest = pass.purpose?.toLowerCase() === "guest";

  const validMobile =
  !!pass.mobile &&
  pass.mobile !== 0 &&
  pass.mobile !== "0";


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

      <ScrollView>

        <View style={[styles.card, { backgroundColor: theme.card }]}>

          <View style={styles.logoContainer}>
            <Image
              source={{ uri: getLogo() }}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
            <Text style={styles.statusText}>
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
              <Text style={[styles.label, { color: theme.subText }]}>
                Phone
              </Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {pass.mobile || "-"}
              </Text>
            </View>
          )}

          {isCab && pass.pass_no && (
            <View style={styles.cabBox}>
              <Text style={[styles.cabLabel, { color: theme.subText }]}>
                Cab No.
              </Text>
              <Text style={styles.cabNumber}>
                {pass.pass_no || "-"}
              </Text>
            </View>
          )}

          {isGuest && pass.pass_no && (
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.subText }]}>
                Pass No.
              </Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {pass.pass_no || "-"}
              </Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.subText }]}>
              Visit Date
            </Text>
            <Text style={[styles.value, { color: theme.text }]}>
              {pass?.date_time ? formatDate(pass.date_time) : "-"}
            </Text>
          </View>

          {/* DELETE BUTTON */}
          <View style={styles.deleteContainer}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.deleteText}>Delete Pass</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <Text style={[styles.footerText, { color: theme.subText }]}>
              Created at {pass?.created_at ? formatDate(pass.created_at) : "-"}
            </Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PassDetailsScreen;

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    margin: 16,
    padding: 20,
    elevation: 6,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  logo: {
    width: 80,
    height: 80,
  },
  statusBadge: {
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  section: {
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '600',
  },
  cabBox: {
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginVertical: 20,
  },
  cabLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  cabNumber: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 3,
  },
  deleteContainer: {
    marginTop: 24,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  deleteText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  footer: {
    marginTop: 30,
    paddingTop: 14,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
});