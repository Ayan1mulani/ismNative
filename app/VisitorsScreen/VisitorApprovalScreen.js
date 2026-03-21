import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator, Vibration,
} from 'react-native';
import Sound from 'react-native-sound';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { visitorServices } from '../../services/visitorServices';
import { CommonActions } from '@react-navigation/native';

const VisitorApprovalScreen = ({ route, navigation }) => {
  const { visitor } = route.params || {};
  const [loading, setLoading] = useState(false);
  const soundRef = useRef(null);

  /* ======================================================
     SOUND — tied to mount/unmount ONLY
     Cleanup GUARANTEED when screen leaves stack
  ====================================================== */
  useEffect(() => {
    if (!visitor?.id) return;

    let isMounted = true;

    const startSound = async () => {
      try {
        const stored = await AsyncStorage.getItem("notificationSoundSettings");
        let isVisitSoundOn = true;

        if (stored) {
          const parsed = JSON.parse(stored);
          const visit = parsed.find(item => item.name === "VISIT");
          isVisitSoundOn = visit?.switch === 1;
        }

        if (!isVisitSoundOn) {
          Vibration.vibrate([0, 500, 200, 500]);
          return;
        }

        if (!isMounted) return;

        Sound.setCategory('Playback');

        const sound = new Sound('visitor_alert.wav', Sound.MAIN_BUNDLE, (error) => {
          if (error || !isMounted) {
            console.log('❌ Sound load error:', error);
            return;
          }
          soundRef.current = sound;
          sound.setVolume(1.0);
          sound.setNumberOfLoops(-1);
          sound.play((success) => {
            if (!success) console.log('❌ Sound play failed');
          });
        });

      } catch (e) {
        console.log("❌ Sound setup error:", e);
      }
    };

    startSound();

    // Runs when screen is removed from stack — always
    return () => {
      isMounted = false;
      stopSound();
    };
  }, []);

  /* ======================================================
     STOP SOUND — safe, idempotent
  ====================================================== */
  const stopSound = () => {
    const sound = soundRef.current;
    if (!sound) return;
    soundRef.current = null;
    try {
      sound.stop(() => sound.release());
    } catch (e) {
      console.log("❌ stopSound error:", e);
    }
  };

  /* ======================================================
     EXIT — clears AsyncStorage then resets nav stack
     AsyncStorage is cleared HERE (not in navigateToVisitor)
     so that if the user backgrounds without acting, re-opening
     the app via icon still finds the pending visitor and shows
     this screen again.
  ====================================================== */
  const exitToVisitors = async () => {
    // ✅ Clear only after user has acted (accept / decline / back)
    await AsyncStorage.removeItem("PENDING_VISITOR");

    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{
          name: "MainApp",
          state: {
            routes: [{ name: "Visitors" }],
          },
        }],
      })
    );
  };

  /* ======================================================
     ACCEPT
  ====================================================== */
  const handleAccept = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await visitorServices.acceptVisitor(visitor.id);
      console.log("✅ Accepted:", visitor.id);
      exitToVisitors(); // unmounts → sound stops via cleanup
    } catch (error) {
      console.error('❌ Accept error:', error);
      setLoading(false);
    }
  };

  /* ======================================================
     DECLINE
  ====================================================== */
  const handleDecline = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await visitorServices.denyVisitor(visitor.id);
      console.log("❌ Declined:", visitor.id);
      exitToVisitors(); // unmounts → sound stops via cleanup
    } catch (error) {
      console.error('❌ Decline error:', error);
      setLoading(false);
    }
  };

  /* ======================================================
     NO VISITOR DATA
  ====================================================== */
  if (!visitor?.id) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No visitor data available</Text>
        <TouchableOpacity
          style={[styles.button, styles.declineButton]}
          onPress={exitToVisitors}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ======================================================
     UI
  ====================================================== */
  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.headerText}>🔔 Visitor Request</Text>
      </View>

      <View style={styles.content}>
        {visitor.photo && (
          <Image source={{ uri: visitor.photo }} style={styles.photo} />
        )}
        <Text style={styles.name}>{visitor.name}</Text>

        {visitor.purpose && (
          <Text style={styles.purpose}>Purpose: {visitor.purpose}</Text>
        )}
        {visitor.phoneNumber && (
          <Text style={styles.detail}>📱 {visitor.phoneNumber}</Text>
        )}
        <Text style={styles.message}>
          {visitor.name || "Visitor"} is requesting entry to your premises
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.declineButton]}
          onPress={handleDecline}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Decline</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.acceptButton]}
          onPress={handleAccept}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Accept</Text>}
        </TouchableOpacity>
      </View>

    </View>
  );
};

export default VisitorApprovalScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16, color: '#666',
    marginBottom: 20, textAlign: 'center',
  },
  header: {
    alignItems: 'center', marginBottom: 20,
    paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#e0e0e0',
  },
  headerText: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  content: { alignItems: 'center', marginBottom: 25 },
  photo: {
    width: 120, height: 120, borderRadius: 60,
    marginBottom: 15, borderWidth: 3, borderColor: '#4CAF50',
  },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  purpose: { fontSize: 16, color: '#666', marginBottom: 12 },
  detail: { fontSize: 14, color: '#555', marginVertical: 4 },
  message: { fontSize: 16, color: '#777', textAlign: 'center', marginTop: 15 },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  button: {
    flex: 1, paddingVertical: 15, borderRadius: 12,
    alignItems: 'center', marginHorizontal: 5,
  },
  acceptButton: { backgroundColor: '#4CAF50' },
  declineButton: { backgroundColor: '#f44336' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});