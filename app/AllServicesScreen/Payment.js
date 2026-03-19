import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Linking
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
            console.log(res, "payments")

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

        return (
            <TouchableOpacity
                onPress={() => navigation.navigate("PaymentDetailScreen", { payment: item })}
                style={{
                    backgroundColor: "#fff",
                    marginHorizontal: 15,
                    marginBottom: 10,
                    padding: 15,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#eee"
                }}
            >
                <Text style={{ fontWeight: "700", fontSize: 14 }}>
                    ₹ {parseFloat(item.amount).toFixed(0)}
                </Text>

                <Text style={{ color: "#6B7280", fontSize: 12 }}>
                    {item.remarks || "No remarks"}
                </Text>

                <Text style={{ fontSize: 12, marginTop: 4 }}>
                    {item.transaction_date_time}
                </Text>

                <Text style={{
                    marginTop: 6,
                    fontSize: 12,
                    fontWeight: "600",
                    color: isCredit ? "#16A34A" : "#EF4444"
                }}>
                    {isCredit ? "Credit" : "Debit"}
                </Text>

            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#1996D3" />
            </View>
        );
    }

    if (data.length === 0) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text>No payments found</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#F4F6F9" }}>
            <AppHeader title="Payments" />

            <FlatList
                data={data}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={{ paddingTop: 10, paddingBottom: 30 }}
            />
        </View>
    );
};

export default Payment;