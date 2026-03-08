import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { usePermissions } from '../../Utils/ConetextApi';
import { visitorServices } from '../../services/visitorServices';
import PreApproveModal from '../VisitorsScreen/components/AddPreVisitorModal';
import { useNavigation } from '@react-navigation/native';

const BASE_URL = "https://ism-vms.s3.amazonaws.com/company-logo/";
const DEFAULT_GUEST_IMAGE =
  "https://app.factech.co.in/user/assets/images/visitor/default-guest.png";

const VisitorSection = ({ refreshTrigger }) => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const { nightMode } = usePermissions();
  const [showPreApproveModal, setShowPreApproveModal] = useState(false);
  const navigation = useNavigation();
  



const fetchTodayArrivals = async () => {
  try {
    setLoading(true);

    const [visitorRes, passRes] = await Promise.all([
      visitorServices.getMyVisitors(),
      visitorServices.getMyPasses(),
    ]);

    const visitArray = visitorRes?.data?.visits || [];
    const passArray =
      passRes?.data?.passes ||
      passRes?.data?.visits ||
      passRes?.data ||
      [];

    const today = new Date().toISOString().split("T")[0];

    const isToday = (dateString) => {
      if (!dateString) return false;
      return dateString.split(" ")[0] === today;
    };

    const todayVisits = visitArray
      .filter(v => isToday(v.date_time || v.visit_date))
      .map(visit => ({
        id: `visit-${visit.id}`,
        name: visit.name || visit.visitor_data?.name || 'Unknown',
        role: visit.purpose || 'Visitor',
        avatar:
          visit.image && visit.image.startsWith('http')
            ? visit.image
            : DEFAULT_GUEST_IMAGE,
        created_at: visit.created_at,
        originalData: visit,
      }));

    const todayPasses = passArray
      .filter(p => isToday(p.date_time))
      .map(pass => ({
        id: `pass-${pass.id}`,
        name: pass.company_name || pass.name || 'Unknown',
        role: pass.purpose || 'Pass',
        avatar:
          pass.purpose?.toLowerCase() === "guest"
            ? DEFAULT_GUEST_IMAGE
            : pass.company_name
              ? `${BASE_URL}${pass.company_name
                  .toLowerCase()
                  .replace(/\s+/g, "-")}.png`
              : DEFAULT_GUEST_IMAGE,
        created_at: pass.created_at,
        originalData: pass,
      }));

    const combined = [...todayVisits, ...todayPasses].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    setVisitors(combined);

  } catch (error) {
    console.error("Error fetching arrivals:", error);
    setVisitors([]);
  } finally {
    setLoading(false);
  }
};
useEffect(() => {
  fetchTodayArrivals();
}, [refreshTrigger]);

  const getRoleColor = (role) => {
    const roleLower = role?.toLowerCase() || '';
    switch (roleLower) {
      case 'guest': return '#9C27B0';
      case 'delivery': return '#FF8C00';
      case 'cab': return '#00C853';
      case 'employee': return '#1976D2';
      default: return '#9C27B0';
    }
  };

  const theme = {
    background: nightMode ? '#111827' : '#FFFFFF',
    textMain: nightMode ? '#F9FAFB' : '#111827',
    textSub: nightMode ? '#9CA3AF' : '#6B7280',
    divider: nightMode ? '#374151' : '#F3F4F6',
    iconBtnBg: nightMode ? '#374151' : '#F9FAFB',
    ringColor: nightMode ? '#374151' : '#E5E7EB',
  };

  if (loading) {
    return (
      <View style={[styles.container, { minHeight: 80, justifyContent: 'center' }]}>
        <ActivityIndicator size="small" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          < Ionicons name="people" size={20} color={theme.textMain} />
          <Text style={[styles.title, { color: theme.textMain }]}>
            Arriving Today
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.iconBtnBg }]}
          onPress={() => setShowPreApproveModal(true)}
        >
          < Ionicons name="add" size={28} color={theme.textMain} />
        </TouchableOpacity>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.divider }]} />

      {visitors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ color: theme.textSub, fontSize: 13 }}>
            No arrivals today
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {visitors.map((visitor) => (
  <TouchableOpacity
    key={visitor.id}
    style={styles.visitorItem}
    activeOpacity={0.8}
    onPress={() =>
      navigation.navigate('PassDetails', {
        pass: visitor.originalData,
      })
    }
  >
    <View style={styles.avatarWrapper}>
      <View
        style={[
          styles.avatarRing,
          { borderColor: theme.ringColor },
        ]}
      >
        <Image
          source={{ uri: visitor.avatar }}
          style={styles.avatar}
          resizeMode="cover"
        />
      </View>

      <View
        style={[
          styles.roleBadge,
          {
            backgroundColor: getRoleColor(visitor.role),
            borderColor: theme.background,
          },
        ]}
      >
        <Text
          style={styles.roleBadgeText}
          numberOfLines={1}
        >
          {visitor.role}
        </Text>
      </View>
    </View>

    <Text
      style={[styles.name, { color: theme.textMain }]}
      numberOfLines={1}
    >
      {visitor.name}
    </Text>
  </TouchableOpacity>
))}
     
        </ScrollView>
      )}

  <PreApproveModal
  visible={showPreApproveModal}
  nightMode={nightMode}
  onClose={() => setShowPreApproveModal(false)}

  onDelivery={() => {
    setShowPreApproveModal(false);
    setTimeout(() => {
      navigation.navigate('AddVisitor', { type: 'delivery' });
    });
  }}

  onGuest={() => {
    setShowPreApproveModal(false);
    setTimeout(() => {
      navigation.navigate('AddVisitor', { type: 'guest' });
    });
  }}

  onCab={() => {
    setShowPreApproveModal(false);
    setTimeout(() => {
      navigation.navigate('AddVisitor', { type: 'cab' });
    });
  }}

  onOthers={() => {
    setShowPreApproveModal(false);
    setTimeout(() => {
      navigation.navigate('AddVisitor', { type: 'others' });
    });
  }}
/>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: -55,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
 
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 8,
    paddingRight: 20,
  },
  visitorItem: {
    alignItems: 'center',
    width: 60,
    marginRight: 14,
  },
  avatarWrapper: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 25,
    height: 25,
    borderRadius: 19,
  },
  roleBadge: {
    position: 'absolute',
    bottom: -8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1.5,
    minWidth: 40,
    alignItems: 'center',
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  name: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default VisitorSection;