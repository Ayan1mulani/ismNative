import React, { useState, useMemo } from 'react';
import { StyleSheet, FlatList, Text, View, ActivityIndicator } from 'react-native';
import ComplaintCard from './complaintCard';
import { usePermissions } from '../../Utils/ConetextApi';
import { useNavigation } from '@react-navigation/native';
import BRAND from '../config';
import EmptyState from '../components/EmptyState';
import ComplaintStats from '../components/ComplaintStatsModal';

const THEME_COLORS = {
  primaryAccent: '#1996D3',
  inactiveText: '#6c757d',
  lightBackground: '#f4f7f9',
  darkBackground: '#121212',
  darkTextColor: '#ffffff',
  darkInactiveText: '#aaaaaa',
};

const ComplaintListScreen = ({
  nightMode,
  status,
  complaints = [],
  isLoading = false,
  listBottomPadding = 190,
  onRefresh,
  complaintStats,
  showStats = false
}) => {
  const navigation = useNavigation();
  const { nightMode: contextNightMode } = usePermissions();
  const currentNightMode = nightMode !== undefined ? nightMode : contextNightMode;

  // State to track which segment is selected (null = show all)
  const [selectedSegment, setSelectedSegment] = useState(null);

  const currentTheme = {
    backgroundColor: currentNightMode ? THEME_COLORS.darkBackground : THEME_COLORS.lightBackground,
    textColor: currentNightMode ? THEME_COLORS.darkTextColor : '#333333',
    inactiveTextColor: currentNightMode ? THEME_COLORS.darkInactiveText : THEME_COLORS.inactiveText,
  };

  // Deduplication logic
  const uniqueComplaints = useMemo(() => {
    const seen = new Set();
    return complaints.filter((item) => {
      const key = item.id ?? item.com_no;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [complaints]);

  // DEBUG: Log all unique status values to see what backend is sending
  useMemo(() => {
    const statuses = new Set();
    uniqueComplaints.forEach(c => {
      if (c.status) statuses.add(c.status.toLowerCase());
    });
    console.log('📊 All unique status values in complaints:', Array.from(statuses));
    console.log('📊 Total complaints:', uniqueComplaints.length);
    console.log('📊 Stats object:', complaintStats);

    // 👇 ADDED: Debug reopen count
    const reopenCount = uniqueComplaints.filter(c => {
      const s = (c.status || '').toLowerCase();
      return s === 'reopen' || s === 'reopened';
    }).length;
    console.log('🔄 Reopen count calculated:', reopenCount);
    console.log('🔄 Reopen from stats:', complaintStats?.reopen);
  }, [uniqueComplaints, complaintStats]);

  // Filter complaints based on selected segment
  const filteredComplaints = useMemo(() => {
    if (!selectedSegment) return uniqueComplaints;

    return uniqueComplaints.filter((complaint) => {
      const complaintStatus = (complaint.status || '').toLowerCase();

      // Debug: Log the actual status values (remove this after debugging)
      if (selectedSegment === 'pending') {
        console.log('Checking complaint status:', complaintStatus, 'for complaint:', complaint.com_no);
      }

      switch (selectedSegment) {
        case 'closed':
          return complaintStatus === 'closed'
        case 'open':
          return complaintStatus === 'open'
        case 'pending':
          return complaintStatus === 'wip'
        case 'reopen':  // 👈 ADDED: Handle reopen filter
          return complaintStatus === 'reopen' || complaintStatus === 'reopened'
        default:
          return true;
      }
    });
  }, [uniqueComplaints, selectedSegment]);

  const handleSegmentPress = (segment) => {
    console.log('🎯 Segment pressed:', segment);
    setSelectedSegment(segment);
  };

  // DEBUG: Log filtered results
  useMemo(() => {
    if (selectedSegment) {
      console.log(`🔍 Filtering by: ${selectedSegment}`);
      console.log(`🔍 Filtered count: ${filteredComplaints.length}`);
      console.log('🔍 Filtered statuses:', filteredComplaints.map(c => c.status?.toLowerCase()));
    }
  }, [selectedSegment, filteredComplaints]);

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

  const getEmptyStateMessage = () => {
    if (selectedSegment) {
      const segmentName = selectedSegment.charAt(0).toUpperCase() + selectedSegment.slice(1);
      return {
        title: `No ${segmentName} Complaints`,
        subtitle: `No ${segmentName.toLowerCase()} complaints found`
      };
    }
    return {
      title: `No ${status} Complaints`,
      subtitle: 'Complaints will appear here once submitted'
    };
  };

  const emptyStateMsg = getEmptyStateMessage();

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <FlatList
        data={filteredComplaints}
        ListHeaderComponent={
          showStats && complaintStats ? (
            <ComplaintStats
              stats={complaintStats}
              theme={currentTheme}
              nightMode={currentNightMode}
              onSegmentPress={handleSegmentPress}
              selectedSegment={selectedSegment}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <ComplaintCard
            complaint={item}
            nightMode={currentNightMode}
            onPress={() =>
              navigation.navigate('ServiceRequestDetail', {
                complaint: item,
                onGoBack: onRefresh, 
              })
            }
          />
        )}
        keyExtractor={(item, index) => `complaint-${item.id ?? item.com_no ?? 'noid'}-${index}`}
        ListEmptyComponent={() => (
          <EmptyState
            icon="mail-open-outline"
            title={emptyStateMsg.title}
            subtitle={emptyStateMsg.subtitle}
            theme={{
              text: currentTheme.textColor,
              textSecondary: currentTheme.inactiveTextColor
            }}
          />
        )}
        contentContainerStyle={[
          filteredComplaints.length === 0 ? styles.emptyContainer : { paddingBottom: listBottomPadding }
        ]}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={onRefresh}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flexGrow: 1,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default ComplaintListScreen;