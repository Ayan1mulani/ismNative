// ComplaintInputScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, Alert,
  Image, Modal, Dimensions, Platform, Animated
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
import AppHeader from '../components/AppHeader';
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get('window');
const PRIMARY = BRAND.COLORS.primary;

const LOCATIONS = [
  { id: 1, name: 'Lobby Area' }, { id: 2, name: 'Parking Area' },
  { id: 3, name: 'Garden Area' }, { id: 4, name: 'Swimming Pool' },
  { id: 5, name: 'Gym Area' }, { id: 6, name: 'Terrace' },
  { id: 7, name: 'Basement' }, { id: 8, name: 'Common Bathroom' },
  { id: 9, name: 'Elevator' }, { id: 10, name: 'Staircase' },
];

// ─── Status Modal Component ───────────────────────────────────────────────────
const StatusModal = ({
  visible,
  type = "loading", // loading | success | error
  title,
  subtitle,
  onClose,
  autoClose = true,
}) => {
  const [internalVisible, setInternalVisible] = useState(visible);

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const rotationAnim = useRef(null);

  useEffect(() => {
    if (visible) {
      setInternalVisible(true);

      // Open animation
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Start rotation for loading
      if (type === "loading") {
        rotation.setValue(0);
        rotationAnim.current = Animated.loop(
          Animated.timing(rotation, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          })
        );
        rotationAnim.current.start();
      }

      // Auto close success
      if (type === "success" && autoClose) {
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    } else {
      handleClose();
    }

    return () => {
      if (rotationAnim.current) rotationAnim.current.stop();
      rotation.stopAnimation();
    };
  }, [visible, type]);

  const handleClose = () => {
    if (rotationAnim.current) rotationAnim.current.stop();

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setInternalVisible(false);
      if (onClose) onClose();
    });
  };

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const renderIcon = () => {
    if (type === "success")
      return <Ionicons name="checkmark-circle" size={60} color="#22C55E" />;

    if (type === "error")
      return <Ionicons name="close-circle" size={60} color="#EF4444" />;

    return (
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Ionicons name="sync" size={50} color={PRIMARY} />
      </Animated.View>
    );
  };

  if (!internalVisible) return null;

  return (
    <Modal transparent visible={internalVisible} animationType="none">
      <View style={sm.overlay}>
        <Animated.View style={[sm.box, { opacity, transform: [{ scale }] }]}>
          {renderIcon()}
          {title && <Text style={sm.title}>{title}</Text>}
          {subtitle && <Text style={sm.subtitle}>{subtitle}</Text>}

          {type === "error" && (
            <TouchableOpacity style={sm.closeBtn} onPress={handleClose}>
              <Text style={sm.closeText}>Close</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const sm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    width: 280,
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 18,
    alignItems: "center",
    elevation: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
    textAlign: "center",
    color: "#111827"
  },
  subtitle: {
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
    color: "#6B7280",
  },
  closeBtn: {
    marginTop: 20,
    backgroundColor: "#EF4444",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  closeText: {
    color: "#fff",
    fontWeight: "600",
  },
});

// ─── Safe date formatter ──────────────────────────────────────────────────────
const formatDate = (raw) => {
  if (!raw) return null;
  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  try {
    const d = raw instanceof Date ? raw : new Date(raw);
    if (isNaN(d.getTime())) { console.warn('[formatDate] unparseable:', raw); return null; }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch (e) { console.warn('[formatDate] error:', e); return null; }
};

// ─── Helper: build a Date at a specific hour/minute ──────────────────────────
const makeTime = (hours, minutes = 0) => {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d; ``
};

// ─── Time Picker Modal ────────────────────────────────────────────────────────
const TimePicker = ({ visible, onClose, fromTime, toTime, onFromChange, onToChange, nightMode }) => {
  const [picking, setPicking] = useState('from');
  const [tempFrom, setTempFrom] = useState(null);
  const [tempTo, setTempTo] = useState(null);
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);
  const [timeError, setTimeError] = useState('');

  useEffect(() => {
    if (visible) {
      setTempFrom(fromTime || makeTime(9));
      setTempTo(toTime || makeTime(10));
      setPicking('from');
      setShowAndroidPicker(false);
      setTimeError('');
    }
  }, [visible]);

  const t = nightMode
    ? { bg: '#18181F', text: '#F1F5F9', sub: '#64748B', border: '#22222E', row: '#22222E', btn: '#2C2C35' }
    : { bg: '#FFFFFF', text: '#111827', sub: '#6B7280', border: '#E5E7EB', row: '#ffffff', btn: '#F3F4F6' };

  const fmt = (d) => d
    ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '-- : --';

  const handleDone = () => {
    if (tempFrom && tempTo) {
      const fromMins = tempFrom.getHours() * 60 + tempFrom.getMinutes();
      const toMins = tempTo.getHours() * 60 + tempTo.getMinutes();
      if (fromMins >= toMins) {
        setTimeError('End time must be after start time.');
        return;
      }
    }
    setTimeError('');
    if (tempFrom) onFromChange(tempFrom);
    if (tempTo) onToChange(tempTo);
    onClose();
  };

  // Directly open picker when pressing tab
  const handleTabPress = (tab) => {
    setPicking(tab);
    setTimeError('');
    if (Platform.OS === 'android') {
      setShowAndroidPicker(true);
    }
  };

  const onAndroidChange = (event, date) => {
    setShowAndroidPicker(false);
    if (event.type === 'set' && date) {
      if (picking === 'from') setTempFrom(date);
      else setTempTo(date);
    }
  };

  const activeTime = picking === 'from' ? (tempFrom || makeTime(9)) : (tempTo || makeTime(10));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={tp.overlay}>
        <TouchableOpacity style={tp.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[tp.sheet, { backgroundColor: t.bg }]}>
          <View style={[tp.handle, { backgroundColor: t.border }]} />
          <Text style={[tp.title, { color: t.text }]}>Select Time Range</Text>

          {Platform.OS === 'android' && (
            <Text style={{ fontSize: 13, color: t.sub, marginBottom: 14, marginTop: -4 }}>
              Tap on FROM or TO to change the time
            </Text>
          )}

          <View style={tp.row}>
            <TouchableOpacity
              style={[tp.timeBtn, { backgroundColor: t.row, borderColor: picking === 'from' ? PRIMARY : t.border }]}
              onPress={() => handleTabPress('from')}
              activeOpacity={0.7}
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
              onPress={() => handleTabPress('to')}
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={16} color={PRIMARY} />
              <View style={{ marginLeft: 8 }}>
                <Text style={[tp.label, { color: t.sub }]}>TO</Text>
                <Text style={[tp.time, { color: t.text }]}>{fmt(tempTo)}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {!!timeError && (
            <Text style={[tp.errorTxt, { color: '#EF4444' }]}>{timeError}</Text>
          )}

          {/* iOS requires the spinner inline */}
          {Platform.OS === 'ios' && (
            <View style={tp.pickerContainer}>
              <DateTimePicker
                value={activeTime}
                mode="time"
                display="spinner"
                onChange={(_, date) => {
                  if (date) {
                    setTimeError('');
                    if (picking === 'from') setTempFrom(date);
                    else setTempTo(date);
                  }
                }}
                style={{ height: 140 }}
                textColor={t.text}
              />
            </View>
          )}

          {/* Android opens native popup on top of the screen */}
          {Platform.OS === 'android' && showAndroidPicker && (
            <DateTimePicker
              key={picking}
              value={activeTime}
              mode="time"
              display="default"
              is24Hour={false}
              onChange={onAndroidChange}
            />
          )}

          <TouchableOpacity
            style={[tp.doneBtn, { backgroundColor: PRIMARY, marginTop: Platform.OS === 'android' ? 20 : 12 }]}
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
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 36 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  timeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, padding: 12 },
  label: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  time: { fontSize: 18, fontWeight: '700', marginTop: 2 },
  doneBtn: { marginTop: 12, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  doneTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  errorTxt: { fontSize: 12, fontWeight: '500', marginBottom: 8, marginTop: 8, textAlign: 'center' },
  pickerContainer: { height: 150, justifyContent: 'center' },
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
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 36, maxHeight: '70%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, borderBottomWidth: 1 },
  itemTxt: { flex: 1, fontSize: 14, fontWeight: '500' },
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

  const [config, setConfig] = useState(null);
  const [isASAP, setIsASAP] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [fromTime, setFromTime] = useState(null);
  const [toTime, setToTime] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState(null);
  const [showLocModal, setShowLocModal] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [images, setImages] = useState([]);

  // Modal State
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    type: 'loading',
    title: '',
    subtitle: ''
  });

  useEffect(() => { loadConfig(); }, []);

  const loadConfig = async () => {
  try {
    const data = await AsyncStorage.getItem("SOCIETY_CONFIG");

    if (data) {
      const parsed = JSON.parse(data);

      setConfig(parsed.data); // ✅ correct

      console.log("✅ Loaded config:", parsed.data);
    } else {
      console.log("⚠️ No config found");
    }

  } catch (error) {
    console.log("❌ Config Error:", error);
  }
};

  const handlePriorityChange = (val) => {
    setIsASAP(val);
    if (val) {
      setSelectedDate(null);
      setFromTime(null);
      setToTime(null);
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

  const showModal = (type, title, subtitle) => {
    setModalConfig({ visible: true, type, title, subtitle });
  };

  const hideModal = () => {
    setModalConfig(prev => ({ ...prev, visible: false }));
  };

  const handleSubmit = async () => {
    if (!location) { showModal('error', 'Required', 'Please select a location.'); return; }
    if (!remarks.trim()) { showModal('error', 'Required', 'Please describe the issue.'); return; }

    if (!isASAP) {
      if (!selectedDate) { showModal('error', 'Required', 'Please select a date.'); return; }
      if (!fromTime || !toTime) { showModal('error', 'Required', 'Please select both start and end time.'); return; }

      const fromMins = fromTime.getHours() * 60 + fromTime.getMinutes();
      const toMins = toTime.getHours() * 60 + toTime.getMinutes();
      if (fromMins >= toMins) {
        showModal('error', 'Invalid Time', 'End time must be after start time.');
        return;
      }
    }

    if (isASAP && config?.complaint_lock_time) {
      const current = new Date().toTimeString().slice(0, 5);
      const from = config.complaint_lock_time.from;
      const to = config.complaint_lock_time.to;
      if (current < from || current > to) {
        showModal('error', 'Complaints Closed', `Complaints allowed only between ${from} and ${to}`);
        return;
      }
    }

    const probableDate = !isASAP ? formatDate(selectedDate) : null;
    const probableTime = !isASAP && fromTime && toTime
      ? `${fmtTime(fromTime)} to ${fmtTime(toTime)}`
      : null;

    if (!isASAP && !probableDate) {
      showModal('error', 'Invalid Date', 'Could not read the selected date. Please try again.');
      return;
    }

    showModal('loading', 'Submitting...', 'Please wait while we process your request');

    try {
      const res = await complaintService.addComplaint({
        sub_category: subCategory?.name,
        complaint_type: category?.id,
        description: `${subCategory?.name} : ${remarks}`,
        severity: 'normal',
        sub_category_id: subCategory?.id,
        probable_date: probableDate,
        probable_time: probableTime,
        constant_society_id: 4710,
        location_id: location?.id,
      });

      if (res?.status === 'success') {
        showModal('success', 'Success', `Complaint No: ${res.data.com_no}`);

        // Wait for success modal to finish showing before navigating
        setTimeout(() => {
          navigation.navigate('MainApp', {
            screen: 'Service Requests',
            params: { screen: 'ServiceRequestsMain' },
          });
        }, 1500);

      } else {
        showModal('error', 'Error', res?.message || 'Failed to submit complaint.');
      }

    } catch (error) {
      console.log('Submit Error:', error);
      showModal('error', 'Error', error?.message || error?.response?.data?.message || 'Something went wrong.');
    }
  };

  return (
    <SafeAreaView style={[s.root, { backgroundColor: t.bg }]} edges={['top']}>
      {/* ── Header ── */}
      <AppHeader title={"Submit Complaint"} />

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

        {/* ── Priority & Schedule ── */}
        <Section label="Priority" t={t}>
          <View style={s.priorityRow}>
            {[
              { val: true, label: 'ASAP', icon: 'flash-outline' },
              { val: false, label: 'Schedule', icon: 'calendar-outline' },
            ].map(opt => (
              <TouchableOpacity
                key={String(opt.val)}
                style={[s.priorityBtn, {
                  borderColor: isASAP === opt.val ? PRIMARY : t.border,
                  backgroundColor: isASAP === opt.val ? `${PRIMARY}12` : t.input,
                }]}
                onPress={() => handlePriorityChange(opt.val)}
                activeOpacity={0.75}
              >
                <Ionicons name={opt.icon} size={16} color={isASAP === opt.val ? PRIMARY : t.sub} />
                <Text style={[s.priorityTxt, { color: isASAP === opt.val ? PRIMARY : t.text }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* Render Schedule row OUTSIDE the Priority Section box, directly below it */}
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

            <View style={{ flex: 1 }}>
              <Text style={[s.timeOutLabel, { color: t.sub }]}>TIME *</Text>
              <TouchableOpacity
                style={[s.timeBtn, { borderColor: t.border, backgroundColor: t.input }]}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.8}
              >
                <View style={s.timeValueRow}>
                  <Ionicons name="time-outline" size={16} color={PRIMARY} />
                  <Text style={[s.timeBtnValue, { color: fromTime ? t.text : t.sub }]} numberOfLines={1}>
                    {timeLabel}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
          style={[s.submitBtn, { backgroundColor: PRIMARY, opacity: modalConfig.type === 'loading' && modalConfig.visible ? 0.7 : 1 }]}
          onPress={handleSubmit}
          disabled={modalConfig.type === 'loading' && modalConfig.visible}
          activeOpacity={0.85}
        >
          <>
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={s.submitTxt}>Submit Complaint</Text>
          </>
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

      <StatusModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        subtitle={modalConfig.subtitle}
        onClose={hideModal}
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
  title: { fontSize: 17, fontWeight: '600' },
  subtitle: { fontSize: 12, marginTop: 2 },

  scroll: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 90 },

  section: { borderRadius: 12, padding: 14, marginBottom: 8 },
  secLabel: { fontSize: 11, fontWeight: '600', marginBottom: 10 },

  issueRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  issueIcon: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  issueCat: { fontSize: 15, fontWeight: '600' },
  issueSub: { fontSize: 13, marginTop: 2 },

  priorityRow: { flexDirection: 'row', gap: 10 },
  priorityBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, paddingVertical: 10,
    borderRadius: 8, borderWidth: 1,
  },
  priorityTxt: { fontSize: 13, fontWeight: '500' },

  scheduleRow: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start', paddingHorizontal: 12 },
  timeOutLabel: { fontSize: 11, fontWeight: '600', marginBottom: 6, marginTop: 2 },
  timeBtn: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, height: 47, justifyContent: 'center' },
  timeValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeBtnValue: { fontSize: 11, flexShrink: 1, },

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