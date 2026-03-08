// PassPage.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';


const BASE_URL = "https://ism-vms.s3.amazonaws.com/company-logo/";
const DEFAULT_GUEST_IMAGE =
  "https://app.factech.co.in/user/assets/images/visitor/default-guest.png";

// Theme configuration
const COLORS = {
  primary: '#1996D3',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',

  // Light theme
  light: {
    background: '#FFFFFF',
    surface: '#F8F9FA',
    text: '#212529',
    textSecondary: '#6C757D',
    border: '#DEE2E6',
  },

  // Dark theme
  dark: {
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#9E9E9E',
    border: '#2C2C2C',
  },
};

// Pass status constants
const PASS_STATUS = {
  ACTIVE: '1',
  INACTIVE: '0',
};

// Pass purpose icons mapping
const PURPOSE_ICONS = {
  guest: 'people-outline',
  delivery: 'cube-outline',
  visitor: 'person-outline',
  service: 'construct-outline',
  vendor: 'briefcase-outline',
  cab: 'car-outline',
  taxi: 'car-outline',
  default: 'card-outline',
};

const SingleEntryPassPage = ({ nightMode, passData, loading, parkingBookings, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);

  const theme = nightMode ? COLORS.dark : COLORS.light;


  const getPassImage = (pass) => {
    const purpose = pass.purpose?.toLowerCase();

    if (purpose === "guest") {
      return DEFAULT_GUEST_IMAGE;
    }

    if (purpose === "cab" || purpose === "delivery") {
      const name = pass.company_name || pass.name;
      if (!name) return null;

      const fileName = name.toLowerCase().replace(/\s+/g, "-");
      return `${BASE_URL}${fileName}.png`;
    }

    return null;
  };

  const getPassStatus = (status) => {
    const statusStr = String(status);

    if (statusStr === PASS_STATUS.ACTIVE) {
      return {
        label: 'ACTIVE',
        color: COLORS.success,
      };
    } else if (statusStr === PASS_STATUS.INACTIVE) {
      return {
        label: 'INACTIVE',
        color: COLORS.error,
      };
    } else {
      return {
        label: 'PENDING',
        color: COLORS.warning,
      };
    }
  };


  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };



  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setIsRefreshing(false);
  };


  const getSmartDateLabel = (dateString) => {
    if (!dateString) return null;

    const today = new Date();
    const visitDate = new Date(dateString);

    today.setHours(0, 0, 0, 0);
    visitDate.setHours(0, 0, 0, 0);

    const diffTime = visitDate.getTime() - today.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    let label = formatDate(dateString);

    if (diffDays === 0) {
      label = "Today";
    } else if (diffDays === 1) {
      label = "Tomorrow";
    }

    return {
      label,
      color: theme.textSecondary, // 👈 SAME COLOR FOR ALL
    };
  };

  // 👇 PLACE THIS ABOVE renderPassCard
