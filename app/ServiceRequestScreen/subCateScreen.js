// SubCategorySelectionScreen.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { usePermissions } from '../../Utils/ConetextApi';
import { SafeAreaView } from 'react-native-safe-area-context';
import BRAND from '../config'



const ICON_MAP = [
  { keys: ['electric', 'power'], name: 'electrical-services' },
  { keys: ['plumb', 'water'], name: 'plumbing' },
  { keys: ['ac', 'air'], name: 'ac-unit' },
  { keys: ['clean'], name: 'cleaning-services' },
  { keys: ['security'], name: 'security' },
  { keys: ['paint'], name: 'format-paint' },
  { keys: ['carp'], name: 'carpenter' },
  { keys: ['garden'], name: 'park' },
];

const getIcon = (name = '') => {
  const n = name.toLowerCase();
  const hit = ICON_MAP.find(m => m.keys.some(k => n.includes(k)));
  return hit?.name || 'handyman';
};

const SubCategorySelectionScreen = ({ navigation, route }) => {
  const { nightMode } = usePermissions();

  const selectedCategory = route?.params?.selectedCategory || {};
  const subCategories = selectedCategory?.sub_catagory || [];

  const theme = nightMode
    ? {
        bg: '#121212',
        surface: '#1E1E1E',
        border: '#2C2C2C',
        text: '#FFFFFF',
        sub: '#9CA3AF',
      }
    : {
        bg: '#FFFFFF',
        surface: '#FFFFFF',
        border: '#E5E7EB',
        text: '#111827',
        sub: '#6B7280',
      };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={['top']}>
  

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { borderColor: theme.border }]}
        >
          < Ionicons name="arrow-back" size={18} color={theme.text} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {selectedCategory?.name || 'Select Issue'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.sub }]}>
            {subCategories.length} issue types
          </Text>
        </View>
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {subCategories.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="search-off" size={32} color={theme.sub} />
            <Text style={{ marginTop: 6, color: theme.sub }}>
              No issue types available
            </Text>
          </View>
        ) : (
          subCategories.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.card,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              activeOpacity={0.75}
              onPress={() =>
                navigation.navigate('complaintInput', {
                  category: selectedCategory,
                  subCategory: item,
                })
              }
            >
              <MaterialIcons
                name={getIcon(item.name)}
                size={22}
                color={BRAND.COLORS.primary}
              />

              <Text
                style={[styles.cardText, { color: theme.text }]}
                numberOfLines={2}
              >
                {item.name}
              </Text>

              < Ionicons
                name="chevron-forward"
                size={16}
                color={theme.sub}
              />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SubCategorySelectionScreen;

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
    gap: 10,
    marginBottom:20
  },

  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 17,
    fontWeight: '600',
  },

  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 20,   // reduced from 20 (less white space)
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 10,
  },

  cardText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
  },
});