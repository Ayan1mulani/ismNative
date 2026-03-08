import React, { useEffect, useState } from "react";
import {
View,
Text,
StyleSheet,
ScrollView,
TouchableOpacity,
TextInput,
KeyboardAvoidingView,
Platform,
Modal,
Alert
} from "react-native";

import Ionicons from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";

import { complaintService } from "../../../services/complaintService";
import { usePermissions } from "../../../Utils/ConetextApi";
import AppHeader from "../../components/AppHeader";

const ServiceRequestDetailScreen = () => {

const route = useRoute();
const navigation = useNavigation();
const { nightMode } = usePermissions();

const complaint = route.params?.complaint || {};

const [comments,setComments] = useState([]);
const [message,setMessage] = useState("");

const [ratingModal,setRatingModal] = useState(false);
const [rating,setRating] = useState(0);
const [feedback,setFeedback] = useState("");

const theme = nightMode ? {
bg:"#0F0F14",
card:"#18181F",
text:"#fff",
sub:"#9CA3AF"
} : {
bg:"#F4F6FA",
card:"#fff",
text:"#111",
sub:"#6B7280"
};

useEffect(()=>{
loadComments();
},[]);

const loadComments = async () => {

try{

const res = await complaintService.getComplaintComments(complaint.id);

setComments(res || []);

}catch(e){

console.log(e);

}

};

const sendComment = async () => {

if(!message.trim()) return;

try{

await complaintService.addComment(complaint.id,message);

setMessage("");

loadComments();

}catch(e){

console.log(e);

}

};

const submitRating = async () => {

if(!rating){
Alert.alert("Rating Required","Please give rating");
return;
}

try{

const payload = {
...complaint,
status:"Closed",
rating:String(rating),
resident_remarks:feedback
};

await complaintService.updateComplaintStatus(payload,"Closed");

setRatingModal(false);

Alert.alert("Thank you","Rating submitted");

navigation.goBack();

}catch(e){

console.log(e);

}

};

const isClosed = complaint.status === "Closed";
const hasRating = complaint.rating !== null && complaint.rating !== "0";

return(

<SafeAreaView style={{flex:1,backgroundColor:theme.bg}}>

<KeyboardAvoidingView
style={{flex:1}}
behavior={Platform.OS==="ios"?"padding":"height"}
>
<AppHeader title={complaint.complaint_type_name}/>

<ScrollView
contentContainerStyle={{padding:16,paddingBottom:120}}
>

<View style={[styles.card,{backgroundColor:theme.card}]}>


<Text style={styles.subCategory}>
{complaint.sub_category}
</Text>

<Text style={styles.description}>
{complaint.description}
</Text>

<View style={styles.infoRow}>
<Text style={styles.label}>Added By</Text>
<Text style={styles.value}>{complaint.createdBy}</Text>
</View>

<View style={styles.infoRow}>
<Text style={styles.label}>Staff</Text>
<Text style={styles.value}>{complaint.staff_name || "-"}</Text>
</View>

<View style={styles.infoRow}>
<Text style={styles.label}>Unit</Text>
<Text style={styles.value}>{complaint.display_unit_no}</Text>
</View>

</View>

{/* Show Rating if closed */}

{isClosed && hasRating && (

<View style={[styles.card,{backgroundColor:theme.card}]}>

<Text style={styles.sectionTitle}>
Rating
</Text>

<View style={{flexDirection:"row"}}>

{[1,2,3,4,5].map((s)=>(
<Ionicons
key={s}
name={s<=parseFloat(complaint.rating)?"star":"star-outline"}
size={22}
color="#F59E0B"
/>
))}

</View>

<Text style={{marginTop:6}}>
{complaint.resident_remarks}
</Text>

</View>

)}

{/* Give Rating button */}

{isClosed && !hasRating && (

<TouchableOpacity
style={styles.closeBtn}
onPress={()=>setRatingModal(true)}
>

<Text style={styles.closeText}>
Give Rating
</Text>

</TouchableOpacity>

)}

{/* Mark closed */}

{!isClosed && (

<TouchableOpacity
style={styles.closeBtn}
onPress={()=>setRatingModal(true)}
>

<Text style={styles.closeText}>
Mark as Closed
</Text>

</TouchableOpacity>

)}

{/* Activities */}

<View style={[styles.card,{backgroundColor:theme.card}]}>

<Text style={styles.sectionTitle}>
Activities
</Text>

{comments.map((item)=>(
<View key={item.id} style={styles.commentRow}>

<View style={styles.avatar}>
<Ionicons name="person" size={16} color="#fff"/>
</View>

<View style={{flex:1}}>

<Text style={styles.commentName}>
{item.name}
</Text>

<Text style={styles.commentText}>
{item.remarks}
</Text>

<Text style={styles.time}>
{item.created_at}
</Text>

</View>

</View>
))}

</View>

</ScrollView>

<View style={styles.commentBox}>

<TextInput
placeholder="Enter comment..."
value={message}
onChangeText={setMessage}
style={styles.input}
/>

<TouchableOpacity onPress={sendComment}>
<Ionicons name="send" size={24} color="#1996D3"/>
</TouchableOpacity>

</View>

</KeyboardAvoidingView>

{/* Rating Modal */}

<Modal visible={ratingModal} transparent>

<View style={styles.modalOverlay}>

<View style={styles.modalCard}>

<Text style={styles.modalTitle}>
Rate the Service
</Text>

<View style={{flexDirection:"row",marginVertical:12}}>

{[1,2,3,4,5].map((s)=>(
<TouchableOpacity key={s} onPress={()=>setRating(s)}>

<Ionicons
name={s<=rating?"star":"star-outline"}
size={32}
color="#F59E0B"
/>

</TouchableOpacity>
))}

</View>

<TextInput
placeholder="Write feedback"
value={feedback}
onChangeText={setFeedback}
style={styles.feedbackInput}
multiline
/>

<TouchableOpacity
style={styles.submitBtn}
onPress={submitRating}
>

<Text style={{color:"#fff"}}>
Submit
</Text>

</TouchableOpacity>

</View>

</View>

</Modal>

</SafeAreaView>

);

};

