// ImportantContacts.js
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Linking, Alert,
} from 'react-native';
import { usePermissions } from '../../Utils/ConetextApi';

const CONTACTS = [
  { id: '1', name: 'Emergency', phone: '911',  image: 'https://cdn-icons-png.flaticon.com/512/7373/7373323.png' },
  { id: '2', name: 'Security',  phone: '1001', image: 'https://img.icons8.com/color/96/000000/security-checked.png' },
  { id: '3', name: 'Helpdesk',  phone: '2002', image: 'https://img.icons8.com/color/96/000000/help.png' },
  { id: '4', name: 'Secretary', phone: '3003', image: 'https://img.icons8.com/color/96/000000/administrator-male.png' },
];

export default function ImportantContacts() {
  const { nightMode } = usePermissions();

  const t = nightMode ? {
    bg:       '#1E1E2A',
    border:   '#2C2C3E',
    header:   '#60A5FA',
    name:     '#F3F4F6',
    phone:    '#9CA3AF',
    itemBorder:'#333348',
    callBg:   '#1996D3',
  } : {
    bg:       '#FFFFFF',
    border:   '#E5E7EB',
    header:   '#074B7C',
    name:     '#1F2937',
    phone:    '#6B7280',
    itemBorder:'#E5E7EB',
    callBg:   '#1996D3',
  };

  const handleCall = (phone) => {
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert('Error', 'Unable to place call')
    );
  };

  return (
    <View style={[s.container, { backgroundColor: t.bg, borderColor: t.border }]}>

      {/* Header */}
      <Text style={[s.header, { color: t.header }]}>Important Contacts</Text>

      {/* Single horizontal row */}
      <View style={s.row}>
        {CONTACTS.map((item, index) => (
          <View
            key={item.id}
            style={[
              s.item,
              { backgroundColor: t.itemBg, borderColor: t.itemBorder },
              index < CONTACTS.length - 1 && s.itemGap,
            ]}
          >
            {/* Avatar */}
            <Image source={{ uri: item.image }} style={s.avatar} />

            {/* Name */}
            <Text style={[s.name, { color: t.name }]} numberOfLines={1}>
              {item.name}
            </Text>

            {/* Phone */}
            <Text style={[s.phone, { color: t.phone }]} numberOfLines={1}>
              {item.phone}
            </Text>

       
          </View>
        ))}
      </View>

    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom:130
 
  },

  header: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 10,
  },

  // Single horizontal row
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  // Each contact column
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemGap: {
    marginRight: 6,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 5,
  },

  name: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 1,
    textAlign: 'center',
  },



});