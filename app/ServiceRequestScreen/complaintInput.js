// ComplaintInputScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, Alert,
  Image, Modal, Dimensions, Platform
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { usePermissions } from '../../Utils/ConetextApi';
import CalendarSelector from '../VisitorsScreen/components/Calender';
import { complaintService } from '../../services/complaintService';
import BRAND from '../config';

const { width } = Dimensions.get('window');
const PRIMARY = BRAND.COLORS.primary;

const LOCATIONS = [
  { id: 1, name: 'Lobby Area' },    { id: 2, name: 'Parking Area' },
  { id: 3, name: 'Garden Area' },   { id: 4, name: 'Swimming Pool' },
  { id: 5, name: 'Gym Area' },      { id: 6, name: 'Terrace' },
  { id: 7, name: 'Basement' },      { id: 8, name: 'Common Bathroom' },
  { id: 9, name: 'Elevator' },      { id: 10, name: 'Staircase' },
];

// ─── Safe date formatter ──────────────────────────────────────────────────────
const formatDate = (raw) => {
  if (!raw) return null;
  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  try {
    const d = raw instanceof Date ? raw : new Date(raw);
    if (isNaN(d.getTime())) { console.warn('[formatDate] unparseable:', raw); return null; }
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch (e) { console.warn('[formatDate] error:', e); return null; }
};

// ─── Time Picker Modal (Cross-Platform Fix) ───────────────────────────────────
const TimePicker = ({ visible, onClose, fromTime, toTime, onFromChange, onToChange, nightMode }) => {
  const [picking, setPicking] = useState('from'); // 'from' | 'to'
  const [tempFrom, setTempFrom] = useState(null);
  const [tempTo, setTempTo] = useState(null);
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);

  // Sync props to temp state when opening
  useEffect(() => {
    if (visible) {
      setTempFrom(fromTime || new Date());
      setTempTo(toTime || new Date());
      setPicking('from');
      setShowAndroidPicker(false);
    }
  }, [visible]);

  const t = nightMode
    ? { bg: '#18181F', text: '#F1F5F9', sub: '#64748B', border: '#22222E', row: '#22222E', btn: '#2C2C35' }
    : { bg: '#FFFFFF', text: '#111827', sub: '#6B7280', border: '#E5E7EB', row: '#ffffff', btn: '#F3F4F6' };

  const fmt = (d) => d
    ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '-- : --';

  // Apply changes
  const handleDone = () => {
    if (tempFrom) onFromChange(tempFrom);
    if (tempTo)   onToChange(tempTo);
    onClose();
  };

  // Android specific change handler
  const onAndroidChange = (event, date) => {
    setShowAndroidPicker(false);
    if (event.type === 'set' && date) {
      if (picking === 'from') setTempFrom(date);
      else setTempTo(date);
    }
  };

  const activeTime = picking === 'from' ? (tempFrom || new Date()) : (tempTo || new Date());

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={tp.overlay}>
        <TouchableOpacity style={tp.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[tp.sheet, { backgroundColor: t.bg }]}>
          <View style={[tp.handle, { backgroundColor: t.border }]} />
          <Text style={[tp.title, { color: t.text }]}>Select Time Range</Text>

          {/* TABS: From / To */}
          <View style={tp.row}>
            <TouchableOpacity
              style={[tp.timeBtn, { backgroundColor: t.row, borderColor: picking === 'from' ? PRIMARY : t.border }]}
              onPress={() => setPicking('from')}
            >
              <Ionicons name="time-outline" size={16} color={PRIMARY} />
              <View style={{ marginLeft: 8 }}>
                <Text style={[tp.label, { color: t.sub }]}>FROM</Text>
                <Text style={[tp.time, { color: t.text }]}>{fmt(tempFrom)}</Text>
              </View>
            </TouchableOpacity>

            <Ionicons name="arrow-forward" size={16} color={t.sub} style={{ alignSelf: 'center' }} />

            <TouchableOpacity
              style={[tp.timeBtn, { backgroundColor: t.row, borderColor: picking === 'to' ? PRIMARY : t.border }]}
              onPress={() => setPicking('to')}
            >
              <Ionicons name="time-outline" size={16} color={PRIMARY} />
              <View style={{ marginLeft: 8 }}>
                <Text style={[tp.label, { color: t.sub }]}>TO</Text>
                <Text style={[tp.time, { color: t.text }]}>{fmt(tempTo)}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* PICKER AREA */}
          <View style={tp.pickerContainer}>
            {Platform.OS === 'ios' ? (
              /* iOS: Inline Spinner */
              <DateTimePicker
                value={activeTime}
                mode="time"
                display="spinner"
                onChange={(_, date) => {
                  if (date) {
                    if (picking === 'from') setTempFrom(date);
                    else setTempTo(date);
                  }
                }}
                style={{ height: 140 }}
                textColor={t.text}
              />
            ) : (
              /* Android: Clickable Button -> Dialog */
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 10 }}>
                <Text style={{ color: t.sub, fontSize: 12, marginBottom: 8 }}>
                  Editing {picking.toUpperCase()} time
                </Text>
                <TouchableOpacity
                  style={[tp.androidBtn, { backgroundColor: t.btn, borderColor: t.border }]}
                  onPress={() => setShowAndroidPicker(true)}
                >
                  <Text style={[tp.androidTime, { color: PRIMARY }]}>{fmt(activeTime)}</Text>
                  <Text style={{ fontSize: 10, color: t.sub }}>Tap to change</Text>
                </TouchableOpacity>

                {showAndroidPicker && (
                  <DateTimePicker
                    value={activeTime}
                    mode="time"
                    display="default"
                    is24Hour={false}
                    onChange={onAndroidChange}
                  />
                )}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[tp.doneBtn, { backgroundColor: PRIMARY }]}
            onPress={handleDone}
          >
            <Text style={tp.doneTxt}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const tp = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:    { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 36 },
  handle:   { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title:    { fontSize: 16, fontWeight: '700', marginBottom: 18 },
  row:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  timeBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, padding: 12 },
  label:    { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  time:     { fontSize: 18, fontWeight: '700', marginTop: 2 },
  doneBtn:  { marginTop: 12, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  doneTxt:  { color: '#fff', fontSize: 14, fontWeight: '700' },
  pickerContainer: { height: 150, justifyContent: 'center' },
  androidBtn: {
    paddingHorizontal: 30, paddingVertical: 15, borderRadius: 12,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    minWidth: 180
  },
  androidTime: { fontSize: 26, fontWeight: '700', marginBottom: 4 },
});

