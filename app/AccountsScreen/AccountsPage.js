import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
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
import BRAND from '../config';
import useAlert from '../components/UseAlert';

const THEME = {
  primary: BRAND.COLORS.primary,
  primaryLight: '#E8F5FD',
  success: '#10B981',
  danger: '#EF4444',
  lightBg: '#F0F4F8',
  darkBg: '#0F1117',
  lightCard: '#FFFFFF',
  darkCard: '#1A1D27',
  border: '#E5E7EB',
  darkBorder: '#2A2D3A',
};

const NAV_OPTIONS = [
  { key: 'Payments',    icon: 'card-outline',           screen: 'Payment'    },
  { key: 'Bills',       icon: 'document-text-outline',  screen: 'bills'       },
  // { key: 'Debit',       icon: 'trending-down-outline',  screen: 'Debit'       },
  // { key: 'Credit Note', icon: 'trending-up-outline',    screen: 'CreditNote'  },
];

export default function AccountsScreen() {
  const navigation = useNavigation();
  const { nightMode, permissions } = usePermissions();

  const theme = {
    bg:            nightMode ? THEME.darkBg    : THEME.lightBg,
    card:          nightMode ? THEME.darkCard  : THEME.lightCard,
    border:        nightMode ? THEME.darkBorder : THEME.border,
    text:          nightMode ? '#F1F5F9'       : '#111827',
    sub:           nightMode ? '#94A3B8'       : '#6B7280',
    divider:       nightMode ? '#2A2D3A'       : '#F1F5F9',
    pillBg:        nightMode ? '#1E2235'       : THEME.primaryLight,
    downloadBtn:   nightMode ? '#1E3A5F'       : '#EFF6FF',
    downloadText:  nightMode ? '#60A5FA'       : THEME.primary,
    iconBg:        BRAND.COLORS.iconbg,
    secondaryText: nightMode ? '#CBD5E1'       : '#6B7280',
    borderColor:   nightMode ? '#334155'       : '#E5E7EB',
    navCard:       nightMode ? '#1E293B'       : '#FFFFFF',
  };

  const permissionsLoaded   = permissions !== null && permissions !== undefined;
  const canSeeOutstanding   = permissionsLoaded && hasPermission(permissions, 'OUTSND', 'R');
  const canSeeBills         = permissionsLoaded && hasPermission(permissions, 'BILL',   'R');

  const [outstanding,     setOutstanding]     = useState([]);
  const [accounts,        setAccounts]        = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [refreshing,      setRefreshing]      = useState(false);
  const [navModalVisible, setNavModalVisible] = useState(false);

  const { showAlert, AlertComponent } = useAlert(nightMode);

  // ─── Three-dot button ── passed directly as rightIcon prop ────────────────
  const ThreeDotsButton = (
    <TouchableOpacity
      onPress={() => setNavModalVisible(true)}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Ionicons
        name="ellipsis-vertical"
        size={20}
        color={nightMode ? '#94A3B8' : '#6B7280'}
      />
    </TouchableOpacity>
  );

  // ─── Guards ────────────────────────────────────────────────────────────────

  if (!permissionsLoaded) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <AppHeader
          title="Accounts"
          nightMode={nightMode}
          showBack
          rightIcon={ThreeDotsButton}
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={{ color: theme.sub, marginTop: 12, fontSize: 14 }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!canSeeOutstanding && !canSeeBills) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <AppHeader
          title="Accounts"
          nightMode={nightMode}
          showBack
          rightIcon={ThreeDotsButton}
        />
        <View style={styles.center}>
          <Ionicons name="lock-closed-outline" size={64} color={theme.sub} />
          <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 16 }]}>
            Access Restricted
          </Text>
          <Text style={{ color: theme.sub, textAlign: 'center', paddingHorizontal: 40, marginTop: 8 }}>
            You do not have permission to view account details.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Data ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (canSeeOutstanding || canSeeBills) fetchData();
  }, [permissionsLoaded]);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [outstandingResp, accountsResp] = await Promise.all([
        canSeeOutstanding ? otherServices.getOutStandings()  : Promise.resolve([]),
        canSeeBills       ? otherServices.getMyAccounts()    : Promise.resolve([]),
      ]);
      const norm = (res) => {
        if (!res)                     return [];
        if (Array.isArray(res))       return res;
        if (Array.isArray(res.data))  return res.data;
        if (Array.isArray(res.result))return res.result;
        if (Array.isArray(res.items)) return res.items;
        return [];
      };
      setOutstanding(norm(outstandingResp));
      setAccounts(norm(accountsResp));
    } catch {
      // silently fail
    } finally {
      if (!silent) setLoading(false);
    }
  };


  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const formatCurrency = (amount) => {
    const num = parseFloat(amount);
    return `₹${(isNaN(num) ? 0 : num).toLocaleString('en-IN')}`;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const handleDownload = (bill) => {
    showAlert({
      title: 'Download Bill',
      message: `Do you want to download bill ${bill.bill_no || bill.statement_no}?`,
      buttons: [
        { text: 'Cancel' },
        {
          text: 'Download',
          onPress: async () => {
            if (bill?.url) {
              const ok = await Linking.canOpenURL(bill.url);
              if (ok) Linking.openURL(bill.url);
            }
          },
        },
      ],
    });
  };

  // ─── Sub-components ────────────────────────────────────────────────────────

  /** Flat outstanding row — name left, amount right, no card chrome */
  const OutstandingRow = ({ item, isLast }) => (
    <View
      style={[
        styles.outRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: theme.borderColor },
      ]}
    >
      <Text style={[styles.outName, { color: theme.text }]} numberOfLines={1}>
        {item.name || 'Unknown'}
      </Text>
      <Text style={[styles.outAmount, { color: THEME.danger }]}>
        {formatCurrency(item.data?.balance)}
      </Text>
    </View>
  );

  /** Bill card — identical design to standalone BillsPage cards */
  const BillCard = ({ item }) => {
    const current = parseFloat(item.amount  ?? item.current ?? 0);
    const arrear  = parseFloat(item.arears  ?? item.arrear  ?? 0);
    const tax     = parseFloat(item.tax     ?? 0);
    const balance = parseFloat(item.bal_amt ?? item.balance ?? 0);

    return (
      <View style={[styles.billCard, { backgroundColor: theme.card }]}>
        {/* TOP ROW */}
        <View style={styles.billTopRow}>
          <View style={styles.billLeft}>
            <View style={[styles.billIconBox, { backgroundColor: theme.iconBg }]}>
              <Ionicons name="document-outline" size={20} color={BRAND.COLORS.icon} />
            </View>
            <View style={styles.billInfo}>
              <Text style={[styles.billNo, { color: theme.text }]}>
                {item.bill_no || item.statement_no || 'Statement'}
              </Text>
              <View style={styles.billDateRow}>
                <Text style={[styles.billDate, { color: theme.secondaryText }]}>
                  {formatDate(item.bill_date ?? item.date)}
                </Text>
                {item.bill_due_date ? (
                  <View style={[styles.dueBadge, { backgroundColor: THEME.danger + '20' }]}>
                    <Text style={[styles.dueBadgeText, { color: THEME.danger }]}>
                      Due: {formatDate(item.bill_due_date)}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* Direct download button */}
          <TouchableOpacity
            onPress={() => handleDownload(item)}
            style={[styles.downloadBtn, { backgroundColor: theme.downloadBtn }]}
            activeOpacity={0.7}
          >
            <Ionicons name="download-outline" size={14} color={theme.downloadText} />
            <Text style={[styles.downloadBtnText, { color: theme.downloadText }]}>Download</Text>
          </TouchableOpacity>
        </View>

        {/* PERIOD + BALANCE */}
        <View style={styles.periodBalanceRow}>
          <Text style={[styles.periodText, { color: theme.secondaryText }]}>
            {formatDate(item.bill_start_date ?? item.start_date ?? item.from_date ?? item.date)}
          </Text>
          <View style={styles.balanceInlineBox}>
            <Text style={[styles.balanceLabelInline, { color: theme.secondaryText }]}>Balance:</Text>
            <Text style={[styles.balanceValueInline, { color: BRAND.COLORS.icon }]}>
              {formatCurrency(balance)}
            </Text>
          </View>
        </View>

        <View style={[styles.billDivider, { backgroundColor: theme.borderColor }]} />

        {/* AMOUNT GRID */}
        <View style={styles.amountGrid}>
          {[
            { label: 'Current', val: current },
            { label: 'Tax',     val: tax     },
            { label: 'Arrear',  val: arrear  },
          ].map(({ label, val }) => (
            <View key={label} style={styles.amountItem}>
              <Text style={[styles.amountLabel, { color: theme.secondaryText }]}>{label}</Text>
              <Text style={[styles.amountValue, { color: theme.text }]}>{formatCurrency(val)}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // ─── Loading state ─────────────────────────────────────────────────────────

  const totalOutstanding = outstanding.reduce(
    (sum, item) => sum + parseFloat(item?.data?.balance || 0), 0,
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={THEME.primary} />
        <Text style={{ color: theme.sub, marginTop: 12, fontSize: 14 }}>Loading accounts...</Text>
      </SafeAreaView>
    );
  }

  // ─── Main render ───────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>

      {/* AppHeader — three-dot passed via rightIcon */}
      <AppHeader
        title="Accounts"
        nightMode={nightMode}
        showBack
        rightIcon={ThreeDotsButton}
      />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[THEME.primary]}
            tintColor={THEME.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Total Outstanding Banner ──────────────────────────────── */}
        {canSeeOutstanding && (
          <View style={[styles.summaryCard, { backgroundColor: THEME.primary }]}>
            <View style={styles.summaryInner}>
              <View>
                <Text style={styles.summaryLabel}>Total Outstanding</Text>
                <Text style={styles.summaryAmount}>{formatCurrency(totalOutstanding)}</Text>
                <Text style={styles.summaryNote}>
                  {outstanding.length} pending{' '}
                  {outstanding.length === 1 ? 'item' : 'items'}
                </Text>
              </View>
              <View style={styles.summaryIcon}>
                <Ionicons name="wallet-outline" size={32} color="rgba(255,255,255,0.9)" />
              </View>
            </View>
          </View>
        )}

        {/* ── Outstanding — flat rows ───────────────────────────────── */}
        {canSeeOutstanding && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Outstanding</Text>
              <View style={[styles.badge, { backgroundColor: theme.pillBg }]}>
                <Text style={[styles.badgeText, { color: THEME.primary }]}>
                  {outstanding.length}
                </Text>
              </View>
            </View>

            {outstanding.length === 0 ? (
              <View style={styles.emptyRow}>
                <Ionicons name="checkmark-circle-outline" size={18} color={THEME.success} />
                <Text style={[styles.emptyText, { color: theme.sub }]}>No outstanding dues</Text>
              </View>
            ) : (
              <View style={[styles.outstandingBlock, {
                backgroundColor: theme.card,
                borderColor:     theme.borderColor,
              }]}>
                {outstanding.map((item, index) => (
                  <OutstandingRow
                    key={item.id ?? index}
                    item={item}
                    isLast={index === outstanding.length - 1}
                  />
                ))}
              </View>
            )}
          </>
        )}

        {/* ── Bill History ──────────────────────────────────────────── */}
        {canSeeBills && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 16 }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Bill History</Text>
              <View style={[styles.badge, { backgroundColor: theme.pillBg }]}>
                <Text style={[styles.badgeText, { color: THEME.primary }]}>
                  {accounts.length}
                </Text>
              </View>
            </View>

            {accounts.length === 0 ? (
              <View style={styles.emptyRow}>
                <Ionicons name="document-outline" size={18} color={theme.sub} />
                <Text style={[styles.emptyText, { color: theme.sub }]}>No bill history</Text>
              </View>
            ) : (
              accounts.map((item, index) => (
                <BillCard key={item.id ?? item.statement_no ?? index} item={item} />
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* ── PAY FAB ──────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: THEME.primary }]}
        onPress={() => navigation.navigate('BillPaymentScreen')}
        activeOpacity={0.85}
      >
        <Ionicons name="card-outline" size={20} color="#fff" />
        <Text style={styles.fabLabel}>Pay</Text>
      </TouchableOpacity>

      {/* ── Nav dropdown (from three-dot) ────────────────────────────── */}
      <Modal
        transparent
        visible={navModalVisible}
        animationType="fade"
        onRequestClose={() => setNavModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.navOverlay}
          activeOpacity={1}
          onPress={() => setNavModalVisible(false)}
        >
          <View style={[styles.navDropdown, {
            backgroundColor: theme.navCard,
            borderColor:     theme.borderColor,
          }]}>
            {NAV_OPTIONS.map((opt, idx) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.navOption,
                  idx < NAV_OPTIONS.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.borderColor,
                  },
                ]}
                onPress={() => {
                  setNavModalVisible(false);
                  navigation.navigate(opt.screen);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.navOptionIcon, { backgroundColor: theme.pillBg }]}>
                  <Ionicons name={opt.icon} size={16} color={THEME.primary} />
                </View>
                <Text style={[styles.navOptionText, { color: theme.text }]}>{opt.key}</Text>
                <Ionicons name="chevron-forward" size={14} color={theme.sub} />
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <AlertComponent />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* Summary banner */
  summaryCard:  { borderRadius: 14, padding: 16, marginBottom: 16, elevation: 2 },
  summaryInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  summaryAmount:{ fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 2 },
  summaryNote:  { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  summaryIcon:  {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },

  /* Section header */
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sectionTitle:  { fontSize: 14, fontWeight: '600' },
  badge:         { borderRadius: 12, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6 },
  badgeText:     { fontSize: 11, fontWeight: '600' },

  /* Empty */
  emptyRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10 },
  emptyText: { fontSize: 13, fontWeight: '500' },

  /* Outstanding flat rows */
  outstandingBlock: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  outRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14,
  },
  outName:   { fontSize: 13, fontWeight: '500', flex: 1, marginRight: 12 },
  outAmount: { fontSize: 13, fontWeight: '700' },

  /* Bill card (BillsPage style) */
  billCard: {
    marginBottom: 10, borderRadius: 12, padding: 12,
    elevation: 0.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3,
  },
  billTopRow:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, justifyContent: 'space-between' },
  billLeft:      { flexDirection: 'row', flex: 1, gap: 8 },
  billIconBox:   { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  billInfo:      { flex: 1 },
  billNo:        { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  billDateRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  billDate:      { fontSize: 10 },
  dueBadge:      { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  dueBadgeText:  { fontSize: 9, fontWeight: '600' },
  downloadBtn:   {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    marginLeft: 8, alignSelf: 'flex-start',
  },
  downloadBtnText:    { fontSize: 11, fontWeight: '600' },
  periodBalanceRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  periodText:         { fontSize: 10, flex: 1 },
  balanceInlineBox:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  balanceLabelInline: { fontSize: 9, fontWeight: '600' },
  balanceValueInline: { fontSize: 11, fontWeight: '700' },
  billDivider:        { height: 1, marginVertical: 8 },
  amountGrid:         { flexDirection: 'row', justifyContent: 'space-around' },
  amountItem:         { flex: 1, alignItems: 'center' },
  amountLabel:        { fontSize: 9, fontWeight: '600', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.2 },
  amountValue:        { fontSize: 12, fontWeight: '600' },

  /* PAY FAB */
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 22,
    borderRadius: 50, gap: 8,
    elevation: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 6,
  },
  fabLabel: { fontSize: 15, fontWeight: '700', color: '#fff' },

  /* Three-dot nav dropdown */
  navOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)' },
  navDropdown: {
    position: 'absolute', top: 56, right: 12,
    minWidth: 190, borderRadius: 12, borderWidth: 1,
    overflow: 'hidden', elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14, shadowRadius: 8,
  },
  navOption: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14, gap: 10,
  },
  navOptionIcon: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  navOptionText: { flex: 1, fontSize: 13, fontWeight: '600' },
});