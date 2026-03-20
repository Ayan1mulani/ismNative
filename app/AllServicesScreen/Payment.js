import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Linking,
    Image,
    StyleSheet
} from "react-native";
import { ismServices } from "../../services/ismServices";
import AppHeader from "../components/AppHeader";
import { useNavigation } from "@react-navigation/native";

const Payment = () => {
    const navigation = useNavigation();

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPayments();
    }, []);

    const loadPayments = async () => {
        try {
            const res = await ismServices.getPayments();
            console.log(res, "payments");

            if (res?.status === "success") {
                setData(res.data || []);
            }
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    };

    const openReceipt = (url) => {
        if (url) Linking.openURL(url);
    };

    const renderItem = ({ item }) => {
        const isCredit = item.type === "CREDIT" || item.p_type === "CR";

        // Placeholder image URLs for demonstration. 
        // Replace these with your local assets (e.g., require('../../assets/credit.png')) if preferred.
        const avatarUrl = "https://ui-avatars.com/api/?name=User&background=F3F4F6&color=374151&rounded=true";
        const creditIcon = "https://cdn-icons-png.flaticon.com/512/753/753313.png"; // Arrow pointing up/right
        const debitIcon = "https://cdn-icons-png.flaticon.com/512/753/753345.png";  // Arrow pointing down/left

        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate("PaymentDetailScreen", { id: item.id })}
                style={styles.card}
            >
                {/* Left Side: Avatar */}
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />

                {/* Middle: Details */}
                <View style={styles.detailsContainer}>
                    <Text style={styles.remarks} numberOfLines={1}>
                        {item.remarks || "No remarks"}
                    </Text>
                    <Text style={styles.dateText}>
                        {item.transaction_date_time}
                    </Text>
                </View>

                {/* Right Side: Amount & Status Indicator */}
                <View style={styles.amountContainer}>
                    <Text style={[styles.amountText, { color: isCredit ? "#16A34A" : "#111827" }]}>
                        {isCredit ? "+" : "-"} ₹{parseFloat(item.amount).toFixed(0)}
                    </Text>

                    <View style={styles.statusRow}>
                        <Image
                            source={{ uri: isCredit ? creditIcon : debitIcon }}
                            style={[styles.statusIcon, { tintColor: isCredit ? "#16A34A" : "#EF4444" }]}
                        />
                        <Text style={[styles.statusText, { color: isCredit ? "#16A34A" : "#EF4444" }]}>
                            {isCredit ? "Credit" : "Debit"}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#1996D3" />
            </View>
        );
    }

    if (data.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <Image
                    source={{ uri: "https://cdn-icons-png.flaticon.com/512/7486/7486747.png" }}
                    style={styles.emptyImage}
                />
                <Text style={styles.emptyText}>No payments found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <AppHeader title="Payments" />

            <FlatList
                data={data}
                keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F4F6F9",
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F4F6F9",
    },
    listContainer: {
        paddingTop: 15,
        paddingBottom: 30,
    },
    card: {
        backgroundColor: "#fff",
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 16,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        // Shadow for iOS
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        // Elevation for Android
        elevation: 0.3,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 14,
        backgroundColor: "#E5E7EB",
    },
    detailsContainer: {
        flex: 1,
        justifyContent: "center",
    },
    remarks: {
        fontWeight: "600",
        fontSize: 15,
        color: "#111827",
        marginBottom: 4,
    },
    dateText: {
        color: "#6B7280",
        fontSize: 12,
        fontWeight: "400",
    },
    amountContainer: {
        alignItems: "flex-end",
        justifyContent: "center",
    },
    amountText: {
        fontWeight: "700",
        fontSize: 15,
        marginBottom: 4,
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    statusIcon: {
        width: 12,
        height: 12,
        marginRight: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
    },
    emptyImage: {
        width: 64,
        height: 64,
        marginBottom: 12,
        tintColor: "#9CA3AF",
    },
    emptyText: {
        fontSize: 16,
        color: "#6B7280",
        fontWeight: "500",
    }
});

export default Payment;