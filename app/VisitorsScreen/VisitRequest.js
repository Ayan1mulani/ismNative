// VisitsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import BRAND from '../config'

const VisitsPage = ({ visitorData, loading, onRefresh, nightMode }) => {
  const navigation = useNavigation();

  const [filteredVisits, setFilteredVisits] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const theme = {
    background: nightMode ? '#121212' : '#ffffff',
    card: nightMode ? '#1E1E1E' : '#FFFFFF',
    text: nightMode ? '#FFFFFF' : '#1F2937',
    textSecondary: nightMode ? '#9E9E9E' : '#6B7280',
    primary: BRAND.COLORS.primaryDark,
    danger: '#EF4444',
    surface: '#F8F9FA',
    success: '#10B981',
    warning: '#F59E0B',
    grey: '#6B7280',
    searchBg: nightMode ? '#2E2E2E' : '#F1F3F5',
    border: '#E5E7EB',
  };

  useEffect(() => {
    applySearch();
  }, [visitorData, searchQuery]);

  const applySearch = () => {
    if (!visitorData?.visits) {
      setFilteredVisits([]);
      return;
    }

    let data = visitorData.visits;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(v =>
        v.name?.toLowerCase().includes(q) ||
        v.mobile?.includes(searchQuery) ||
        v.purpose?.toLowerCase().includes(q)
      );
    }

    setFilteredVisits(data);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  // ✅ Backend-driven status logic
  const getStatus = (visit) => {
    if (visit.attended === 1) {
      return { label: "ATTENDED", color: theme.success };
    }
    if (visit.attended === 0) {
      return { label: "NOT VISITED", color: theme.grey };
    }
    if (visit.end_time) {
      return { label: "COMPLETED", color: theme.warning };
    }
    return { label: "PENDING", color: theme.danger };
  };

  const renderCard = ({ item }) => {
    const status = getStatus(item);

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.card }]}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate("VisitDetailScreen", { visit: item })
        }
      >
        <View style={styles.cardHeader}>
          <Image
            source={{ uri: item.image || 'https://via.placeholder.com/100' }}
            style={styles.avatar}
          />

          <View style={styles.infoSection}>
            <Text style={[styles.title, { color: theme.text }]}>
              {item.purpose}
            </Text>
            <Text style={[styles.subText, { color: theme.textSecondary }]}>
              {item.name}
            </Text>
            <Text style={[styles.subText, { color: theme.textSecondary }]}>
              {item.mobile}
            </Text>
          </View>

          <View style={styles.rightSection}>
            <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
              <Text style={styles.statusText}>{status.label}</Text>
            </View>

            <Text style={[styles.ticketId, { color: theme.primary }]}>
              #{item.id}
            </Text>
          </View>
        </View>

        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <View style={styles.dateRow}>
            < Ionicons name="time-outline" size={16} color={theme.textSecondary} />
            <Text style={[styles.dateText, { color: theme.textSecondary }]}>
              {item.start_time
                ? new Date(item.start_time).toDateString()
                : "—"}
            </Text>
          </View>

          <Text style={[styles.createdText, { color: theme.textSecondary }]}>
            Created: {item.start_time
              ? new Date(item.start_time).toDateString()
              : "—"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.surface }]}>
          < Ionicons name="search-outline" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search name, purpose or phone"
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: showFilters ? theme.primary : theme.searchBg },
          ]}
          onPress={() => setShowFilters(!showFilters)}
        >
          < Ionicons
            name="filter"
            size={20}
            color={showFilters ? '#fff' : theme.textSecondary}
          />
        </TouchableOpacity>
      </View>

   <FlatList
  data={filteredVisits}
  renderItem={renderCard}
  keyExtractor={(item) => item.id.toString()}
  contentContainerStyle={{
    padding: 16,
    paddingBottom: 180,
    flexGrow: 1
  }}
  showsVerticalScrollIndicator={false}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor={theme.primary}
    />
  }
  ListEmptyComponent={() => (
    <View style={styles.emptyContainer}>
      < Ionicons name="people-outline" size={60} color={theme.textSecondary} />

      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        No Visitors Yet
      </Text>
    </View>
  )}
/>
    </View>
  );
};

export default VisitsPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:'#ffff'
  },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  searchContainer: {
    flexDirection: 'row',
      paddingHorizontal: 16,
      paddingTop: 10,
      gap: 10,
  },

  searchBar: {
        flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 10,
      paddingHorizontal: 12,
      height: 45,
  },

  searchInput: {
   flex: 1,
      marginLeft: 8,
      fontSize: 14,
  },

  filterButton: {
    width: 45,
      height: 45,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
  },

  card: {
    padding: 15,
  borderRadius: 14,
  marginBottom: 5,
  borderWidth: 1,
  borderColor: 'rgba(3, 65, 109, 0.04)',
  overflow: 'hidden', // 👈 important
  },
  emptyContainer: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  marginTop: 60,
},

emptyTitle: {
  fontSize: 18,
  fontWeight: "700",
  marginTop: 10,
},

emptySubtitle: {
  fontSize: 13,
  marginTop: 4,
},

emptyButton: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  marginTop: 16,
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: 8,
},

emptyButtonText: {
  color: "#fff",
  fontWeight: "600",
},

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E5E7EB',
  },

  infoSection: {
    flex: 1,
    marginLeft: 14,
  },

  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },

  subText: {
    fontSize: 14,
  },

  rightSection: {
    alignItems: 'flex-end',
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 6,
  },

  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  ticketId: {
    fontSize: 14,
    fontWeight: '600',
  },

  footer: {
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dateText: {
    marginLeft: 6,
    fontSize: 11,
  },

  createdText: {
    fontSize: 11,
  },
});