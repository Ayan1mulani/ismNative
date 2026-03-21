// ServiceRequestPage.js
import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  FlatList,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import ComplaintCard from './complaintCard';
import { usePermissions } from '../../Utils/ConetextApi';
import { useNavigation } from '@react-navigation/native';
import BRAND from '../config';
import EmptyState from '../components/EmptyState';
import ComplaintStats from '../components/ComplaintStatsModal';

const CLOSED_STATUSES  = ['closed', 'resolved', 'completed'];
const OPEN_STATUSES    = ['open'];
const PENDING_STATUSES = ['wip', 'in progress', 'pending'];
const REOPEN_STATUSES  = ['reopen', 'reopened'];

export const getComplaintAction = (status, canReopen) => {
  const s = (status || '').toLowerCase().trim();
  if (CLOSED_STATUSES.includes(s))  return canReopen ? 'reopen' : 'none';
  if (REOPEN_STATUSES.includes(s))  return 'close';
  if (OPEN_STATUSES.includes(s) || PENDING_STATUSES.includes(s)) return 'close';
  return 'none';
};

const THEME = {
  light: { backgroundColor: '#f4f7f9', textColor: '#333333', inactiveTextColor: '#6c757d' },
  dark:  { backgroundColor: '#121212', textColor: '#ffffff', inactiveTextColor: '#aaaaaa' },
};

const SEGMENT_STATUSES = {
  open:    OPEN_STATUSES,
  pending: PENDING_STATUSES,
  reopen:  REOPEN_STATUSES,
  closed:  CLOSED_STATUSES,
};

// ─────────────────────────────────────────────────────────────────────────────
// Memoized card row — won't re-render unless the complaint object itself changes
// ─────────────────────────────────────────────────────────────────────────────
const ComplaintRow = React.memo(({ item, nightMode, canReopen, onPress }) => {
  const action = getComplaintAction(item.status, canReopen);
  return (
    <ComplaintCard
      complaint={item}
      nightMode={nightMode}
      action={action}
      canReopen={canReopen}
      onPress={onPress}
    />
  );
});

// ─────────────────────────────────────────────────────────────────────────────

