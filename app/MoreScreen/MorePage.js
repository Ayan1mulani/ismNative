import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UnRegisterOneSignal } from '../../services/oneSignalService';
import { OneSignal } from 'react-native-onesignal';
import { usePermissions } from '../../Utils/ConetextApi';
import { useNavigation } from '@react-navigation/native';
import AccountSelectorModal from '../Login/SelectUserMode';
import { LoginSrv } from '../../services/LoginSrv';
import { CommonActions } from '@react-navigation/native';
import { Modal } from 'react-native';
import { TextInput } from 'react-native';
import { ismServices } from '../../services/ismServices';

import BRAND from '../config'
import { RegisterAppOneSignal } from '../../services/oneSignalService';

const ProfileScreen = () => {
  const { nightMode, setNightMode, loadPermissions } = usePermissions();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dropdown States
  const [unitOpen, setUnitOpen] = useState(true); // 👈 Open by default
  const [meterOpen, setMeterOpen] = useState(false);
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [passwordModal, setPasswordModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [password, setPassword] = useState('');
  const [isSwitching, setIsSwitching] = useState(false);

  const navigation = useNavigation();

  const theme = {
    background: nightMode ? '#111827' : '#FFFFFF',
    textMain: nightMode ? '#F9FAFB' : '#111827',
    textSub: nightMode ? '#9CA3AF' : '#6B7280',
    divider: nightMode ? '#374151' : '#E5E7EB',
    cardBg: nightMode ? '#1F2937' : '#F9FAFB',
    danger: '#EF4444',
    primary: BRAND.COLORS.primary,
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);

      const storedUser = await AsyncStorage.getItem('userInfo');

      if (!storedUser) {
        console.log("No user found");
        setUserProfile(null);
        return;
      }

      const parsedUser = JSON.parse(storedUser);
      const ALLOWED_ROLES = ["member", "resident", "tenant"];

      const userRole = (parsedUser?.role || "").toLowerCase();

      if (!ALLOWED_ROLES.includes(userRole)) {
        Alert.alert(
          "Access Denied",
          `This app is not for ${parsedUser.role}`
        );

        await AsyncStorage.clear();

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Login" }],
          })
        );

        return;
      }

      // ✅ Fetch fresh details
      const detailsRes = await ismServices.getUserDetails();

      console.log("USER DETAILS RESPONSE:", detailsRes);

      setUserProfile(detailsRes);

      await AsyncStorage.setItem(
        'userDetails',
        JSON.stringify(detailsRes)
      );

    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {

              // 🔔 Disable push locally
              await OneSignal.User.pushSubscription.optOut();

              // 🔔 Unregister device from backend
              await UnRegisterOneSignal();

              // 🧹 Clear stored data
              await AsyncStorage.clear();

              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: "Login" }],
                })
              );

            } catch (error) {
              console.log("Logout error:", error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleSwitchAccount = async () => {
    try {
      setIsSwitching(true); // 🔥 start loader

      const userInfo = await AsyncStorage.getItem('userInfo');
      if (!userInfo) return;

      const parsedUser = JSON.parse(userInfo);

      const payload = {
        identity: parsedUser.email,
        password: '',
        tenant: 0,
        user_id: null,
      };

      const response = await LoginSrv.login(payload);

      if (response.status === 'multipleLogin') {

        const currentUser = parsedUser;

        const filteredAccounts = response.data.filter(
          acc => acc.user_id !== currentUser.user_id
        );

        if (filteredAccounts.length === 0) {
          Alert.alert('No Other Accounts Available');
          return;
        }

        setAccounts(filteredAccounts);
        setModalVisible(true);
      }

    } catch (error) {
      console.log('Switch error:', error);
    } finally {
      setIsSwitching(false); // 🔥 stop loader
    }
  };

  const handleAccountSelect = (selectedUser) => {
    setModalVisible(false);
    setSelectedUserId(selectedUser.user_id);
    setPassword('');
    setPasswordModal(true);
  };

  const confirmSwitchLogin = async () => {
    if (!password.trim()) {
      Alert.alert('Enter Password');
      return;
    }

    try {
      setIsSwitching(true);

      // 🔔 Unregister old user push notification
      await OneSignal.User.pushSubscription.optOut();
      await UnRegisterOneSignal();

      const userInfo = await AsyncStorage.getItem('userInfo');
      const parsedUser = JSON.parse(userInfo);

      const payload = {
        identity: parsedUser.email,
        password: password,
        tenant: 0,
        user_id: selectedUserId,
      };

      const response = await LoginSrv.login(payload);

      if (response.status === 'success') {

        await AsyncStorage.setItem(
          'userInfo',
          JSON.stringify(response.data)
        );

        await AsyncStorage.removeItem("permissions");

        // reload permissions
        await loadPermissions();

        // 🔔 Register new user device
        setTimeout(() => RegisterAppOneSignal(), 2000);

        setPasswordModal(false);

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'MainApp' }],
          })
        );

      } else {
        Alert.alert('Wrong Password');
      }

    } catch (error) {
      console.log('Final switch error:', error);
    } finally {
      setIsSwitching(false);
    }
  };
  const getAvatarUri = () => {
    if (userProfile?.image_src) return { uri: userProfile.image_src };
    const name = encodeURIComponent(userProfile?.name || 'User');
    return {
      uri: `https://ui-avatars.com/api/?name=${name}&background=3B82F6&color=fff&size=200`,
    };
  };

  const InfoRow = ({ label, value }) => (
    <View style={[styles.infoRow, { borderBottomColor: theme.divider }]}>
      <Text style={[styles.infoLabel, { color: theme.textSub }]}>
        {label}
      </Text>
      <Text style={[styles.infoValue, { color: theme.textMain }]}>
        {value || 'N/A'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!userProfile) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>

        {/* PROFILE HEADER */}
        <View style={[styles.profileCard, { backgroundColor: theme.cardBg }]}>
          <Image source={getAvatarUri()} style={styles.avatar} />
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={[styles.userName, { color: theme.textMain }]}>
              {userProfile.name}
            </Text>
            <Text style={[styles.userSub, { color: theme.textSub }]}>
              {userProfile.phone_no}
            </Text>
            <Text style={[styles.userSub, { color: theme.textSub }]}>
              {userProfile.email}
            </Text>
          </View>
        </View>

        {/* UNIT DETAILS (OPEN BY DEFAULT) */}
        <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
          <TouchableOpacity
            style={styles.dropdownHeader}
            onPress={() => setUnitOpen(prev => !prev)}
          >
            <Text style={[styles.sectionTitle, { color: theme.textMain }]}>
              Unit Details
            </Text>
            < Ionicons
              name={unitOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
              size={20}
              color={theme.textSub}
            />
          </TouchableOpacity>

          {unitOpen && (
            <View style={styles.dropdownContent}>
              <InfoRow label="Tower" value={userProfile.tower} />
              <InfoRow label="Flat No" value={userProfile.flat_no} />
              <InfoRow label="Area (Sq Ft)" value={userProfile.size_sf} />
              <InfoRow label="Category" value={userProfile.fc_name} />
            </View>
          )}
        </View>

        {/* METER DETAILS */}
        <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
          <TouchableOpacity
            style={styles.dropdownHeader}
            onPress={() => setMeterOpen(prev => !prev)}
          >
            <Text style={[styles.sectionTitle, { color: theme.textMain }]}>
              Meter Details
            </Text>
            < Ionicons
              name={meterOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
              size={20}
              color={theme.textSub}
            />
          </TouchableOpacity>

          {meterOpen && (
            <View style={styles.dropdownContent}>
              <InfoRow label="Grid Meter No" value={userProfile.grid_meter_no} />
              <InfoRow label="DG Meter No" value={userProfile.dg_meter_no} />
              <InfoRow label="Gas Meter No" value={userProfile.gas_meter_no} />
            </View>
          )}
        </View>

        {/* MY VEHICLES */}
        <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
          <TouchableOpacity
            style={styles.dropdownHeader}
            onPress={() => setVehicleOpen(prev => !prev)}
          >
            <Text style={[styles.sectionTitle, { color: theme.textMain }]}>
              My Vehicles
            </Text>
            < Ionicons
              name={vehicleOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
              size={20}
              color={theme.textSub}
            />
          </TouchableOpacity>

          {vehicleOpen && (
            <View style={styles.dropdownContent}>
              <InfoRow label="Primary Vehicle" value={userProfile.vehicle_no} />
              <InfoRow label="Alternate Vehicle" value={userProfile.alt_vehicle_no} />
            </View>
          )}
        </View>

        {/* SETTINGS */}
        <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: theme.textMain }]}>
            Settings
          </Text>
          {/* 
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => setNightMode(prev => !prev)}
          >
            < Ionicons
              name={nightMode ? 'sunny-outline' : 'moon-outline'}
              size={20}
              color={theme.textMain}
            />
            <Text style={[styles.actionText, { color: theme.textMain }]}>
              {nightMode ? 'Light Mode' : 'Dark Mode'}
            </Text>
          </TouchableOpacity> */}

          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleSwitchAccount}
            disabled={isSwitching}
          >
            {isSwitching ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              < Ionicons name="swap-horizontal-outline" size={20} color={theme.textMain} />
            )}

            <Text style={[styles.actionText, { color: theme.textMain }]}>
              {isSwitching ? 'Loading Accounts...' : 'Switch Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleLogout}
          >
            < Ionicons name="log-out-outline" size={20} color={theme.danger} />
            <Text style={[styles.actionText, { color: theme.danger }]}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
      <AccountSelectorModal
        visible={modalVisible}
        accounts={accounts}
        onSelect={handleAccountSelect}
        onClose={() => setModalVisible(false)}
      />

      <Modal visible={passwordModal} transparent animationType="fade">
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <View style={{
            backgroundColor: '#fff',
            width: '85%',
            padding: 20,
            borderRadius: 16
          }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>
              Enter Password
            </Text>

            <TextInput
              placeholder="Password"
              secureTextEntry
              placeholderTextColor="#000"
              value={password}
              onChangeText={setPassword}
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 10,
                padding: 12,
                marginBottom: 15,
                color: '#000'
              }}
            />

            <TouchableOpacity
              style={{
                backgroundColor: theme.primary,
                padding: 14,
                borderRadius: 10,
                alignItems: 'center'
              }}
              onPress={confirmSwitchLogin}
            >
              <Text style={{ color: '#fff' }}>
                {isSwitching ? 'Switching...' : 'Confirm'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 10, alignItems: 'center' }}
              onPress={() => setPasswordModal(false)}
            >
              <Text style={{ color: 'red' }}>Cancel</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 18,
    marginBottom: 16,
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },

  userName: {
    fontSize: 18,
    fontWeight: '700',
  },

  userSub: {
    fontSize: 13,
    marginTop: 4,
  },

  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    elevation: 0.2,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },

  infoLabel: {
    fontSize: 14,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },

  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  dropdownContent: {
    marginTop: 10,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },

  actionText: {
    fontSize: 15,
    marginLeft: 10,
  },
});