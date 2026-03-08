// VisitorScreen.js
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { usePermissions } from '../../Utils/ConetextApi';
import VisitRequest from './VisitRequest';
import { useNavigation } from '@react-navigation/native';
import AddPreVisitorModal from './components/AddPreVisitorModal';
import SingleEntry from './SingleEntry';
import { visitorServices } from '../../services/visitorServices';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SlidingTabs from '../components/SlidingTabs';
import MyParkingPage from './singleMultiVisits/MyParkingPage';
import BRAND from '../config'

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

const VisitorScreen = () => {
  const navigation = useNavigation();
  const { nightMode } = usePermissions();
  const theme = nightMode ? COLORS.dark : COLORS.light;

  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [visits, setVisits] = useState([]);
  const [passes, setPasses] = useState([]);
  const [parkingBookings, setParkingBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreApproveModal, setShowPreApproveModal] = useState(false);

  const scrollViewRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // ✅ Dynamic Tabs
  const TABS = useMemo(() => {
    return [
      'Visit Requests',
      'Entry Passes',
      ...(parkingBookings?.length > 0 ? ['Parking'] : []),
    ];
  }, [parkingBookings]);

  // ✅ Clamp index if tabs change
  useEffect(() => {
    if (activeTabIndex > TABS.length - 1) {
      setActiveTabIndex(TABS.length - 1);
    }
  }, [TABS]);

  // ✅ Load Data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      const [visitsRes, passesRes, parkingRes] = await Promise.all([
        visitorServices.getMyVisitors(),
        visitorServices.getMyPasses(),
        visitorServices.getParkingBookings(),
      ]);

      setVisits(visitsRes.data || []);
      setPasses(passesRes.data || []);
      setParkingBookings(parkingRes.data || []);

      setIsLoading(false);
    };

    loadData();
  }, []);

  const renderPage = (tabName) => {
    if (tabName === 'Visit Requests') {
      return (
        <VisitRequest
          nightMode={nightMode}
          visitorData={visits}
          loading={isLoading}
          onRefresh={async () => {
            const res = await visitorServices.getMyVisitors();
            setVisits(res.data || []);
          }}
        />
      );
    }

    if (tabName === 'Entry Passes') {
      return (
        <SingleEntry
          nightMode={nightMode}
          passData={passes}
          loading={isLoading}
          onRefresh={async () => {
            const res = await visitorServices.getMyPasses();
            setPasses(res.data || []);
          }}
        />
      );
    }

    return (
      <MyParkingPage
        nightMode={nightMode}
        parkingBookings={parkingBookings}
        loading={isLoading}
        onRefresh={async () => {
          const res = await visitorServices.getParkingBookings();
          setParkingBookings(res.data || []);
        }}
      />
    );
  };

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
        primaryColor={COLORS.primary}
        inactiveColor={theme.textSecondary}
        containerStyle={{
          backgroundColor: theme.surface,
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
        style={[styles.fab, { backgroundColor: COLORS.primary }]}
        onPress={() => setShowPreApproveModal(true)}
        activeOpacity={0.8}
      >
        < Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <AddPreVisitorModal
        visible={showPreApproveModal}
        nightMode={nightMode}
        onClose={() => setShowPreApproveModal(false)}
        onDelivery={() => {
          setShowPreApproveModal(false);
          setTimeout(() => navigation.navigate('AddVisitor', { type: 'delivery' }), 200);
        }}
        onGuest={() => {
          setShowPreApproveModal(false);
          setTimeout(() => navigation.navigate('AddVisitor', { type: 'guest' }), 200);
        }}
        onCab={() => {
          setShowPreApproveModal(false);
          setTimeout(() => navigation.navigate('AddVisitor', { type: 'cab' }), 200);
        }}
        onOthers={() => {
          setShowPreApproveModal(false);
          setTimeout(() => navigation.navigate('AddVisitor', { type: 'others' }), 200);
        }}
      />
    </View>
  );
};

export default VisitorScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
});