const ComplaintListScreen = ({
  nightMode,
  status,
  complaints    = [],
  isLoading     = false,
  isLoadingMore = false,
  hasMore       = false,
  listBottomPadding = 190,
  onRefresh,
  onLoadMore,
  complaintStats,
  showStats  = false,
  canReopen  = false,
}) => {
  const navigation = useNavigation();
  const { nightMode: contextNightMode } = usePermissions();

  const currentNightMode = nightMode !== undefined ? nightMode : contextNightMode;
  const currentTheme     = currentNightMode ? THEME.dark : THEME.light;

  const [selectedSegment, setSelectedSegment] = useState(null);

  // ── Deduplicate ───────────────────────────────────────────────────────────
  const uniqueComplaints = useMemo(() => {
    const seen = new Set();
    return complaints.filter((item) => {
      const key = item.id ?? item.com_no;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [complaints]);

  // ── Segment filter ────────────────────────────────────────────────────────
  const filteredComplaints = useMemo(() => {
    if (!selectedSegment) return uniqueComplaints;
    const allowed = SEGMENT_STATUSES[selectedSegment] || [];
    return uniqueComplaints.filter((c) =>
      allowed.includes((c.status || '').toLowerCase().trim())
    );
  }, [uniqueComplaints, selectedSegment]);

  // ── Stable renderItem — useCallback so FlatList doesn't re-render all rows
  const renderItem = useCallback(({ item }) => {
    return (
      <ComplaintRow
        item={item}
        nightMode={currentNightMode}
        canReopen={canReopen}
        onPress={() =>
          navigation.navigate('ServiceRequestDetail', {
            complaint: item,
            canReopen,
            onGoBack:  onRefresh,
          })
        }
      />
    );
  }, [currentNightMode, canReopen, onRefresh, navigation]);

  const keyExtractor = useCallback((item, index) =>
    `complaint-${item.id ?? item.com_no ?? 'noid'}-${index}`,
  []);

  // ── onEndReached ──────────────────────────────────────────────────────────
  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore && !isLoading && filteredComplaints.length > 0) {
      onLoadMore?.();
    }
  }, [hasMore, isLoadingMore, isLoading, filteredComplaints.length, onLoadMore]);

  // ── Footer spinner ────────────────────────────────────────────────────────
  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={BRAND.COLORS.primary} />
        <Text style={[styles.footerText, { color: currentTheme.inactiveTextColor }]}>
          Loading more…
        </Text>
      </View>
    );
  }, [isLoadingMore, currentTheme.inactiveTextColor]);

  // ── Stats header (stable: only re-renders when complaintStats changes) ────
  const listHeader = useMemo(() => {
    if (!showStats || !complaintStats) return null;
    return (
      <ComplaintStats
        stats={complaintStats}
        theme={currentTheme}
        nightMode={currentNightMode}
        onSegmentPress={setSelectedSegment}
        selectedSegment={selectedSegment}
      />
    );
  }, [showStats, complaintStats, currentTheme, currentNightMode, selectedSegment]);

  // ── First-load spinner ────────────────────────────────────────────────────
  if (isLoading && uniqueComplaints.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: currentTheme.backgroundColor }]}>
        <ActivityIndicator size="large" color={BRAND.COLORS.primary} />
        <Text style={[styles.loadingText, { color: currentTheme.textColor }]}>
          Loading {status} complaints...
        </Text>
      </View>
    );
  }

  const emptyTitle = selectedSegment
    ? `No ${selectedSegment.charAt(0).toUpperCase() + selectedSegment.slice(1)} Complaints`
    : `No ${status} Complaints`;

  const emptySubtitle = selectedSegment
    ? `No ${selectedSegment} complaints found`
    : 'Complaints will appear here once submitted';

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <FlatList
        data={filteredComplaints}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeader}
        ListFooterComponent={renderFooter}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        // ── Perf tweaks ────────────────────────────────────────────────────
        removeClippedSubviews={true}     // unmount off-screen rows from memory
        maxToRenderPerBatch={8}          // render 8 items per JS batch (was default 10)
        updateCellsBatchingPeriod={30}   // ms between batches
        windowSize={7}                   // render 3 screens above + 3 below viewport
        initialNumToRender={10}          // first paint — only 10 items
        // ── Empty / refresh ───────────────────────────────────────────────
        ListEmptyComponent={
          <EmptyState
            icon="mail-open-outline"
            title={emptyTitle}
            subtitle={emptySubtitle}
            theme={{
              text:          currentTheme.textColor,
              textSecondary: currentTheme.inactiveTextColor,
            }}
          />
        }
        contentContainerStyle={
          filteredComplaints.length === 0
            ? styles.emptyContainer
            : { paddingBottom: listBottomPadding }
        }
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={onRefresh}
      />
    </View>
  );
};

// ── Wrap in React.memo with a shallow-equal check ─────────────────────────────
// Only re-render if one of these props actually changed value
export default React.memo(ComplaintListScreen, (prev, next) => {
  return (
    prev.complaints    === next.complaints    &&
    prev.isLoading     === next.isLoading     &&
    prev.isLoadingMore === next.isLoadingMore &&
    prev.hasMore       === next.hasMore       &&
    prev.nightMode     === next.nightMode     &&
    prev.canReopen     === next.canReopen     &&
    prev.complaintStats === next.complaintStats &&
    prev.showStats     === next.showStats     &&
    prev.status        === next.status
  );
});

const styles = StyleSheet.create({
  container:      { flex: 1 },
  centered:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flexGrow: 1 },
  loadingText: {
    fontSize:   14,
    marginTop:  10,
    textAlign:  'center',
    fontWeight: '500',
  },
  footerLoader: {
    flexDirection:  'row',
    justifyContent: 'center',
    alignItems:     'center',
    paddingVertical: 16,
    gap:            8,
  },
  footerText: { fontSize: 13 },
});