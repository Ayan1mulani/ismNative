import React from 'react';
import { StyleSheet, FlatList, Text, View, ActivityIndicator } from 'react-native';
import ComplaintCard from './complaintCard';
import { usePermissions } from '../../Utils/ConetextApi';
import { useNavigation } from '@react-navigation/native';
import BRAND from '../config'
import EmptyState from '../components/EmptyState';

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
  listBottomPadding = 182,
  onRefresh,
}) => {
  // ── Hooks — always at top, never inside conditions ──
  const navigation = useNavigation();
  const { nightMode: contextNightMode } = usePermissions();

  const currentNightMode = nightMode !== undefined ? nightMode : contextNightMode;

  const currentTheme = {
    backgroundColor: currentNightMode ? THEME_COLORS.darkBackground : THEME_COLORS.lightBackground,
    textColor: currentNightMode ? THEME_COLORS.darkTextColor : THEME_COLORS.darkText,
    inactiveTextColor: currentNightMode ? THEME_COLORS.darkInactiveText : THEME_COLORS.inactiveText,
  };
  const uniqueComplaints = React.useMemo(() => {
    const seen = new Set();
    return complaints.filter((item) => {
      const key = item.id ?? item.com_no;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [complaints]);
  // ── Loading state ──
  if (isLoading) {
    return (
      <View style={[styles.centered]}>
        <ActivityIndicator size="large" color={BRAND.COLORS.primary} />
        <Text style={[styles.loadingText, { color: currentTheme.textColor }]}>
          Loading {status} complaints...
        </Text>
      </View>
    );
  }

  // ── List ──
  return (
    <View style={styles.container}>

      <FlatList
        data={uniqueComplaints}
        renderItem={({ item }) => (
          <ComplaintCard
            complaint={item}
            nightMode={currentNightMode}
            onPress={() => navigation.navigate('ServiceRequestDetail', { complaint: item })}
          />
        )}
        keyExtractor={(item, index) =>
          `complaint-${item.id ?? item.com_no ?? 'noid'}-${index}`
        }
        ListEmptyComponent={() => (
          <EmptyState
            icon="chatbubble-ellipses-outline"
            title={`No ${status} Complaints`}
            subtitle="Complaints will appear here once submitted"
            theme={{
              text: currentTheme.textColor,
              textSecondary: currentTheme.inactiveTextColor
            }}
          />
        )}
        contentContainerStyle={
          uniqueComplaints.length === 0
            ? styles.emptyContainer
            : { paddingVertical: 10, paddingBottom: listBottomPadding }
        }
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

  // Full-screen center for loading state
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
  flexGrow: 1,
  paddingTop: 120, // 👈 moves empty message downward
},
  loadingText: {
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
});

export default ComplaintListScreen;