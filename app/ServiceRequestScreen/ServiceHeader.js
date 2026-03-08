// ServiceRequestTabs.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { usePermissions } from '../../Utils/ConetextApi';
import ComplaintListScreen from './ServiceRequestPage';
import { complaintService } from '../../services/complaintService';
import SlidingTabs from '../components/SlidingTabs';
import BRAND from '../config'

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TABS = ['Open', 'Closed', 'All'];

const COLORS = {
  primary: BRAND.COLORS.primary,
  light: {
    background: '#FFFFFF',
    surface: '#F8F9FA',
    textSecondary: '#6C757D',
  },
  dark: {
    background: '#121212',
    surface: '#1E1E1E',
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
  const [requests, setRequests] = useState({
    open: [],
    closed: [],
    all: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const scrollViewRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const { nightMode } = usePermissions();
  const navigation = useNavigation();
  const theme = nightMode ? COLORS.dark : COLORS.light;

  // 🔥 Fetch Data
  useFocusEffect(
    useCallback(() => {
      fetchServiceRequests();
    }, [])
  );

  const fetchServiceRequests = async () => {
    try {
      setIsLoading(true);

      const openRes = await complaintService.getMyComplaints(
        REQUEST_STATUS.OPEN
      );
      const closedRes = await complaintService.getMyComplaints(
        REQUEST_STATUS.CLOSED
      );

      const openData = openRes.data || [];
      const closedData = closedRes.data || [];

      setRequests({
        open: openData,
        closed: closedData,
        all: [...openData, ...closedData],
      });
    } catch (error) {
      console.error('Failed to fetch service requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentRequests = (tabName) => {
    switch (tabName) {
      case REQUEST_STATUS.OPEN:
        return requests.open;
      case REQUEST_STATUS.CLOSED:
        return requests.closed;
      case REQUEST_STATUS.ALL:
        return requests.all;
      default:
        return [];
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
      {/* ✅ Sliding Tabs */}
      <SlidingTabs
        tabs={TABS}
        activeIndex={activeTabIndex}
        onTabPress={(index) => {
          setActiveTabIndex(index);
          scrollViewRef.current?.scrollTo({
            x: index * SCREEN_WIDTH,
            animated: true,
          });
        }}
        scrollX={scrollX}
      />

      {/* ✅ Swipe Pages */}
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / SCREEN_WIDTH
          );
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

      {/* ✅ Floating Button */}
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
        < Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
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
});