// ComplaintInputScreen.js
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, Alert,
  Image, Modal, Dimensions,
} from 'react-native';
import   Ionicons  from 'react-native-vector-icons/Ionicons';
import   MaterialIcons  from 'react-native-vector-icons/MaterialIcons';

  

import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePermissions } from '../../Utils/ConetextApi';
import CalendarSelector from '.././VisitorsScreen/components/Calender';
import { complaintService } from '../../services/complaintService';


const { width } = Dimensions.get('window');

const PRIMARY   = '#1996D3';
const LOCATIONS = [
  { id: 1, name: 'Lobby Area' },    { id: 2, name: 'Parking Area' },
  { id: 3, name: 'Garden Area' },   { id: 4, name: 'Swimming Pool' },
  { id: 5, name: 'Gym Area' },      { id: 6, name: 'Terrace' },
  { id: 7, name: 'Basement' },      { id: 8, name: 'Common Bathroom' },
  { id: 9, name: 'Elevator' },      { id: 10, name: 'Staircase' },
];

// ─── Time picker modal (from / to) ───────────────────────────────────────────
const TimePicker = ({ visible, onClose, fromTime, toTime, onFromChange, onToChange, nightMode }) => {
  const [picking, setPicking] = useState(null); // 'from' | 'to'
  const t = nightMode
    ? { bg: '#18181F', text: '#F1F5F9', sub: '#64748B', border: '#22222E', row: '#22222E' }
    : { bg: '#FFFFFF', text: '#111827', sub: '#6B7280', border: '#E5E7EB', row: '#ffffff' };

  const fmt = (d) => d
    ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '-- : --';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={tp.overlay}>
        <TouchableOpacity style={tp.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[tp.sheet, { backgroundColor: t.bg }]}>
          {/* Handle */}
          <View style={[tp.handle, { backgroundColor: t.border }]} />
          <Text style={[tp.title, { color: t.text }]}>Select Time Range</Text>

          {/* From / To buttons */}
          <View style={tp.row}>
            {/* FROM */}
            <TouchableOpacity
              style={[tp.timeBtn, { backgroundColor: t.row, borderColor: picking === 'from' ? PRIMARY : t.border }]}
              onPress={() => setPicking(picking === 'from' ? null : 'from')}
            >
              < Ionicons name="time-outline" size={16} color={PRIMARY} />
              <View style={{ marginLeft: 8 }}>
                <Text style={[tp.label, { color: t.sub }]}>FROM</Text>
                <Text style={[tp.time, { color: t.text }]}>{fmt(fromTime)}</Text>
              </View>
            </TouchableOpacity>

            < Ionicons name="arrow-forward" size={16} color={t.sub} style={{ alignSelf: 'center' }} />

            {/* TO */}
            <TouchableOpacity
              style={[tp.timeBtn, { backgroundColor: t.row, borderColor: picking === 'to' ? PRIMARY : t.border }]}
              onPress={() => setPicking(picking === 'to' ? null : 'to')}
            >
              < Ionicons name="time-outline" size={16} color={PRIMARY} />
              <View style={{ marginLeft: 8 }}>
                <Text style={[tp.label, { color: t.sub }]}>TO</Text>
                <Text style={[tp.time, { color: t.text }]}>{fmt(toTime)}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Native clock */}
          {picking === 'from' && (
            <DateTimePicker
              value={fromTime || new Date()}
              mode="time"
              display="spinner"
              onChange={(_, d) => { if (d) onFromChange(d); }}
              style={{ height: 120 }}
            />
          )}
          {picking === 'to' && (
            <DateTimePicker
              value={toTime || new Date()}
              mode="time"
              display="spinner"
              onChange={(_, d) => { if (d) onToChange(d); }}
              style={{ height: 120 }}
            />
          )}

          <TouchableOpacity
            style={[tp.doneBtn, { backgroundColor: PRIMARY }]}
            onPress={() => { setPicking(null); onClose(); }}
          >
            <Text style={tp.doneTxt}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const tp = StyleSheet.create({
  overlay:   { flex: 1, justifyContent: 'flex-end' },
  backdrop:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet:     { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 36 },
  handle:    { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title:     { fontSize: 16, fontWeight: '700', marginBottom: 18 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  timeBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, padding: 12 },
  label:     { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  time:      { fontSize: 18, fontWeight: '700', marginTop: 2 },
  doneBtn:   { marginTop: 12, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  doneTxt:   { color: '#fff', fontSize: 14, fontWeight: '700' },
});

// ─── Location modal ────────────────────────────────────────────────────────────
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
                  < Ionicons name="location-outline" size={16} color={active ? PRIMARY : t.sub} />
                  <Text style={[lm.itemTxt, { color: active ? PRIMARY : t.text }]}>{loc.name}</Text>
                  {active && < Ionicons name="checkmark" size={16} color={PRIMARY} />}
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

// ─── Main screen ──────────────────────────────────────────────────────────────
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

  const [isASAP,          setIsASAP]          = useState(true);
  const [selectedDate,    setSelectedDate]    = useState(null);
  const [fromTime,        setFromTime]        = useState(null);
  const [toTime,          setToTime]          = useState(null);
  const [showTimePicker,  setShowTimePicker]  = useState(false);
  const [location,        setLocation]        = useState(null);
  const [showLocModal,    setShowLocModal]    = useState(false);
  const [remarks,         setRemarks]         = useState('');
  const [images,          setImages]          = useState([]);
  const [submitting,      setSubmitting]      = useState(false);

  const fmtTime = (d) => d
    ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null;

  const timeLabel = fromTime && toTime
    ? `${fmtTime(fromTime)}  →  ${fmtTime(toTime)}`
    : fromTime
    ? `From ${fmtTime(fromTime)}`
    : 'Select time range';

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow access to your photo library.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, quality: 0.8, selectionLimit: 5,
    });
    if (!result.canceled) setImages(prev => [...prev, ...result.assets].slice(0, 5));
  };

