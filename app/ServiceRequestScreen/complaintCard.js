// ServiceRequestDetailCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import { usePermissions } from '../../Utils/ConetextApi';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

// ─── Theme configuration ──────────────────────────────────────────────────────
const COLORS = {
  primary:  '#1996D3',
  success:  '#28A745',
  warning:  '#FFC107',
  info:     '#0052CC',
  light: {
    background:    '#FFFFFF',
    surface:       '#ffffff',
    text:          '#212529',
    textSecondary: '#6C757D',
    border:        '#DEE2E6',
    description:   '#495057',
  },
  dark: {
    background:    '#1E1E1E',
    surface:       '#2A2A2A',
    text:          '#FFFFFF',
    textSecondary: '#9E9E9E',
    border:        '#2C2C2C',
    description:   '#CCCCCC',
  },
};

// ─── Status configuration ─────────────────────────────────────────────────────
const REQUEST_STATUS = {
  RESOLVED: {
    light: { bg: '#D4EDDA', color: COLORS.success },
    dark:  { bg: '#1A3D2E', color: COLORS.success },
    label: 'Resolved',
    icon:  'checkmark-circle',
  },
  PENDING: {
    light: { bg: '#FFF3CD', color: COLORS.warning },
    dark:  { bg: '#3D3A1A', color: COLORS.warning },
    label: 'Pending',
    icon:  'time-outline',
  },
  IN_PROGRESS: {
    light: { bg: '#CCE7FF', color: COLORS.primary },
    dark:  { bg: '#1A2D3D', color: COLORS.primary },
    label: 'In Progress',
    icon:  'sync',
  },
  UNKNOWN: {
    light: { bg: '#E9ECEF', color: COLORS.light.textSecondary },
    dark:  { bg: '#2A2A2A', color: COLORS.dark.textSecondary },
    label: 'Unknown',
    icon:  'help-circle-outline',
  },
};

// ─── Category icon configuration ──────────────────────────────────────────────
const CATEGORY_ICONS = {
  AC:          { name: 'snowflake',        library: 'FontAwesome5', color: COLORS.primary },
  ELECTRICAL:  { name: 'flash',            library: ' Ionicons',     color: '#FF8B00'       },
  PLUMBING:    { name: 'water',            library: ' Ionicons',     color: COLORS.info     },
  LIGHTING:    { name: 'bulb-outline',     library: ' Ionicons',     color: COLORS.warning  },
  MAINTENANCE: { name: 'construct',        library: ' Ionicons',     color: COLORS.success  },
  DEFAULT:     { name: 'build',            library: ' Ionicons',     color: '#6C757D'       },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getStatusConfig = (status, nightMode) => {
  const s = status?.toLowerCase() || '';

  let key = 'UNKNOWN';
  if (['resolved', 'closed', 'completed'].includes(s)) key = 'RESOLVED';
  else if (['open', 'pending'].includes(s))             key = 'PENDING';
  else if (s === 'in progress')                         key = 'IN_PROGRESS';

  const config     = REQUEST_STATUS[key];
  const themeStyle = nightMode ? config.dark : config.light;

  return {
    ...config,
    bg:    themeStyle.bg,
    color: themeStyle.color,
    // For UNKNOWN, use the original status string as the label
    label: key === 'UNKNOWN' && status ? status : config.label,
  };
};

const getCategoryIcon = (category, theme) => {
  const c = category?.toLowerCase() || '';
  if (c.includes('ac') || c.includes('air'))              return CATEGORY_ICONS.AC;
  if (c.includes('electrical') || c.includes('wiring'))   return CATEGORY_ICONS.ELECTRICAL;
  if (c.includes('plumbing') || c.includes('water'))      return CATEGORY_ICONS.PLUMBING;
  if (c.includes('light'))                                 return CATEGORY_ICONS.LIGHTING;
  if (c.includes('maintenance'))                           return CATEGORY_ICONS.MAINTENANCE;
  return { ...CATEGORY_ICONS.DEFAULT, color: theme.textSecondary };
};

const formatDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return dateString || '—';
  }
};