export default ServiceRequestDetailScreen;

const styles = StyleSheet.create({




card:{
borderRadius:10,
padding:16,
marginBottom:14
},

category:{
fontSize:18,
fontWeight:"700"
},

subCategory:{
fontSize:15
},

description:{
marginVertical:8
},

infoRow:{
flexDirection:"row",
justifyContent:"space-between"
},

label:{
color:"#6B7280"
},

value:{
fontWeight:"600"
},

sectionTitle:{
fontSize:16,
fontWeight:"700",
marginBottom:10
},

commentRow:{
flexDirection:"row",
marginBottom:12
},

avatar:{
width:32,
height:32,
borderRadius:20,
backgroundColor:"#1996D3",
justifyContent:"center",
alignItems:"center",
marginRight:10
},

commentName:{
fontWeight:"600"
},

commentText:{
fontSize:13
},

time:{
fontSize:11,
color:"#9CA3AF"
},

commentBox:{
position:"absolute",
bottom:0,
left:0,
right:0,
flexDirection:"row",
alignItems:"center",
padding:10,
backgroundColor:"#fff"
},

input:{
flex:1,
borderRadius:20,
paddingHorizontal:15,
marginRight:10
},

closeBtn:{
backgroundColor:"#22C55E",
padding:14,
borderRadius:8,
alignItems:"center",
marginBottom:14
},

closeText:{
color:"#fff",
fontWeight:"600"
},

modalOverlay:{
flex:1,
backgroundColor:"rgba(0,0,0,0.4)",
justifyContent:"center",
alignItems:"center"
},

modalCard:{
backgroundColor:"#fff",
width:"85%",
borderRadius:12,
padding:20
},

modalTitle:{
fontSize:18,
fontWeight:"600",
textAlign:"center"
},

feedbackInput:{
borderWidth:1,
borderColor:"#ddd",
borderRadius:8,
padding:10,
height:80,
marginVertical:10
},

submitBtn:{
backgroundColor:"#22C55E",
padding:12,
borderRadius:8,
alignItems:"center"
}

});