const getParkingBooking = (pass) => {
  if (!parkingBookings || parkingBookings.length === 0) return null;

  return parkingBookings.find(
    booking =>
      booking.reference_id &&
      String(booking.reference_id) === String(pass.id)
  );
};
  const renderPassCard = ({ item: pass }) => {
    const parkingBooking = getParkingBooking(pass);

    const status = getPassStatus(pass.status);
 
    // console.log("PASS:", pass.id, "Parking Match:", parkingBooking);
    return (
      <TouchableOpacity
        style={[styles.card, {
          backgroundColor: '#ffff',
        }]}
        onPress={() => navigation.navigate('PassDetails', { pass })}

        activeOpacity={0.7}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.leftSection}>
            <View style={[styles.iconContainer, {
              backgroundColor: `${COLORS.primary}15`,
            }]}>
              <Image
                source={{ uri: getPassImage(pass) }}
                style={styles.passImage}
                resizeMode="contain"
                onError={() => console.log("Image load failed")}
                alt='images'
              />
            </View>
            <View style={styles.passInfo}>
              <Text style={[styles.passTitle, { color: theme.text }]} numberOfLines={1}>
                {pass.purpose.charAt(0).toUpperCase() + pass.purpose.slice(1)} Pass
              </Text>
              {pass.purpose?.toLowerCase() !== "cab" &&
                pass.purpose?.toLowerCase() !== "delivery" && (
                  <Text
                    style={[styles.passName, { color: theme.textSecondary }]}
                    numberOfLines={1}
                  >
                    {pass.name}
                  </Text>
                )}

              {pass.purpose?.toLowerCase() !== "cab" &&
                pass.purpose?.toLowerCase() !== "delivery" && (
                  <Text style={[styles.passPhone, { color: theme.textSecondary }]}>
                    {pass.mobile}
                  </Text>
                )}
              {(pass.purpose?.toLowerCase() === "cab" ||
                pass.purpose?.toLowerCase() === "delivery") && (
                  <Text
                    style={[styles.companyName, { color: COLORS.primary }]}
                    numberOfLines={1}
                  >
                    {pass.company_name || pass.name}
                  </Text>
                )}
            </View>
          </View>

          <View style={styles.rightSection}>
            <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
              <Text style={styles.statusLabel}>{status.label}</Text>
            </View>
            {pass.pass_no && pass.purpose !== "delivery" && (
              <Text style={[styles.passNumber, { color: COLORS.primary }]}>
                #{pass.pass_no}
              </Text>
            )}



            {/* Parking Indicator */}
            {parkingBooking && (
              <View style={styles.parkingIndicator}>
                < Ionicons name="car" size={18} color={COLORS.primary} />
              </View>
            )}



          </View>
        </View>

        {/* Card Footer */}
        <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
          <View style={styles.validitySection}>
            < Ionicons
              name="time-outline"
              size={16}
              color={theme.textSecondary}
            />

            <Text style={{ fontSize: 13 }}>
              <Text style={{ color: theme.textSecondary }}>
                {" "}
              </Text>

              <Text
                style={{
                  color: getSmartDateLabel(pass.date_time)?.color,
                  fontWeight: "600",
                }}
              >
                {getSmartDateLabel(pass.date_time)?.label}
              </Text>
            </Text>
          </View>

          <Text style={[styles.createdDate, { color: theme.textSecondary }]}>
            Created: {formatDate(pass.created_at)}
          </Text>
        </View>



        {/* Remarks Section */}
        {pass.remarks && (
          <View style={[styles.remarksSection, { borderTopColor: theme.border }]}>
            < Ionicons name="chatbubble-outline" size={14} color={theme.textSecondary} />
            <Text style={[styles.remarksText, { color: theme.textSecondary }]} numberOfLines={2}>
              {pass.remarks}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      < Ionicons name="card-outline" size={64} color={theme.textSecondary} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        No Passes Found
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        Create a new pass to get started
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={[styles.loadingState, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={[styles.loadingText, { color: theme.text }]}>
        Loading passes...
      </Text>
    </View>
  );

  const styles = createStyles(theme, nightMode);

  if (loading) {
    return renderLoadingState();
  }

  const filteredData = (passData || [])
    .filter(pass => {
      const query = searchQuery.toLowerCase();

      const searchableText = [
        pass.name,
        pass.mobile,
        pass.purpose,
        pass.company_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(query);

      const matchesType =
        selectedStatus === 'ALL' ||
        pass.purpose?.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });



  return (
    <View
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top", "left", "right"]}
    >
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
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              < Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: showFilters ? COLORS.primary : theme.surface }
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
      {showFilters && (
        <View style={styles.filterContainer}>
          {['ALL', 'guest', 'delivery', 'cab'].map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    selectedStatus === type
                      ? COLORS.primary
                      : theme.surface
                }
              ]}
              onPress={() => setSelectedStatus(type)}
            >
              <Text
                style={{
                  color:
                    selectedStatus === type ? '#fff' : theme.text,
                  fontWeight: '600',
                }}
              >
                {type === 'ALL'
                  ? 'All'
                  : type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.container}>
        <FlatList
          data={filteredData}
          renderItem={renderPassCard}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />

      </View>
    </View>

  );
};

const createStyles = (theme, nightMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      fontWeight: '500',
    },
    listContent: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingBottom: 200, // more space than FAB bottom
    },
    card: {
      padding: 15,
      borderRadius: 14,
      marginBottom: 5,
      borderWidth: 1,
      borderColor: 'rgba(3, 65, 109, 0.04)',
      overflow: 'hidden', // 👈 important

    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    leftSection: {
      flexDirection: 'row',
      flex: 1,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    passInfo: {
      flex: 1,
    },
    passImage: {
      width: 36,
      height: 36,
    },
    passTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 2,
    },
    passName: {
      fontSize: 14,
      marginBottom: 2,
    },
    passPhone: {
      fontSize: 13,
      marginBottom: 2,
    },
    companyName: {
      fontSize: 13,
      fontWeight: '500',
      marginTop: 2,
    },
    rightSection: {
      alignItems: 'flex-end',
      gap: 4,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    statusLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    passNumber: {
      fontSize: 12,
      fontWeight: '600',
    },
    parkingIndicator: {
      marginTop: 4,
      padding: 4,
      backgroundColor: `${COLORS.primary}15`,
      borderRadius: 6,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    validitySection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 6,
    },
    validityText: {
      fontSize: 13,
      fontWeight: '500',
    },
    createdDate: {
      fontSize: 11,
    },
    remarksSection: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingTop: 8,
      marginTop: 8,
      gap: 6,
    },

    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 80,
      paddingHorizontal: 32,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      marginTop: 16,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 15,
      textAlign: 'center',
      lineHeight: 22,
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

    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 10,
    },

    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
    },
  });

export default SingleEntryPassPage;