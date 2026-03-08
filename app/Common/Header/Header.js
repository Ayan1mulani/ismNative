import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { usePermissions } from '../../../Utils/ConetextApi';
import { Common } from '../../../services/Common';
import { useNavigation } from '@react-navigation/native';
import BRAND from '../../config';

const ResidentHeader = () => {
  const navigation = useNavigation();
  const { nightMode } = usePermissions();
  const [userDetails, setUserDetails] = useState();
  const [societyInfo, setSocietyInfo] = useState(null);

  const theme = {
    background: nightMode ? '#1f2937' : '#ffffff',
    text: nightMode ? '#f9fafb' : '#111827',
    subText: nightMode ? '#9ca3af' : '#6b7280',
    border: nightMode ? '#374151' : '#E5E7EB',
  };

  useEffect(() => {
    const load = async () => {
      const details = await Common.getUserDetails();
      const user = await Common.getLoggedInUser();
      setUserDetails(details);
      setSocietyInfo(user?.society);
    };
    load();
  }, []);
return (
  <View style={{ backgroundColor: theme.background }}>
    <View style={[styles.header, { borderBottomColor: theme.border }]}>

      {/* LEFT SECTION */}
      <View style={styles.leftSection}>
        <View style={styles.iconContainer}>
 <Image source={BRAND.LOGO} style={styles.logoImage} resizeMode="contain" />
        </View>
   
        <View>
          <Text style={[styles.greetingText, { color: theme.text }]}>
            {BRAND.APP_NAME}
          </Text>
          <Text style={[styles.locationText, { color: theme.subText }]}>
            {userDetails?.society_name}
          </Text> 
        </View>
      </View>

      {/* RIGHT SECTION */}
      <View style={styles.rightSection}>

        {/* Search */}
        <TouchableOpacity
          onPress={() => navigation.navigate('AllServicesScreen')}
          style={styles.iconBtn}
        >
          < Ionicons name="search-outline" size={22} color={theme.text} />
        </TouchableOpacity>

        {/* Notification */}
        <TouchableOpacity
          onPress={() => navigation.navigate('NotificationsScreen')}
          style={styles.iconBtn}
        >
          < Ionicons
            name="notifications-outline"
            size={22}
            color={theme.text}
          />
        </TouchableOpacity>

      </View>

    </View>
  </View>
);
};

export default ResidentHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,   // tighter height
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSection: {
  flexDirection: 'row',
  alignItems: 'center',
},

iconBtn: {
  marginLeft: 16,
},
  iconContainer: {
    width: 44,
    height: 44,
    overflow: 'hidden',
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    
  },
  greetingText: {
    fontSize: 16,
    fontWeight: '700',
  },
  locationText: {
    fontSize: 13,
  },
});