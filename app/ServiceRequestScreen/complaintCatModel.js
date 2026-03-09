import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TextInput
} from 'react-native';

import { usePermissions } from '../../Utils/ConetextApi';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { complaintService } from '../../services/complaintService';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BRAND from '../config'

const { width } = Dimensions.get('window');

const H_PADDING = 16;
const GAP = 10;
const CARD_WIDTH = (width - H_PADDING * 2 - GAP * 2) / 3;

const CategorySelectionScreen = () => {

  const { nightMode } = usePermissions();
  const navigation = useNavigation();

  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const theme = nightMode
    ? {
        background: '#121212',
        surface: '#1E1E1E',
        border: '#2C2C2C',
        text: '#FFFFFF',
        secondary: '#9CA3AF',
        searchBg: '#2A2A2A',
      }
    : {
        background: '#FFFFFF',
        surface: '#FFFFFF',
        border: '#E5E7EB',
        text: '#111827',
        secondary: '#030916',
        searchBg: '#F3F4F6',
      };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {

      setLoading(true);

      const res = await complaintService.getCategories();

      const list = Object.values(res.data).map((c) => ({
        id: c.id,
        name: c.name,
        sub_catagory: c.sub_catagory || [],
      }));

      setCategories(list);

    } catch (e) {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const rows = [];
  for (let i = 0; i < filtered.length; i += 3) {
    rows.push(filtered.slice(i, i + 3));
  }

  const getIcon = (name) => {

    const n = name.toLowerCase();

    if (n.includes('electric')) return 'electrical-services';
    if (n.includes('plumb')) return 'plumbing';
    if (n.includes('ac') || n.includes('air')) return 'ac-unit';
    if (n.includes('clean')) return 'cleaning-services';
    if (n.includes('security')) return 'security';
    if (n.includes('paint')) return 'format-paint';
    if (n.includes('carp')) return 'carpenter';
    if (n.includes('garden')) return 'park';
    if (n.includes('water')) return 'water-drop';

    return 'handyman';
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={BRAND.COLORS.primary} />
          <Text style={{ marginTop: 8, color: theme.secondary }}>
            Loading categories...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (

    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={['top']}
    >

      {/* HEADER */}
      <View style={styles.header}>       

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton]}
        >
          < Ionicons name="arrow-back" size={18} color={theme.text} />
        </TouchableOpacity>

        <View>
          <Text style={[styles.title, { color: theme.text }]}>
            Select Category
          </Text>

          <Text style={[styles.subtitle, { color: theme.secondary }]}>
            {filtered.length} available
          </Text>
        </View>

      </View>


      {/* SEARCH BAR */}

      <View
        style={[
          styles.searchBar,
          { backgroundColor: theme.searchBg, borderColor: theme.border }
        ]}
      >

        < Ionicons name="search" size={18} color={theme.secondary} />

        <TextInput
          placeholder="Search category..."
          placeholderTextColor={theme.secondary}
          value={search}
          onChangeText={setSearch}
          style={[styles.searchInput, { color: theme.text }]}
        />

        {search !== "" && (
          <TouchableOpacity onPress={() => setSearch("")}>
            < Ionicons name="close-circle" size={18} color={theme.secondary} />
          </TouchableOpacity>
        )}

      </View>


      {/* GRID */}

      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >

        {filtered.length === 0 ? (

          <View style={styles.emptyContainer}>
            <MaterialIcons name="search-off" size={36} color={theme.secondary} />
            <Text style={{ marginTop: 6, color: theme.secondary }}>
              No categories found
            </Text>
          </View>

        ) : (

          rows.map((row, index) => (

            <View key={index} style={styles.row}>

              {row.map((item) => (

                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  activeOpacity={0.75}
                  onPress={() =>
                    navigation.navigate('SubCategorySelection', {
                      selectedCategory: item,
                    })
                  }
                >


                  <Text
                    style={[styles.cardText, { color: theme.text }]}
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>

                </TouchableOpacity>

              ))}

              {row.length < 3 &&
                Array.from({ length: 3 - row.length }).map((_, i) => (
                  <View key={i} style={{ width: CARD_WIDTH }} />
                ))}

            </View>

          ))

        )}

      </ScrollView>

    </SafeAreaView>
  );
};

export default CategorySelectionScreen;


const styles = StyleSheet.create({

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: H_PADDING,
    paddingTop: 6,
    paddingBottom: 12,
    marginBottom: 10,
  },

  backButton: {
    width: 34,
    height: 34,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 18,
    fontWeight: '600',
  },

  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: H_PADDING,
    marginBottom: 14,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    gap: 6,
    borderWidth: 1,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: H_PADDING,
    marginBottom: GAP,
  },

  card: {
    width: CARD_WIDTH,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
  },

  cardText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },

});