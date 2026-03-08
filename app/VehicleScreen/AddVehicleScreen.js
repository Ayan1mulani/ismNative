import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Common } from "../../services/Common";
import { Util } from "../../services/Util";
import { ApiCommon } from "../../services/ApiCommon";
import { API_URL2 } from "../config/env";
import SubmitButton from "../components/SubmitButton";

const AddVehicleScreen = ({ navigation, route }) => {
  const vehicle = route?.params?.vehicle;
  const isEdit = !!vehicle;

  const [loading, setLoading] = useState(false);

  const [vehicleNo, setVehicleNo] = useState(vehicle?.vehicle_no || "");
  const [owner, setOwner] = useState(vehicle?.owner || "");
  const [type, setType] = useState(vehicle?.type || "");
  const [model, setModel] = useState(vehicle?.model || "");
  const [stkNo, setStkNo] = useState(vehicle?.stk_no || "");
  const [insNo, setInsNo] = useState(vehicle?.ins_no || "");
  const [insExpDate, setInsExpDate] = useState(vehicle?.ins_exp_date || "");

  const [showTypeModal, setShowTypeModal] = useState(false);

  const handleSubmit = async () => {
    if (!vehicleNo || !owner || !type) {
      Alert.alert("Validation", "Vehicle No, Owner & Type are required");
      return;
    }

    try {
      setLoading(true);

      const user = await Common.getLoggedInUser();

      const userObj = {
        user_id: user.unit_id,
        group_id: user.role_id,
        flat_no: user.flat_no,
        unit_id: user.unit_id,
        society_id: user.societyId,
      };

      const headers = await Util.getCommonAuth();

      const payload = {
        vehicle_no: vehicleNo,
        owner,
        type,
        model,
        stk_no: stkNo,
        ins_no: insNo,
        ins_exp_date: insExpDate,
        provider: null,
        rf_id: null,
        secret_code: null,
      };

      let response;

      if (isEdit) {
        const url = `${API_URL2}/my/vehicle/${vehicle.id}?api-token=${user.api_token}&user-id=${encodeURIComponent(
          JSON.stringify(userObj)
        )}`;

        response = await ApiCommon.postReq(url, payload, headers);
      } else {
        const url = `${API_URL2}/my/vehicle?api-token=${user.api_token}&user-id=${encodeURIComponent(
          JSON.stringify(userObj)
        )}`;

        response = await ApiCommon.putReq(url, payload, headers);
      }

      if (response.status === "success") {
        Alert.alert(
          "Success",
          isEdit ? "Vehicle updated successfully" : "Vehicle added successfully"
        );
        navigation.goBack();
      } else {
        Alert.alert("Error", response.message || "Something went wrong");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const Input = ({ label, value, onChangeText, placeholder }) => (
    <View style={styles.inputBlock}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        placeholder={placeholder}
        onChangeText={onChangeText}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          < Ionicons name="chevron-back" size={26} color="#111" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {isEdit ? "Update Vehicle" : "Add Vehicle"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.card}>

          <Input
            label="Vehicle Number"
            value={vehicleNo}
            onChangeText={setVehicleNo}
            placeholder="MH12BA0223"
          />

          <Input
            label="Owner"
            value={owner}
            onChangeText={setOwner}
            placeholder="Owner Name"
          />

          <Text style={styles.label}>Vehicle Type</Text>

          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowTypeModal(true)}
          >
            <Text style={{ color: type ? "#111" : "#9CA3AF" }}>
              {type || "Select Vehicle Type"}
            </Text>

            < Ionicons name="chevron-down" size={18} color="#6B7280" />
          </TouchableOpacity>

          <Input
            label="Model"
            value={model}
            onChangeText={setModel}
            placeholder="Vehicle Model"
          />

          <Input
            label="Sticker Number"
            value={stkNo}
            onChangeText={setStkNo}
            placeholder="Sticker Number"
          />

          <Input
            label="Insurance Number"
            value={insNo}
            onChangeText={setInsNo}
            placeholder="Insurance Number"
          />

          <Input
            label="Insurance Expiry"
            value={insExpDate}
            onChangeText={setInsExpDate}
            placeholder="YYYY-MM-DD"
          />

        </View>

       <SubmitButton
  title={isEdit ? "Update Vehicle" : "Add Vehicle"}
  onPress={handleSubmit}
  loading={loading}
/>
      </ScrollView>

      {/* Vehicle Type Modal */}
      <Modal transparent visible={showTypeModal} animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTypeModal(false)}
        >
          <View style={styles.sheet}>

            <Text style={styles.sheetTitle}>Select Vehicle Type</Text>

            {["Car", "Bike", "2 Wheeler", "Other"].map((item) => (
              <TouchableOpacity
                key={item}
                style={styles.sheetItem}
                onPress={() => {
                  setType(item);
                  setShowTypeModal(false);
                }}
              >
                <Text style={styles.sheetText}>{item}</Text>
              </TouchableOpacity>
            ))}

          </View>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
};

export default AddVehicleScreen;

const styles = StyleSheet.create({

container:{
flex:1,
backgroundColor:"#ffffff"
},

header:{
flexDirection:"row",
alignItems:"center",
padding:16
},

headerTitle:{
fontSize:20,
fontWeight:"700",
marginLeft:10,
color:"#111827"
},

content:{
padding:16
},

card:{
backgroundColor:"#fff",
borderRadius:14,
padding:16,
borderWidth:1,
borderColor:"#E5E7EB"
},

inputBlock:{
marginBottom:14
},

label:{
fontSize:13,
fontWeight:"600",
marginBottom:6,
color:"#374151"
},

input:{
backgroundColor:"#F9FAFB",
borderWidth:1,
borderColor:"#E5E7EB",
borderRadius:10,
padding:12,
fontSize:14
},

dropdown:{
flexDirection:"row",
justifyContent:"space-between",
alignItems:"center",
backgroundColor:"#F9FAFB",
borderWidth:1,
borderColor:"#E5E7EB",
borderRadius:10,
padding:12,
marginBottom:14
},

button:{
marginTop:24,
backgroundColor:"#1565A9",
padding:16,
borderRadius:12,
alignItems:"center"
},

buttonText:{
color:"#fff",
fontWeight:"700",
fontSize:15
},

modalOverlay:{
flex:1,
backgroundColor:"rgba(0,0,0,0.4)",
justifyContent:"flex-end"
},

sheet:{
backgroundColor:"#fff",
padding:20,
borderTopLeftRadius:20,
borderTopRightRadius:20
},

sheetTitle:{
fontSize:16,
fontWeight:"700",
marginBottom:10
},

sheetItem:{
paddingVertical:14
},

sheetText:{
fontSize:15
}

});