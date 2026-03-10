import AsyncStorage from "@react-native-async-storage/async-storage";
import { OneSignal } from "react-native-onesignal";
import { API_URL2 } from "@env";
import { ApiCommon } from "./ApiCommon";

export const UnRegisterOneSignal = async () => {
  try {

    const userInfo = await AsyncStorage.getItem("userInfo");
    if (!userInfo) return;

    const parsed = JSON.parse(userInfo);

    const userId = parsed?.data?.id || parsed?.id;
    const apiToken = parsed?.data?.api_token || parsed?.api_token;
    const societyId = parsed?.data?.societyId || parsed?.societyId;

    const deviceId = await OneSignal.User.pushSubscription.getIdAsync();

    if (!deviceId) return;

    const headers = {
      "Content-Type": "application/json",
      "ism-auth": JSON.stringify({
        "api-token": apiToken,
        "user-id": userId,
        "site-id": societyId
      })
    };

    const payload = {
      userId: deviceId,
      tenant: 0
    };

    const url = `${API_URL2}/appUnRegistered`;

    const response = await ApiCommon.postReq(url, payload, headers);

    console.log("🔕 OneSignal Unregistered:", response);

  } catch (error) {
    console.log("❌ Unregister error:", error);
  }
};