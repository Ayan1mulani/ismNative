import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { navigate } from "../../NavigationService";
import Sound from "react-native-sound";
import { useEffect, useRef } from "react";

const VisitorPopup = ({ visible, message, onClose }) => {
    const handleOk = () => {
        soundRef.current?.stop();
        soundRef.current?.release();

        onClose?.();

        navigate("MainApp", {
            screen: "Visitors",
        });
    };

    const soundRef = useRef(null);

    useEffect(() => {
        if (visible) {
            Sound.setCategory("Playback");

            const sound = new Sound(
                "door_bell.mp3", 
                Sound.MAIN_BUNDLE,
                (error) => {
                    if (error) {
                        console.log("❌ Sound load error:", error);
                        return;
                    }

                    sound.setVolume(1.0);

                    sound.play((success) => {
                        if (!success) {
                            console.log("❌ Sound play failed");
                        }
                    });
                }
            );

            soundRef.current = sound;
        }

        return () => {
            soundRef.current?.stop();
            soundRef.current?.release();
        };
    }, [visible]);

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.popup}>

                    <Text style={styles.title}>🚪 Visitor Alert</Text>

                    <Text style={styles.message}>
                        {message || "Visitor is at the gate. Please allow."}
                    </Text>

                    <TouchableOpacity style={styles.button} onPress={handleOk}>
                        <Text style={styles.buttonText}>View</Text>
                    </TouchableOpacity>

                </View>
            </View>
        </Modal>
    );
};

export default VisitorPopup;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
    },
    popup: {
        width: "85%",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 20,
        alignItems: "center",
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 10,
    },
    message: {
        fontSize: 15,
        textAlign: "center",
        marginBottom: 20,
        color: "#555",
    },
    button: {
        backgroundColor: "#4CAF50",
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 10,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
});