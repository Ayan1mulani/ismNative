import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { usePermissions } from '../../Utils/ConetextApi';
import { otherServices } from '../../services/otherServices';
import AppHeader from '../components/AppHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hasPermission } from '../../Utils/PermissionHelper';
import BRAND from "../config";

const THEME = {
  primary: BRAND.COLORS.primary,
  primaryLight: '#E8F5FD',
  primaryDark: '#1279AD',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  lightBg: '#F0F4F8',
  darkBg: '#0F1117',
  lightCard: '#FFFFFF',
  darkCard: '#1A1D27',
  border: '#E5E7EB',
  darkBorder: '#2A2D3A',
};

export default function AccountsScreen() {
  const navigation = useNavigation();
  const { nightMode, permissions } = usePermissions();

  const theme = {
    bg: nightMode ? THEME.darkBg : THEME.lightBg,
    card: nightMode ? THEME.darkCard : THEME.lightCard,
    border: nightMode ? THEME.darkBorder : THEME.border,
    text: nightMode ? '#F1F5F9' : '#111827',
    sub: nightMode ? '#94A3B8' : '#6B7280',
    divider: nightMode ? '#2A2D3A' : '#F1F5F9',
    pillBg: nightMode ? '#1E2235' : THEME.primaryLight,
  };

  // STEP 1: Is context still loading? (null = loading, [] or [...] = loaded)
  const permissionsLoaded = permissions !== null && permissions !== undefined;

  // STEP 2: Only evaluate permissions once they are loaded
  const canSeeOutstanding = permissionsLoaded && hasPermission(permissions, 'OUTSND', 'READ');
  const canSeeBills = permissionsLoaded && hasPermission(permissions, 'BILL', 'READ');


  const [outstanding, setOutstanding] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  // STEP 3: Show spinner while permissions are still being fetched from API
  if (!permissionsLoaded) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <AppHeader title="Accounts" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={{ color: theme.sub, marginTop: 12, fontSize: 14 }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // STEP 4: Permissions loaded but user genuinely has no access to either section
  if (!canSeeOutstanding && !canSeeBills) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <AppHeader title="Accounts" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.center}>
          <Ionicons name="lock-closed-outline" size={64} color={theme.sub} />
          <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 16 }]}>Access Restricted</Text>
          <Text style={{ color: theme.sub, textAlign: 'center', paddingHorizontal: 40, marginTop: 8 }}>
            You do not have permission to view account details. Please contact your administrator.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