// ─── Icon renderer ────────────────────────────────────────────────────────────
const AppIcon = ({ name, library, color, size = 16 }) => {
  switch (library) {
    case 'FontAwesome5':
      return <FontAwesome5 name={name} size={size} color={color} />;
    case 'MaterialIcons':
      return <MaterialIcons name={name} size={size} color={color} />;
    case ' Ionicons':
    default:
      return < Ionicons name={name} size={size} color={color} />;
  }
};

// ─── Component ────────────────────────────────────────────────────────────────
const ServiceRequestDetailCard = ({ complaint, onPress  }) => {
  const { nightMode } = usePermissions();
  const theme        = nightMode ? COLORS.dark : COLORS.light;

  const statusConfig  = getStatusConfig(complaint?.status, nightMode);
  const categoryIcon  = getCategoryIcon(complaint?.sub_category, theme);
  const requestNumber = `#${complaint?.com_no ?? complaint?.id ?? '—'}`;

  return (
   <TouchableOpacity
  activeOpacity={0.8}
  onPress={onPress}
  style={[styles.card, { backgroundColor: theme.surface,}]}
>

      {/* ── Row 1: Request ID  +  Status badge ── */}
      <View style={styles.headerRow}>
        <Text style={[styles.idText, { color: COLORS.primary }]} numberOfLines={1}>
          {requestNumber}
        </Text>

        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
          < Ionicons
            name={statusConfig.icon}
            size={13}
            color={statusConfig.color}
            style={styles.statusIcon}
          />
          <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* ── Row 2: Category avatar  +  title / description ── */}
      <View style={styles.bodyRow}>
        {/* Avatar circle with category icon */}
        <View style={[styles.avatar, { backgroundColor: `${categoryIcon.color}18` }]}>
          <AppIcon
            name={categoryIcon.name}
            library={categoryIcon.library}
            color={categoryIcon.color}
            size={22}
          />
        </View>

        {/* Text block */}
        <View style={styles.textBlock}>
          <Text style={[styles.categoryText, { color: categoryIcon.color }]} numberOfLines={1}>
            {complaint?.sub_category || 'Service Request'}
          </Text>
          <Text style={[styles.descriptionText, { color: theme.description }]} numberOfLines={2}>
            {complaint?.description || 'No description provided.'}
          </Text>
        </View>
      </View>

      {/* ── Divider ── */}
      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      {/* ── Row 3: Created date  +  Updated date ── */}
      <View style={styles.footerRow}>
        {/* Created */}
        <View style={styles.dateItem}>
          <View style={styles.dateTexts}>
            <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>Created</Text>
            <Text style={[styles.dateValue, { color: theme.text }]}>
              {formatDate(complaint?.created_at)}
            </Text>
          </View>
        </View>

        {/* Separator */}
        <View style={[styles.verticalDivider, { backgroundColor: theme.border }]} />

        {/* Updated */}
        <View style={styles.dateItem}>
          <View style={styles.dateTexts}>
            <Text style={[styles.dateLabel, { color: theme.textSecondary }]}>Updated</Text>
            <Text style={[styles.dateValue, { color: theme.text }]}>
              {formatDate(complaint?.updated_at)}
            </Text>
          </View>
        </View>
      </View>

</TouchableOpacity>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 2,
    marginHorizontal: 16,
    borderWidth: 1,
     borderColor: 'rgba(3, 65, 109, 0.09)',
    overflow: 'hidden', // 👈 important

 
  },

  // ── Header row ──
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  idText: {
    fontSize: 15,
    fontWeight: '700',
    flexShrink: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Body row ──
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
    marginLeft: 12,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 19,
  },

  // ── Divider ──
 

  // ── Footer row ──
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dateItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  dateTexts: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 1,
  },
  timeAgo: {
    fontSize: 11,
  },
  verticalDivider: {
    width: 1,
    height: '100%',
    minHeight: 36,
    marginHorizontal: 12,
  },
});

export default ServiceRequestDetailCard;