// PassPage.js
import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import BRAND from '../config';
import EmptyState from '../components/EmptyState';

const BASE_URL          = "https://ism-vms.s3.amazonaws.com/company-logo/";
const DEFAULT_GUEST_URI = "https://app.factech.co.in/user/assets/images/visitor/default-guest.png";
const LOCAL_IMAGES      = {
  cab:      require('../../assets/images/cab.jpg'),
  delivery: require('../../assets/images/delivery.jpg'),
};

const COLORS = {
  primary: BRAND.COLORS.primaryDark,
  success: '#34C759',
  warning: '#FF9500',
  error:   '#FF3B30',
  light: {
    background:    '#FFFFFF',
    surface:       '#F8F9FA',
    text:          '#212529',
    textSecondary: '#6C757D',
    border:        '#DEE2E6',
  },
  dark: {
    background:    '#121212',
    surface:       '#1E1E1E',
    text:          '#FFFFFF',
    textSecondary: '#9E9E9E',
    border:        '#2C2C2C',
  },
};

const PASS_STATUS = { ACTIVE: '0', INACTIVE: '1' };

// ─────────────────────────────────────────────────────────────────────────────
// getPassImage — pure function, returns STABLE references
//
// BUG (old): returned `{ uri: "..." }` (new object) on every call.
// PassAvatar's useEffect watched `source` by reference → fired every render
// → setState → re-render → new object → fired again = infinite loop.
//
// FIX: for local assets return the stable require() constant.
//      for remote URIs return the URI *string* so PassAvatar can compare
//      with a simple string equality check instead of object identity.
// ─────────────────────────────────────────────────────────────────────────────
const getPassImageSource = (pass) => {
  const purpose = (pass.purpose || '').toLowerCase();
  const name    = (pass.company_name || pass.name || '').toLowerCase();

  if (purpose === 'guest') {
    return DEFAULT_GUEST_URI;                         // stable string
  }

  if (purpose === 'cab' || purpose === 'delivery') {
    if (!name) {
      return LOCAL_IMAGES[purpose];                   // stable require() ref
    }
    return `${BASE_URL}${name.replace(/\s+/g, '-')}.png`; // stable string
  }

  return DEFAULT_GUEST_URI;
};