useEffect(() => {
  if (canSeeOutstanding || canSeeBills) {
    fetchData();
  }
}, [permissionsLoaded]);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const outstandingPromise = canSeeOutstanding
        ? otherServices.getOutStandings()
        : Promise.resolve([]);

      const accountsPromise = canSeeBills
        ? otherServices.getMyAccounts()
        : Promise.resolve([]);

      const [outstandingResp, accountsResp] = await Promise.all([
        outstandingPromise,
        accountsPromise,
      ]);

      const normalizeArray = (res) => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.result)) return res.result;
        if (Array.isArray(res.items)) return res.items;
        return [];
      };

      setOutstanding(normalizeArray(outstandingResp));
      setAccounts(normalizeArray(accountsResp));

    } catch (error) {
      Alert.alert('Error', 'Failed to load accounts');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount);
    return `₹${(isNaN(num) ? 0 : num).toLocaleString('en-IN')}`;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const openMenu = (bill) => {
    setSelectedBill(bill);
    setMenuVisible(true);
  };

  const downloadBill = async () => {
    if (selectedBill?.url) {
      const supported = await Linking.canOpenURL(selectedBill.url);
      if (supported) Linking.openURL(selectedBill.url);
      else Alert.alert("Error", "Invalid download link");
    } else {
      Alert.alert('Info', 'Download not available');
    }
    setMenuVisible(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={THEME.primary} />
        <Text style={{ color: theme.sub, marginTop: 12, fontSize: 14 }}>Loading accounts...</Text>
      </SafeAreaView>
    );
  }

  const totalOutstanding = Array.isArray(outstanding)
    ? outstanding.reduce((sum, item) => sum + parseFloat(item?.data?.balance || 0), 0)
    : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <AppHeader title="Accounts" nightMode={nightMode} showBack onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME.primary]} tintColor={THEME.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Only shown if user has OUTSND.READ permission */}
        {canSeeOutstanding && (
          <View style={[styles.summaryCard, { backgroundColor: THEME.primary }]}>
            <View style={styles.summaryInner}>
              <View>
                <Text style={styles.summaryLabel}>Total Outstanding</Text>
                <Text style={styles.summaryAmount}>{formatCurrency(totalOutstanding)}</Text>
                <Text style={styles.summaryNote}>
                  {outstanding.length} pending {outstanding.length === 1 ? 'item' : 'items'}
                </Text>
              </View>
              <View style={styles.summaryIcon}>
                <Ionicons name="wallet-outline" size={32} color="rgba(255,255,255,0.9)" />
              </View>
            </View>
          </View>
        )}

        {/* Only shown if user has OUTSND.READ permission */}
        {canSeeOutstanding && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Outstanding</Text>
              <View style={[styles.badge, { backgroundColor: theme.pillBg }]}>
                <Text style={[styles.badgeText, { color: THEME.primary }]}>{outstanding.length}</Text>
              </View>
            </View>

            {outstanding.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="checkmark-circle-outline" size={36} color={THEME.success} />
                <Text style={[styles.emptyText, { color: theme.sub }]}>No outstanding dues</Text>
              </View>
            ) : (
              outstanding.map((item, index) => (
                <View key={item.id ?? index} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={styles.accentBar} />
                  <View style={styles.outstandingContent}>
                    <View style={styles.outstandingTop}>
                      <View style={[styles.iconCircle, { backgroundColor: theme.pillBg }]}>
                        <Ionicons name="receipt-outline" size={18} color={THEME.primary} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>{item.name || 'Unknown'}</Text>
                        {item.message ? <Text style={[styles.cardSub, { color: theme.sub }]} numberOfLines={1}>{item.message}</Text> : null}
                      </View>
                    </View>
                    <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                    <View style={styles.outstandingBottom}>
                      <Text style={[styles.amountLabel, { color: theme.sub }]}>Balance Due</Text>
                      <Text style={[styles.outstandingAmount, { color: THEME.danger }]}>{formatCurrency(item.data?.balance)}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {/* Only shown if user has BILL.READ permission */}
        {canSeeBills && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Bill History</Text>
              <View style={[styles.badge, { backgroundColor: theme.pillBg }]}>
                <Text style={[styles.badgeText, { color: THEME.primary }]}>{accounts.length}</Text>
              </View>
            </View>

            {accounts.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="document-outline" size={36} color={theme.sub} />
                <Text style={[styles.emptyText, { color: theme.sub }]}>No bill history</Text>
              </View>
            ) : (
              accounts.map((item, index) => (
                <View key={item.id ?? item.statement_no ?? index} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={styles.billHeader}>
                    <View style={[styles.iconCircle, { backgroundColor: theme.pillBg }]}>
                      <Ionicons name="document-text-outline" size={18} color={THEME.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.cardTitle, { color: theme.text }]}>{item.statement_no || 'Statement'}</Text>
                      <Text style={[styles.cardSub, { color: theme.sub }]}>{formatDate(item.date)}</Text>
                    </View>
                    {canSeeBills && (
                      <TouchableOpacity style={[styles.moreBtn, { backgroundColor: theme.divider }]} onPress={() => openMenu(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="ellipsis-horizontal" size={16} color={theme.sub} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                  <View style={styles.billAmounts}>
                    <View style={styles.amountItem}><Text style={[styles.amountLabel, { color: theme.sub }]}>Current</Text><Text style={[styles.amountValue, { color: theme.text }]}>{formatCurrency(item.current)}</Text></View>
                    <View style={[styles.amountDivider, { backgroundColor: theme.border }]} />
                    <View style={styles.amountItem}><Text style={[styles.amountLabel, { color: theme.sub }]}>Arrear</Text><Text style={[styles.amountValue, { color: theme.text }]}>{formatCurrency(item.arrear)}</Text></View>
                    <View style={[styles.amountDivider, { backgroundColor: theme.border }]} />
                    <View style={styles.amountItem}><Text style={[styles.amountLabel, { color: theme.sub }]}>Balance</Text><Text style={[styles.amountValue, { color: THEME.primary, fontWeight: '700' }]}>{formatCurrency(item.balance)}</Text></View>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      <Modal transparent visible={menuVisible} animationType="none" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={[styles.bottomSheet, { backgroundColor: theme.card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
            <Text style={[styles.sheetTitle, { color: theme.text }]}>{selectedBill?.statement_no || 'Options'}</Text>
            {canSeeBills && (
              <TouchableOpacity style={[styles.sheetItem, { borderColor: theme.border }]} onPress={downloadBill}>
                <View style={[styles.sheetIconWrap, { backgroundColor: THEME.primaryLight }]}>
                  <Ionicons name="download-outline" size={20} color={THEME.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[styles.sheetItemTitle, { color: theme.text }]}>Download Bill</Text>
                  <Text style={[styles.sheetItemSub, { color: theme.sub }]}>Save as PDF to your device</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.sub} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: theme.divider }]} onPress={() => setMenuVisible(false)}>
              <Text style={[styles.cancelText, { color: theme.sub }]}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summaryCard: { borderRadius: 14, padding: 16, marginBottom: 16, elevation: 2 },
  summaryInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  summaryAmount: { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 2 },
  summaryNote: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  summaryIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '600' },
  badge: { borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  card: { borderRadius: 12, borderWidth: 1, marginBottom: 8, overflow: 'hidden' },
  accentBar: { width: 3, position: 'absolute', top: 0, left: 0, bottom: 0, backgroundColor: '#EF4444' },
  outstandingContent: { padding: 12, paddingLeft: 16 },
  outstandingTop: { flexDirection: 'row', alignItems: 'center' },
  outstandingBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  outstandingAmount: { fontSize: 16, fontWeight: '700' },
  billHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingBottom: 8 },
  billAmounts: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 12 },
  amountItem: { flex: 1, alignItems: 'center' },
  amountLabel: { fontSize: 10, marginBottom: 2, textTransform: 'uppercase' },
  amountValue: { fontSize: 13, fontWeight: '600' },
  amountDivider: { width: 1, marginHorizontal: 4, alignSelf: 'stretch' },
  iconCircle: { width: 34, height: 34, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 13, fontWeight: '600' },
  cardSub: { fontSize: 11, marginTop: 2 },
  divider: { height: 1, marginVertical: 8, marginHorizontal: -12 },
  moreBtn: { width: 28, height: 28, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  emptyCard: { borderRadius: 12, borderWidth: 1, padding: 20, alignItems: 'center', marginBottom: 8 },
  emptyText: { fontSize: 13, fontWeight: '500', marginTop: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  bottomSheet: { borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, paddingBottom: 24 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  sheetTitle: { fontSize: 12, fontWeight: '600', marginBottom: 12, opacity: 0.6 },
  sheetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1 },
  sheetIconWrap: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  sheetItemTitle: { fontSize: 14, fontWeight: '600' },
  sheetItemSub: { fontSize: 11, marginTop: 2 },
  cancelBtn: { marginTop: 12, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600' },
});