const handleSubmit = async () => {
  if (!location) {
    Alert.alert("Required", "Please select a location.");
    return;
  }

  if (!remarks.trim()) {
    Alert.alert("Required", "Please describe the issue.");
    return;
  }

  if (!isASAP && !selectedDate) {
    Alert.alert("Required", "Please select a date.");
    return;
  }
if (!isASAP) {
  if (!selectedDate) {
    Alert.alert("Required", "Please select a date.");
    return;
  }

  if (!fromTime || !toTime) {
    Alert.alert("Required", "Please select both start and end time.");
    return;
  }

  if (fromTime >= toTime) {
    Alert.alert("Invalid Time", "End time must be after start time.");
    return;
  }
}
  setSubmitting(true);
  

  try {
    
    const res = await complaintService.addComplaint({
      sub_category: subCategory?.name,
      complaint_type: category?.id,
      description: remarks,
      severity: "normal",
      sub_category_id: subCategory?.id,

   probable_date: !isASAP && selectedDate
  ? new Date(selectedDate).toISOString().split("T")[0]
  : null,

      probable_time:
        !isASAP && fromTime && toTime
         ? `${fmtTime(fromTime)} to ${fmtTime(toTime)}`
          : null,

      location_id: location?.id,   // ✅ IMPORTANT
    });

    if (res?.status === "success") {
      Alert.alert(
        "Success",
        `Complaint No: ${res.data.com_no}`,
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("MainApp", {
  screen: "Service Requests",
  params: {
    screen: "ServiceRequestsMain",
  },
}),
          },
        ]
      );
    } else {
      Alert.alert("Error", res?.message || "Failed to submit complaint.");
    }

  } catch (error) {
    console.log("Submit Error:", error);
    Alert.alert("Error", "Something went wrong.");
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
          < Ionicons name="arrow-back" size={18} color={t.text} />
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
              <Text style={[s.issueCat, { color: t.text }]}>
                {category?.name || 'Unknown Category'}
              </Text>
              <Text style={[s.issueSub, { color: t.sub }]}>
                {subCategory?.name || 'Unknown Subcategory'}
              </Text>
            </View>
          </View>
        </Section>

        {/* ── Priority ── */}
        <Section label="Priority" t={t}>
          <View style={s.priorityRow}>
            {[{ val: true, label: 'ASAP', icon: 'flash-outline' }, { val: false, label: 'Schedule', icon: 'calendar-outline' }].map(opt => (
              <TouchableOpacity
                key={String(opt.val)}
                style={[s.priorityBtn, {
                  borderColor: isASAP === opt.val ? PRIMARY : t.border,
                  backgroundColor: isASAP === opt.val ? `${PRIMARY}12` : t.input,
                }]}
                onPress={() => setIsASAP(opt.val)}
                activeOpacity={0.75}
              >
                < Ionicons name={opt.icon} size={16} color={isASAP === opt.val ? PRIMARY : t.sub} />
                <Text style={[s.priorityTxt, { color: isASAP === opt.val ? PRIMARY : t.text }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Schedule fields */}
          {!isASAP && (
            <View style={s.scheduleRow}>
              {/* Date — uses CalendarSelector */}
              <View style={{ flex: 1 }}>
                <CalendarSelector
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  label="Date"
                  required
                  nightMode={nightMode}
                />
              </View>

              {/* Time range */}
              <TouchableOpacity
                style={[s.timeBtn, { borderColor: t.border, backgroundColor: t.input }]}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.8}
              >
                <Text style={[s.timeBtnLabel, { color: t.sub }]}>TIME</Text>
                <View style={s.timeValueRow}>
                  < Ionicons name="time-outline" size={14} color={PRIMARY} />
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
            < Ionicons name="location-outline" size={16} color={PRIMARY} />
            <Text style={[s.pickerTxt, { color: location ? t.text : t.sub }]}>
              {location?.name || 'Select a location'}
            </Text>
            < Ionicons name="chevron-down" size={15} color={t.sub} />
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

        {/* ── Images ── */}
        <Section label={`Images (${images.length}/5)`} t={t}>
          {images.length > 0 && (
            <View style={s.imageGrid}>
              {images.map((img, i) => (
                <View key={i} style={s.imgWrap}>
                  <Image source={{ uri: img.uri }} style={s.thumb} />
                  <TouchableOpacity
                    style={s.imgRemove}
                    onPress={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                  >
                    < Ionicons name="close-circle" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          {images.length < 5 && (
            <TouchableOpacity
              style={[s.addImgBtn, { borderColor: PRIMARY, backgroundColor: `${PRIMARY}08` }]}
              onPress={pickImage}
              activeOpacity={0.8}
            >
              < Ionicons name="camera-outline" size={18} color={PRIMARY} />
              <Text style={[s.addImgTxt, { color: PRIMARY }]}>Add Photo</Text>
            </TouchableOpacity>
          )}
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
                < Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
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
  // ───── Header ─────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 17,
    paddingVertical: 20,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  // ───── Scroll ─────
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 90,
  },

  // ───── Section Card ─────
  section: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 0,
  },
  secLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 10,
  },

  // ───── Issue ─────
  issueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  issueIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  issueCat: {
    fontSize: 15,
    fontWeight: '600',
  },
  issueSub: {
    fontSize: 13,
    marginTop: 2,
  },

  // ───── Priority ─────
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  priorityTxt: {
    fontSize: 13,
    fontWeight: '500',
  },

  // ───── Schedule Row ─────
  scheduleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    alignItems: 'flex-end',
  },
  timeBtn: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  timeBtnLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  timeValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeBtnValue: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },

  // ───── Picker ─────
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerTxt: {
    flex: 1,
    fontSize: 14,
  },

  // ───── Textarea ─────
  textarea: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 90,
  },

  // ───── Images ─────
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  imgWrap: {
    position: 'relative',
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  imgRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  addImgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: 10,
  },
  addImgTxt: {
    fontSize: 13,
    fontWeight: '500',
  },

  // ───── Submit ─────
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 6,
  },
  submitTxt: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});