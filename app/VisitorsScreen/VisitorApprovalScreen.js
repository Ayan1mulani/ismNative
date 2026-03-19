import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Sound from 'react-native-sound';
import { visitorServices } from '../../services/visitorServices';
import { navigate } from "../../NavigationService";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vibration } from 'react-native';



const VisitorApprovalScreen = ({ route }) => {
  const { visitor, onGoBack } = route.params || {};
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(!!visitor?.id);


  const soundRef = useRef(null);

  /* ======================================================
     🔊 PLAY SOUND WHEN MODAL VISIBLE
  ====================================================== */
  useEffect(() => {
    if (!visible) return;

    const checkAndPlaySound = async () => {
      try {
        const stored = await AsyncStorage.getItem("notificationSoundSettings");

        let isVisitSoundOn = true;

        if (stored) {
          const data = JSON.parse(stored);
          const visit = data.find(item => item.name === "VISIT");
          isVisitSoundOn = visit?.switch === 1;
        }

        // 🔕 If OFF → Vibrate instead
        if (!isVisitSoundOn) {
          console.log("🔕 Sound OFF → Vibrating");
          Vibration.vibrate(500);
          return;
        }

        // 🔊 PLAY SOUND
        Sound.setCategory('Playback');

        const sound = new Sound(
          'visitor_alert.wav',
          Sound.MAIN_BUNDLE,
          (error) => {
            if (error) {
              console.log('❌ Sound load error:', error);
              return;
            }

            sound.setVolume(1.0);
            sound.setNumberOfLoops(-1);

            sound.play((success) => {
              if (!success) {
                console.log('❌ Sound play failed');
              }
            });
          }
        );

        soundRef.current = sound;

      } catch (e) {
        console.log("Sound setting error:", e);
      }
    };

    checkAndPlaySound();

    return () => {
      if (soundRef.current) {
        const s = soundRef.current;
        soundRef.current = null;

        s.stop(() => {
          s.release();
        });
      }
    };
  }, [visible]);

  const stopSound = () => {
    if (soundRef.current) {
      const sound = soundRef.current; // 👈 store reference

      soundRef.current = null; // 👈 prevent double calls

      sound.stop(() => {
        sound.release();
      });
    }
  };

  /* ======================================================
     ✅ ACCEPT VISITOR
  ====================================================== */
  const handleAccept = async () => {
    setLoading(true);
    try {
      console.log('✅ Visitor accepted:', visitor.id);

      await visitorServices.acceptVisitor(visitor.id);

      stopSound();
      setVisible(false);
      onGoBack?.();

      navigate("MainApp", {
        screen: "Visitors",
      });

    } catch (error) {
      console.error('Error accepting visitor:', error);
    } finally {
      setLoading(false);
    }
  };

  /* ======================================================
     ❌ DECLINE VISITOR
  ====================================================== */
  const handleDecline = async () => {
    setLoading(true);
    try {
      console.log('❌ Visitor declined:', visitor.id);

      await visitorServices.denyVisitor(visitor.id);

      stopSound();
      setVisible(false);
      onGoBack?.();

      navigate("MainApp", {
        screen: "Visitors",
      });

    } catch (error) {
      console.error('Error declining visitor:', error);
    } finally {
      setLoading(false);
    }
  };

  /* ======================================================
     ⚠️ NO VISITOR DATA
  ====================================================== */
  if (!visitor?.id) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No visitor data available</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            stopSound();
            setVisible(false);
            onGoBack?.();
            navigate("MainApp", { screen: "Visitors" });
          }}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ======================================================
     🎨 UI
  ====================================================== */
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => { }}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerText}>🔔 Visitor Request</Text>
          </View>

          {/* Visitor Info */}
          <View style={styles.content}>
            {visitor.photo && (
              <Image source={{ uri: visitor.photo }} style={styles.photo} />
            )}

            <Text style={styles.name}>{visitor.name}</Text>

            {visitor.purpose && (
              <Text style={styles.purpose}>
                Purpose: {visitor.purpose}
              </Text>
            )}

            {visitor.phoneNumber && (
              <Text style={styles.detail}>📱 {visitor.phoneNumber}</Text>
            )}




            <Text style={styles.message}>
              {visitor.name || "Visitor"} is requesting entry to your premises
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.declineButton]}
              onPress={handleDecline}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}> Decline</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={handleAccept}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}> Accept</Text>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

export default VisitorApprovalScreen;

/* ======================================================
   🎨 STYLES
====================================================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgb(255, 255, 255)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    width: '100%',
    padding: 20,
    elevation: 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    alignItems: 'center',
    marginBottom: 25,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  purpose: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  detail: {
    fontSize: 14,
    color: '#555',
    marginVertical: 4,
  },
  message: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginTop: 15,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  declineButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});