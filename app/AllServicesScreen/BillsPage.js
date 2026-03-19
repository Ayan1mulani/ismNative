import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { usePermissions } from '../../Utils/ConetextApi';
import { hasPermission } from '../../Utils/PermissionHelper';
import { otherServices } from '../../services/otherServices';
import AppHeader from '../components/AppHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RefreshControl } from 'react-native';
import BRAND from '../config';
import EmptyState from '../components/EmptyState';

const BillsPage = () => {
  const { nightMode, permissions } = usePermissions();

  const permissionsLoaded =
    permissions !== null && permissions !== undefined;

  const canViewBills =
    permissionsLoaded && hasPermission(permissions, 'BILL', 'R');

  const theme = {
    light: {
      containerBg: '#F5F7FA',
      cardBg: '#FFFFFF',
      textColor: '#111827',
      secondaryText: '#6B7280',
      borderColor: '#E5E7EB',
      iconBg: BRAND.COLORS.iconbg,
      accent: '#1996D3',
      danger: '#DC3545',
    },
    dark: {
      containerBg: '#0F172A',
      cardBg: '#1E293B',
      textColor: '#F1F5F9',
      secondaryText: '#CBD5E1',
      borderColor: '#334155',
      iconBg: '#1E3A5F',
      accent: '#60A5FA',
      danger: '#F87171',
    },
  };

  const currentTheme = nightMode ? theme.dark : theme.light;

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  const fetchBills = async () => {
    try {
      const response = await otherServices.getBillsByFlat();

      if (Array.isArray(response)) {
        setBills(response);
      } else if (Array.isArray(response?.data)) {
        setBills(response.data);
      } else {
        setBills([]);
      }
    } catch (error) {
      console.log('Bills Fetch Error:', error);
      setBills([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!canViewBills) return;
    fetchBills();
  }, [canViewBills]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBills();
  }, []);

  const downloadBill = () => {
    if (selectedBill?.url) {
      Linking.openURL(selectedBill.url);
    }
    setMenuVisible(false);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const AmountItem = ({ label, value, theme }) => (
    <View style={styles.amountItem}>
      <Text style={[styles.label, { color: theme.secondaryText }]}>
        {label}
      </Text>
      <Text style={[styles.amount, { color: theme.textColor }]}>
        ₹{value.toLocaleString()}
      </Text>
    </View>
  );

  const renderItem = ({ item }) => {
    const current = parseFloat(item.amount || 0);
    const arrear = parseFloat(item.arears || 0);
    const tax = parseFloat(item.tax || 0);
    const balance = parseFloat(item.bal_amt || 0);

    return (
      <View style={[styles.card, { backgroundColor: currentTheme.cardBg }]}>
        <View style={styles.topRow}>
          <View style={styles.leftPart}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: currentTheme.iconBg },
              ]}
            >
              <Ionicons
                name="document-outline"
                size={20}
                color={BRAND.COLORS.icon}
              />
            </View>

            <View style={styles.billInfo}>
              <Text
                style={[
                  styles.billNo,
                  { color: currentTheme.textColor },
                ]}
              >
                {item.bill_no}
              </Text>

              <View style={styles.dateRow}>
                <Text
                  style={[
                    styles.date,
                    { color: currentTheme.secondaryText },
                  ]}
                >
                  {formatDate(item.bill_date)}
                </Text>

                <View
                  style={[
                    styles.dueBadge,
                    { backgroundColor: currentTheme.danger + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.dueBadgeText,
                      { color: currentTheme.danger },
                    ]}
                  >
                    Due: {formatDate(item.bill_due_date)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              setSelectedBill(item);
              setMenuVisible(true);
            }}
            style={styles.menuBtn}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={20}
              color={currentTheme.secondaryText}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.periodBalanceRow}>
          <Text
            style={[
              styles.periodText,
              { color: currentTheme.secondaryText },
            ]}
          >
            {formatDate(item.bill_start_date)} —{' '}
            {formatDate(item.bill_end_date)}
          </Text>

          <View style={styles.balanceInlineBox}>
            <Text
              style={[
                styles.balanceLabelInline,
                { color: currentTheme.secondaryText },
              ]}
            >
              Balance:
            </Text>

            <Text
              style={[
                styles.balanceValueInline,
                { color: BRAND.COLORS.icon },
              ]}
            >
              ₹{balance.toLocaleString()}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.divider,
            { backgroundColor: currentTheme.borderColor },
          ]}
        />

        <View style={styles.amountGrid}>
          <AmountItem
            label="Current"
            value={current}
            theme={currentTheme}
          />
          <AmountItem label="Tax" value={tax} theme={currentTheme} />
          <AmountItem
            label="Arrear"
            value={arrear}
            theme={currentTheme}
          />
        </View>
      </View>
    );
  };

  if (!permissionsLoaded) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: currentTheme.containerBg },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={currentTheme.accent}
        />
        <Text
          style={{
            marginTop: 10,
            color: currentTheme.secondaryText,
          }}
        >
          Loading...
        </Text>
      </View>
    );
  }

  if (!canViewBills) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: currentTheme.containerBg },
        ]}
      >
        <Ionicons
          name="lock-closed-outline"
          size={60}
          color={currentTheme.secondaryText}
        />
        <Text
          style={{
            marginTop: 12,
            fontSize: 16,
            color: currentTheme.textColor,
            fontWeight: '600',
          }}
        >
          Access Restricted
        </Text>

        <Text
          style={{
            marginTop: 6,
            fontSize: 13,
            color: currentTheme.secondaryText,
            textAlign: 'center',
            paddingHorizontal: 40,
          }}
        >
          You do not have permission to view bills.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: currentTheme.containerBg },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={currentTheme.accent}
        />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: currentTheme.containerBg },
      ]}
    >
      <AppHeader title="Bills" />

      <FlatList
        data={bills}
        keyExtractor={(item, index) =>
          item?.id ? item.id.toString() : index.toString()
        }
        renderItem={renderItem}
        contentContainerStyle={
          bills.length === 0
            ? {
              flexGrow: 1,
              paddingTop: 120,
              paddingHorizontal: 16
            }
            : styles.listContent
        }

        ListEmptyComponent={() => (
          <EmptyState
            icon="document-outline"
            title="No Bills Available"
            subtitle=""
            theme={{
              text: currentTheme.textColor,
              textSecondary: currentTheme.secondaryText
            }}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={currentTheme.accent}
            colors={[BRAND.COLORS.primary]}
          />
        }
      />

      <Modal
        transparent
        visible={menuVisible}
        animationType="none"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setMenuVisible(false)}
        >
          <View
            style={[
              styles.bottomSheet,
              { backgroundColor: currentTheme.cardBg },
            ]}
          >
            <View
              style={[
                styles.sheetHandle,
                { backgroundColor: currentTheme.borderColor },
              ]}
            />

            <Text
              style={[
                styles.sheetTitle,
                { color: currentTheme.textColor },
              ]}
            >
              {selectedBill?.bill_no || 'Bill Options'}
            </Text>

            <TouchableOpacity
              style={styles.sheetItem}
              onPress={downloadBill}
            >
              <View
                style={[
                  styles.sheetIcon,
                  { backgroundColor: BRAND.COLORS.iconbg },
                ]}
              >
                <Ionicons
                  name="download"
                  size={20}
                  color={BRAND.COLORS.icon}
                />
              </View>

              <View style={styles.sheetContent}>
                <Text
                  style={[
                    styles.sheetItemTitle,
                    { color: currentTheme.textColor },
                  ]}
                >
                  Download Bill
                </Text>

                <Text
                  style={[
                    styles.sheetItemSub,
                    { color: currentTheme.secondaryText },
                  ]}
                >
                  Save as PDF
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={currentTheme.secondaryText}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setMenuVisible(false)}
            >
              <Text
                style={[
                  styles.closeBtnText,
                  { color: currentTheme.secondaryText },
                ]}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default BillsPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },

  /* CARD */
  card: {
    marginBottom: 10,
    borderRadius: 12,
    padding: 12,
    elevation: 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    justifyContent: 'space-between',
  },

  leftPart: {
    flexDirection: 'row',
    flex: 1,
    gap: 8,
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },

  billInfo: {
    flex: 1,
  },

  billNo: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  date: {
    fontSize: 10,
  },

  dueBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },

  dueBadgeText: {
    fontSize: 9,
    fontWeight: '600',
  },

  menuBtn: {
    padding: 4,
    paddingHorizontal: 8,
  },

  /* PERIOD + BALANCE ROW */
  periodBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  periodText: {
    fontSize: 10,
    flex: 1,
  },

  /* BALANCE - Inline with amount */
  balanceInlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  balanceLabelInline: {
    fontSize: 9,
    fontWeight: '600',
  },

  balanceValueInline: {
    fontSize: 11,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    marginVertical: 8,
  },

  /* AMOUNTS GRID - 3 Items */
  amountGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },

  amountItem: {
    flex: 1,
    alignItems: 'center',
  },

  label: {
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },

  amount: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },

  bottomSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 24,
  },

  sheetHandle: {
    width: 36,
    height: 3,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },

  sheetTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 14,
    textAlign: 'center',
  },

  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },

  sheetIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  sheetContent: {
    flex: 1,
  },

  sheetItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },

  sheetItemSub: {
    fontSize: 11,
  },

  closeBtn: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },

  closeBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});