// ─────────────────────────────────────────────────────────────────────────────
// PassAvatar — now receives a URI string OR a local require() number.
// Compares by string/number value so useEffect only fires when the
// actual image truly changes, not on every parent render.
// ─────────────────────────────────────────────────────────────────────────────
const PassAvatar = memo(({ source, purpose, style }) => {
  // `source` is either a string (remote URI) or a number (require())
  const isRemote       = typeof source === 'string';
  const [imgSrc, setImgSrc] = useState(
    isRemote ? { uri: source } : source
  );

  // Only update when the *value* of source changes (string/number comparison)
  const prevSource = useRef(source);
  useEffect(() => {
    if (prevSource.current === source) return;  // same value → skip
    prevSource.current = source;
    setImgSrc(isRemote ? { uri: source } : source);
  }, [source]);                                 // safe: source is primitive

  const handleError = useCallback(() => {
    const p = (purpose || '').toLowerCase();
    if (p === 'cab')      setImgSrc(LOCAL_IMAGES.cab);
    else if (p === 'delivery') setImgSrc(LOCAL_IMAGES.delivery);
    else                  setImgSrc({ uri: DEFAULT_GUEST_URI });
  }, [purpose]);

  return (
    <Image
      source={imgSrc}
      style={style}
      resizeMode="cover"
      onError={handleError}
    />
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// PassCard — isolated memo component so only changed cards re-render
// ─────────────────────────────────────────────────────────────────────────────
const PassCard = memo(({ pass, theme, parkingBooking, onPress }) => {
  const statusStr = String(pass.status);
  const status = statusStr === PASS_STATUS.ACTIVE
    ? { label: 'ACTIVE',   color: COLORS.success }
    : statusStr === PASS_STATUS.INACTIVE
    ? { label: 'INACTIVE', color: COLORS.error }
    : { label: 'PENDING',  color: COLORS.warning };

  const formatDate = (ds) => {
    try {
      return new Date(ds).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      });
    } catch { return ds; }
  };

  const smartDate = useMemo(() => {
    if (!pass.date_time) return null;
    const today     = new Date(); today.setHours(0,0,0,0);
    const visitDate = new Date(pass.date_time); visitDate.setHours(0,0,0,0);
    const diff      = (visitDate - today) / 86_400_000;
    const label     = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : formatDate(pass.date_time);
    return { label, color: theme.textSecondary };
  }, [pass.date_time, theme.textSecondary]);

  const purposeLower = (pass.purpose || '').toLowerCase();
  const isCabOrDelivery = purposeLower === 'cab' || purposeLower === 'delivery';
  const imgSource = useMemo(() => getPassImageSource(pass), [pass.purpose, pass.company_name, pass.name]);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: '#fff' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.leftSection}>
          <View style={styles.iconContainer}>
            <PassAvatar source={imgSource} purpose={pass.purpose} style={styles.passImage} />
          </View>
          <View style={styles.passInfo}>
            <Text style={[styles.passTitle, { color: theme.text }]} numberOfLines={1}>
              {pass.purpose.charAt(0).toUpperCase() + pass.purpose.slice(1)} Pass
            </Text>
            {!isCabOrDelivery && (
              <>
                <Text style={[styles.passName,  { color: theme.textSecondary }]} numberOfLines={1}>
                  {pass.name}
                </Text>
                <Text style={[styles.passPhone, { color: theme.textSecondary }]}>
                  {pass.mobile}
                </Text>
              </>
            )}
            {isCabOrDelivery && (
              <Text style={[styles.companyName, { color: COLORS.primary }]} numberOfLines={1}>
                {pass.company_name || pass.name}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.rightSection}>
          <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
            <Text style={styles.statusLabel}>{status.label}</Text>
          </View>
          {pass.pass_no && purposeLower !== 'delivery' && (
            <Text style={[styles.passNumber, { color: COLORS.primary }]}>
              #{pass.pass_no}
            </Text>
          )}
          {parkingBooking && (
            <View style={styles.parkingIndicator}>
              <Ionicons name="car" size={18} color={COLORS.primary} />
            </View>
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
        <View style={styles.validitySection}>
          <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
          {smartDate && (
            <Text style={{ fontSize: 13, color: smartDate.color, fontWeight: '600' }}>
              {smartDate.label}
            </Text>
          )}
        </View>
        <Text style={[styles.createdDate, { color: theme.textSecondary }]}>
          Created: {formatDate(pass.created_at)}
        </Text>
      </View>

      {/* Remarks */}
      {!!pass.remarks && (
        <View style={[styles.remarksSection, { borderTopColor: theme.border }]}>
          <Ionicons name="chatbubble-outline" size={14} color={theme.textSecondary} />
          <Text style={[styles.remarksText, { color: theme.textSecondary }]} numberOfLines={2}>
            {pass.remarks}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
const SingleEntryPassPage = ({ nightMode, passData, loading, parkingBookings, onRefresh }) => {
  const [isRefreshing, setIsRefreshing]     = useState(false);
  const [searchQuery, setSearchQuery]       = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [showFilters, setShowFilters]       = useState(false);

  const navigation = useNavigation();
  const theme      = nightMode ? COLORS.dark : COLORS.light;

  // ── Build a lookup Map so getParkingBooking is O(1) not O(n) ─────────────
  // BUG (old): .find() loop inside renderItem = O(n×m) on every render
  const parkingMap = useMemo(() => {
    const map = new Map();
    (parkingBookings || []).forEach(b => {
      if (b.reference_id != null) map.set(String(b.reference_id), b);
    });
    return map;
  }, [parkingBookings]);

  // ── Memoized filtered + sorted list ──────────────────────────────────────
  // BUG (old): recalculated on every render even without data change
  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return (passData || [])
      .filter(pass => {
        const text = [pass.name, pass.mobile, pass.purpose, pass.company_name]
          .filter(Boolean).join(' ').toLowerCase();
        const matchSearch = !q || text.includes(q);
        const matchType   =
          selectedStatus === 'ALL' ||
          (pass.purpose || '').toLowerCase() === selectedStatus.toLowerCase();
        return matchSearch && matchType;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [passData, searchQuery, selectedStatus]);

  // ── Stable callbacks ──────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await onRefresh?.();
    setIsRefreshing(false);
  }, [onRefresh]);

  const handleClearSearch   = useCallback(() => setSearchQuery(''),     []);
  const handleToggleFilters = useCallback(() => setShowFilters(v => !v), []);

  // ── Stable renderItem — won't cause full FlatList re-render ──────────────
  // BUG (old): defined inline → new function ref every render → all rows re-render
  const renderItem = useCallback(({ item: pass }) => (
    <PassCard
      pass={pass}
      theme={theme}
      parkingBooking={parkingMap.get(String(pass.id))}
      onPress={() =>
        navigation.navigate('PassDetails', { pass, onGoBack: handleRefresh })
      }
    />
  ), [theme, parkingMap, handleRefresh, navigation]);

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  if (loading) {
    return (
      <View style={[styles.loadingState, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>Loading passes...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.surface }]}>
          <Ionicons name="search-outline" size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search name, purpose or phone"
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: showFilters ? COLORS.primary : theme.surface },
          ]}
          onPress={handleToggleFilters}
        >
          <Ionicons name="filter" size={20} color={showFilters ? '#fff' : theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      {showFilters && (
        <View style={styles.filterContainer}>
          {['ALL', 'guest', 'delivery', 'cab'].map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterChip,
                { backgroundColor: selectedStatus === type ? COLORS.primary : theme.surface },
              ]}
              onPress={() => setSelectedStatus(type)}
            >
              <Text style={{ color: selectedStatus === type ? '#fff' : theme.text, fontWeight: '600' }}>
                {type === 'ALL' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* List */}
      <View style={styles.container}>
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          // ── Perf tweaks ────────────────────────────────────────────────
          removeClippedSubviews
          maxToRenderPerBatch={8}
          updateCellsBatchingPeriod={30}
          windowSize={7}
          initialNumToRender={10}
          // ──────────────────────────────────────────────────────────────
          contentContainerStyle={
            filteredData.length === 0
              ? { flexGrow: 1, paddingTop: 120, paddingHorizontal: 16 }
              : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="card-outline"
              title="No Passes Found"
              subtitle="Create a new pass to get started"
              theme={theme}
            />
          }
        />
      </View>
    </View>
  );
};

export default SingleEntryPassPage;

// ─────────────────────────────────────────────────────────────────────────────
// Styles — defined once at module level, not inside render
// BUG (old): createStyles(theme, nightMode) was called inside the component
// body → new StyleSheet object created on every single render
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:       { flex: 1 },
  loadingState:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:     { marginTop: 16, fontSize: 16, fontWeight: '500' },
  listContent:     { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 200 },
  card: {
    padding:       15,
    borderRadius:  14,
    marginBottom:  5,
    borderWidth:   1,
    borderColor:   'rgba(3, 65, 109, 0.04)',
    overflow:      'hidden',
  },
  cardHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   12,
  },
  leftSection:     { flexDirection: 'row', flex: 1 },
  iconContainer: {
    width:          48,
    height:         48,
    borderRadius:   24,
    justifyContent: 'center',
    alignItems:     'center',
    marginRight:    12,
  },
  passInfo:        { flex: 1 },
  passImage:       { width: 40, height: 40, borderRadius: 20 },
  passTitle:       { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  passName:        { fontSize: 14, marginBottom: 2 },
  passPhone:       { fontSize: 13, marginBottom: 2 },
  companyName:     { fontSize: 13, fontWeight: '500', marginTop: 2 },
  rightSection:    { alignItems: 'flex-end', gap: 4 },
  statusBadge:     { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusLabel:     { fontSize: 10, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
  passNumber:      { fontSize: 12, fontWeight: '600' },
  parkingIndicator:{ marginTop: 4, padding: 4, borderRadius: 6 },
  cardFooter: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  validitySection: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 },
  createdDate:     { fontSize: 11 },
  remarksSection: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    paddingTop:    8,
    marginTop:     8,
    gap:           6,
  },
  remarksText:     { flex: 1, fontSize: 13, lineHeight: 18 },
  searchContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 10, gap: 10 },
  searchBar: {
    flex:            1,
    flexDirection:   'row',
    alignItems:      'center',
    borderRadius:    10,
    paddingHorizontal: 12,
    height:          45,
  },
  searchInput:     { flex: 1, marginLeft: 8, fontSize: 14 },
  filterButton:    { width: 45, height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  filterChip:      { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
});