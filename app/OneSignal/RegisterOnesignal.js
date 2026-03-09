import AsyncStorage from "@react-native-async-storage/async-storage";
import { OneSignal } from "react-native-onesignal";
import { API_URL2, APP_VERSION_CODE, APP_ID_ONE_SIGNAL } from "../config/env";
import { ApiCommon } from "./ApiCommon";

export const RegisterAppOneSignal = async () => {
  try {

    const userInfo = await AsyncStorage.getItem("userInfo");
    if (!userInfo) return false;

    const parsedUserInfo = JSON.parse(userInfo);

    const userId = parsedUserInfo?.data?.id;
    const apiToken = parsedUserInfo?.data?.api_token;
    const societyId = parsedUserInfo?.data?.societyId;

    const deviceId = await OneSignal.User.pushSubscription.getIdAsync();

    if (!deviceId) {
      console.log("⚠️ OneSignal Device ID not ready");
      return false;
    }

    console.log("📱 OneSignal Player ID:", deviceId);

    const headers = {
      "Content-Type": "application/json",
      "ism-auth": JSON.stringify({
        "api-token": apiToken,
        "user-id": userId,
        "site-id": societyId
      })
    };

    const payload = {
      app_name: "ism-staff",
      app_version_code: APP_VERSION_CODE,
      app_device_id: deviceId,
      userId: deviceId, // IMPORTANT
      tenant: 0
    };

    const url = `${API_URL2}/appRegistered?app_id=${APP_ID_ONE_SIGNAL}`;

    const response = await ApiCommon.postReq(url, payload, headers);

    console.log("✅ OneSignal Registered:", response);

    return true;

  } catch (error) {
    console.log("❌ OneSignal Register Error:", error);
    return false;
  }
};