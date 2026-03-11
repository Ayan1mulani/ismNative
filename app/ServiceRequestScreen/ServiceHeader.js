// ServiceRequestTabs.js
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { usePermissions } from '../../Utils/ConetextApi';
import { hasPermission } from '../../Utils/PermissionHelper';
import ComplaintListScreen from './ServiceRequestPage';
import { complaintService } from '../../services/complaintService';
import SlidingTabs from '../components/SlidingTabs';
import BRAND from '../config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TABS = ['Open', 'Closed', 'All'];

const COLORS = {
  primary: BRAND.COLORS.primary,
  light: {
    background: '#FFFFFF',
    surface: '#F8F9FA',
    text: '#111827',
    textSecondary: '#6C757D',
  },
  dark: {
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#9E9E9E',
  },
};

const REQUEST_STATUS = {
  OPEN: 'Open',
  CLOSED: 'Closed',
  ALL: 'All',
};

const ServiceRequestTabs = () => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [requests, setRequests] = useState({ open: [], closed: [], all: [] });
  const [isLoading, setIsLoading] = useState(true);

  const scrollViewRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const { nightMode, permissions } = usePermissions();
  const navigation = useNavigation();
  const theme = nightMode ? COLORS.dark : COLORS.light;

  // ── Permission flags ──────────────────────────────────────────────────────
  const permissionsLoaded = permissions !== null && permissions !== undefined;
  const canViewComplaints  = permissionsLoaded && hasPermission(permissions, 'COM', 'R');
  const canCreateComplaint = permissionsLoaded && hasPermission(permissions, 'COM', 'C');

  // ── Loading state: permissions not yet fetched ────────────────────────────
  if (!permissionsLoaded) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: theme.textSecondary, marginTop: 12 }}>Loading...</Text>
      </View>
    );
  }

  // ── Access restricted: no R permission ─────────────────────────────────
  if (!canViewComplaints) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Ionicons name="lock-closed-outline" size={64} color={theme.textSecondary} />
        <Text style={[styles.restrictedTitle, { color: theme.text }]}>Access Restricted</Text>
        <Text style={[styles.restrictedSub, { color: theme.textSecondary }]}>
          You do not have permission to view service requests.{'\n'}Please contact your administrator.
        </Text>
      </View>
    );
  }

  useFocusEffect(
    useCallback(() => {
      fetchServiceRequests();
    }, [])
  );

  const fetchServiceRequests = async () => {
    try {
      setIsLoading(true);
      const res = await complaintService.getMyComplaints();
      const allData = res.data || [];

      const openData = allData.filter((item) =>
        ['Open', 'WIP', 'In Progress', 'Pending'].includes(item.status)
      );
      const closedData = allData.filter((item) =>
        ['Closed', 'Resolved', 'Completed'].includes(item.status)
      );

      setRequests({ open: openData, closed: closedData, all: allData });
    } catch (error) {
      console.error('Failed to fetch service requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentRequests = (tabName) => {
    switch (tabName) {
      case REQUEST_STATUS.OPEN:   return requests.open;
      case REQUEST_STATUS.CLOSED: return requests.closed;
      case REQUEST_STATUS.ALL:    return requests.all;
      default:                    return [];
    }
  };

  const handleAddRequest = () => {
    navigation.navigate('CategorySelection');
  };

  const renderPage = (tabName) => (
    <View style={[styles.page, { backgroundColor: theme.background }]}>
      <ComplaintListScreen
        nightMode={nightMode}
        status={tabName}
        complaints={getCurrentRequests(tabName)}
        isLoading={isLoading}
        onRefresh={fetchServiceRequests}
      />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SlidingTabs
        tabs={TABS}
        activeIndex={activeTabIndex}
        onTabPress={(index) => {
          setActiveTabIndex(index);
          scrollViewRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
        }}
        scrollX={scrollX}
      />

      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveTabIndex(index);
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
      >
        {TABS.map((tab) => (
          <View key={tab} style={{ width: SCREEN_WIDTH }}>
            {renderPage(tab)}
          </View>
        ))}
      </Animated.ScrollView>

      {/* FAB — only shown if user has CREATE permission */}
      {canCreateComplaint && (
        <TouchableOpacity
          style={[
            styles.fab,
            {
              backgroundColor: COLORS.primary,
              shadowColor: nightMode ? '#000' : COLORS.primary,
            },
          ]}
          onPress={handleAddRequest}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ServiceRequestTabs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 110,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  restrictedTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  restrictedSub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});