// ─── Location Modal ────────────────────────────────────────────────────────────
const LocationModal = ({ visible, onClose, selected, onSelect, nightMode }) => {
  const t = nightMode
    ? { bg: '#18181F', text: '#F1F5F9', sub: '#64748B', border: '#22222E', row: '#22222E' }
    : { bg: '#FFFFFF', text: '#111827', sub: '#6B7280', border: '#E5E7EB', row: '#F8FAFC' };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={lm.overlay}>
        <TouchableOpacity style={lm.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[lm.sheet, { backgroundColor: t.bg }]}>
          <View style={[lm.handle, { backgroundColor: t.border }]} />
          <Text style={[lm.title, { color: t.text }]}>Select Location</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {LOCATIONS.map(loc => {
              const active = selected?.id === loc.id;
              return (
                <TouchableOpacity
                  key={loc.id}
                  style={[lm.item, { borderBottomColor: t.border, backgroundColor: active ? `${PRIMARY}10` : 'transparent' }]}
                  onPress={() => { onSelect(loc); onClose(); }}
                >
                  <Ionicons name="location-outline" size={16} color={active ? PRIMARY : t.sub} />
                  <Text style={[lm.itemTxt, { color: active ? PRIMARY : t.text }]}>{loc.name}</Text>
                  {active && <Ionicons name="checkmark" size={16} color={PRIMARY} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const lm = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:    { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 36, maxHeight: '70%' },
  handle:   { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title:    { fontSize: 16, fontWeight: '700', marginBottom: 14 },
  item:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, borderBottomWidth: 1 },
  itemTxt:  { flex: 1, fontSize: 14, fontWeight: '500' },
});

// ─── Section wrapper ──────────────────────────────────────────────────────────
const Section = ({ label, children, t }) => (
  <View style={[s.section, { backgroundColor: t.surface, borderColor: t.border }]}>
    <Text style={[s.secLabel, { color: t.sub }]}>{label.toUpperCase()}</Text>
    {children}
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ComplaintInputScreen = ({ navigation, route }) => {
  const { nightMode } = usePermissions();
  const { category, subCategory } = route.params || {};

  const t = nightMode ? {
    bg: '#0F0F14', surface: '#18181F', border: '#22222E',
    text: '#F1F5F9', sub: '#64748B', input: '#1E1E2A',
  } : {
    bg: '#ffffff', surface: '#FFFFFF', border: '#E5E7EB',
    text: '#111827', sub: '#6B7280', input: '#F8FAFC',
  };

  const [config,         setConfig]         = useState(null);
  const [isASAP,         setIsASAP]         = useState(true);
  const [selectedDate,   setSelectedDate]   = useState(null);
  const [fromTime,       setFromTime]       = useState(null);
  const [toTime,         setToTime]         = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location,       setLocation]       = useState(null);
  const [showLocModal,   setShowLocModal]   = useState(false);
  const [remarks,        setRemarks]        = useState('');
  const [images,         setImages]         = useState([]);
  const [submitting,     setSubmitting]     = useState(false);

  useEffect(() => { loadConfig(); }, []);

  const loadConfig = async () => {
    try {
      const res = await complaintService.getSocietyConfig();
      if (res?.status === 'success') setConfig(res.data);
    } catch (error) {
      console.log('Config Error:', error);
    }
  };

  const fmtTime = (d) => d
    ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null;

  const timeLabel = fromTime && toTime
    ? `${fmtTime(fromTime)}  →  ${fmtTime(toTime)}`
    : fromTime
    ? `From ${fmtTime(fromTime)}`
    : 'Select time range';

  const pickImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 5, quality: 0.8 });
    if (!result.didCancel && result.assets) {
      setImages(prev => [...prev, ...result.assets].slice(0, 5));
    }
  };

  const handleSubmit = async () => {
    if (!location) { Alert.alert('Required', 'Please select a location.'); return; }
    if (!remarks.trim()) { Alert.alert('Required', 'Please describe the issue.'); return; }

    if (!isASAP) {
      if (!selectedDate) { Alert.alert('Required', 'Please select a date.'); return; }
      if (!fromTime || !toTime) { Alert.alert('Required', 'Please select both start and end time.'); return; }

      const fromMins = fromTime.getHours() * 60 + fromTime.getMinutes();
      const toMins   = toTime.getHours()   * 60 + toTime.getMinutes();
      if (fromMins >= toMins) { Alert.alert('Invalid Time', 'End time must be after start time.'); return; }
    }

    if (isASAP && config?.complaint_lock_time) {
      const current = new Date().toTimeString().slice(0, 5);
      const from    = config.complaint_lock_time.from;
      const to      = config.complaint_lock_time.to;
      if (current < from || current > to) {
        Alert.alert('Complaints Closed', `Complaints allowed only between ${from} and ${to}`);
        return;
      }
    }

    const probableDate = !isASAP ? formatDate(selectedDate) : null;
    const probableTime = !isASAP && fromTime && toTime
      ? `${fmtTime(fromTime)} to ${fmtTime(toTime)}`
      : null;

    if (!isASAP && !probableDate) {
      Alert.alert('Invalid Date', 'Could not read the selected date. Please try again.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await complaintService.addComplaint({
        sub_category:        subCategory?.name,
        complaint_type:      category?.id,
        description:         `${subCategory?.name} : ${remarks}`,
        severity:            'normal',
        sub_category_id:     subCategory?.id,
        probable_date:       probableDate,
        probable_time:       probableTime,
        constant_society_id: 4710,
        location_id:         location?.id,
      });

      if (res?.status === 'success') {
        Alert.alert(
          'Success',
          `Complaint No: ${res.data.com_no}`,
          [{
            text: 'OK',
            onPress: () => navigation.navigate('MainApp', {
              screen: 'Service Requests',
              params: { screen: 'ServiceRequestsMain' },
            }),
          }]
        );
      } else {
        Alert.alert('Error', res?.message || 'Failed to submit complaint.');
      }

    } catch (error) {
      console.log('Submit Error:', error);
      Alert.alert('Error', error?.message || error?.response?.data?.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: t.bg }]} edges={['top']}>
      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[s.backBtn, { backgroundColor: t.surface, borderColor: t.border }]}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={t.text} />
        </TouchableOpacity>
        <View>
          <Text style={[s.title, { color: t.text }]}>Submit Complaint</Text>
          <Text style={[s.subtitle, { color: t.sub }]}>Fill in the details below</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Selected issue ── */}
        <Section label="Selected Issue" t={t}>
          <View style={s.issueRow}>
            <View style={[s.issueIcon, { backgroundColor: `${PRIMARY}15` }]}>
              <MaterialIcons name="build" size={20} color={PRIMARY} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.issueCat, { color: t.text }]}>{category?.name || 'Unknown Category'}</Text>
              <Text style={[s.issueSub, { color: t.sub }]}>{subCategory?.name || 'Unknown Subcategory'}</Text>
            </View>
          </View>
        </Section>

        {/* ── Priority ── */}
        <Section label="Priority" t={t}>
          <View style={s.priorityRow}>
            {[
              { val: true,  label: 'ASAP',     icon: 'flash-outline'    },
              { val: false, label: 'Schedule',  icon: 'calendar-outline' },
            ].map(opt => (
              <TouchableOpacity
                key={String(opt.val)}
                style={[s.priorityBtn, {
                  borderColor:     isASAP === opt.val ? PRIMARY : t.border,
                  backgroundColor: isASAP === opt.val ? `${PRIMARY}12` : t.input,
                }]}
                onPress={() => setIsASAP(opt.val)}
                activeOpacity={0.75}
              >
                <Ionicons name={opt.icon} size={16} color={isASAP === opt.val ? PRIMARY : t.sub} />
                <Text style={[s.priorityTxt, { color: isASAP === opt.val ? PRIMARY : t.text }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {!isASAP && (
            <View style={s.scheduleRow}>
              <View style={{ flex: 1 }}>
                <CalendarSelector
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  label="Date"
                  required
                  nightMode={nightMode}
                />
              </View>

              <TouchableOpacity
                style={[s.timeBtn, { borderColor: t.border, backgroundColor: t.input }]}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.8}
              >
                <Text style={[s.timeBtnLabel, { color: t.sub }]}>TIME</Text>
                <View style={s.timeValueRow}>
                  <Ionicons name="time-outline" size={14} color={PRIMARY} />
                  <Text style={[s.timeBtnValue, { color: fromTime ? t.text : t.sub }]} numberOfLines={1}>
                    {timeLabel}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </Section>

        {/* ── Location ── */}
        <Section label="Location *" t={t}>
          <TouchableOpacity
            style={[s.picker, { backgroundColor: t.input, borderColor: t.border }]}
            onPress={() => setShowLocModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="location-outline" size={16} color={PRIMARY} />
            <Text style={[s.pickerTxt, { color: location ? t.text : t.sub }]}>
              {location?.name || 'Select a location'}
            </Text>
            <Ionicons name="chevron-down" size={15} color={t.sub} />
          </TouchableOpacity>
        </Section>

        {/* ── Remarks ── */}
        <Section label="Remarks *" t={t}>
          <TextInput
            style={[s.textarea, { backgroundColor: t.input, borderColor: t.border, color: t.text }]}
            placeholder="Describe the issue in detail…"
            placeholderTextColor={t.sub}
            multiline
            numberOfLines={4}
            value={remarks}
            onChangeText={setRemarks}
            textAlignVertical="top"
          />
        </Section>

        {/* ── Submit ── */}
        <TouchableOpacity
          style={[s.submitBtn, { backgroundColor: PRIMARY, opacity: submitting ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting
            ? <Text style={s.submitTxt}>Submitting…</Text>
            : <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={s.submitTxt}>Submit Complaint</Text>
              </>
          }
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Modals */}
      <TimePicker
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        fromTime={fromTime}
        toTime={toTime}
        onFromChange={setFromTime}
        onToChange={setToTime}
        nightMode={nightMode}
      />
      <LocationModal
        visible={showLocModal}
        onClose={() => setShowLocModal(false)}
        selected={location}
        onSelect={setLocation}
        nightMode={nightMode}
      />
    </SafeAreaView>
  );
};

export default ComplaintInputScreen;

const s = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 17, paddingVertical: 20, gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  title:    { fontSize: 17, fontWeight: '600' },
  subtitle: { fontSize: 12, marginTop: 2 },

  scroll: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 90 },

  section:  { borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1 },
  secLabel: { fontSize: 11, fontWeight: '600', marginBottom: 10 },

  issueRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  issueIcon: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  issueCat:  { fontSize: 15, fontWeight: '600' },
  issueSub:  { fontSize: 13, marginTop: 2 },

  priorityRow: { flexDirection: 'row', gap: 10 },
  priorityBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, paddingVertical: 10,
    borderRadius: 8, borderWidth: 1,
  },
  priorityTxt: { fontSize: 13, fontWeight: '500' },

  scheduleRow:  { flexDirection: 'row', gap: 10, marginTop: 12, alignItems: 'flex-end' },
  timeBtn:      { flex: 1, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center' },
  timeBtnLabel: { fontSize: 11, marginBottom: 4 },
  timeValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeBtnValue: { fontSize: 13, fontWeight: '500', flex: 1 },

  picker: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12,
  },
  pickerTxt: { flex: 1, fontSize: 14 },

  textarea: { borderRadius: 8, borderWidth: 1, padding: 12, fontSize: 14, minHeight: 90 },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, borderRadius: 10, marginTop: 6,
  },
  submitTxt: { color: '#fff', fontSize: 14, fontWeight: '600' },
});