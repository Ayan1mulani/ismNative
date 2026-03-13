import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL2, APP_VERSION_CODE, APP_ID_ONE_SIGNAL } from '../app/config/env';
import OneSignal from 'react-native-onesignal';
import { ApiCommon } from './ApiCommon';

/* ======================================================
   REGISTER DEVICE WITH BACKEND
====================================================== */
export const RegisterAppOneSignal = async () => {
  try {

    const userInfo = await AsyncStorage.getItem("userInfo");

    if (!userInfo) {
      console.log("❌ No logged in user");
      return false;
    }

    const parsedUser = JSON.parse(userInfo);

    const userId = parsedUser?.id;
    const apiToken = parsedUser?.api_token;
    const societyId = parsedUser?.societyId || parsedUser?.s_id;

    /* Ensure push subscription enabled */
    await OneSignal.User.pushSubscription.optIn();

    const deviceId = OneSignal.User.pushSubscription.id;

    if (!deviceId) {
      console.log("⚠️ OneSignal deviceId not ready yet");
      return false;
    }

    console.log("📱 OneSignal Device ID:", deviceId);

    const headers = {
      "Content-Type": "application/json",
      "ism-auth": JSON.stringify({
        "api-token": apiToken,
        "user-id": userId,
        "site-id": societyId
      })
    };

    const payload = {
      app_name: "enviro_vms",
      app_version_code: APP_VERSION_CODE,
      app_device_id: deviceId,
      userId: userId,
      tenant: 0
    };

    const url = `${API_URL2}/appRegistered?app_id=${APP_ID_ONE_SIGNAL}`;

    const response = await ApiCommon.postReq(url, payload, headers);

    console.log("✅ OneSignal Registered:", response);

    return true;

  } catch (error) {

    console.error("❌ OneSignal register error:", error);

    return false;

  }
};



/* ======================================================
   UNREGISTER DEVICE FROM BACKEND
====================================================== */

export const UnRegisterOneSignal = async () => {

  try {

    const userInfo = await AsyncStorage.getItem('userInfo');

    if (!userInfo) {
      console.log("❌ No stored user");
      return false;
    }

    const parsedUser = JSON.parse(userInfo);

    const userId = parsedUser?.id;
    const apiToken = parsedUser?.api_token;
    const societyId = parsedUser?.societyId || parsedUser?.s_id;

    const deviceId = OneSignal.User.pushSubscription.id;

    if (!deviceId) {
      console.warn("⚠️ OneSignal deviceId missing");
      return false;
    }

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

    console.log("🧹 OneSignal Unregistered:", response);

    /* Disable push locally */
    await OneSignal.User.pushSubscription.optOut();

    return true;

  } catch (error) {

    console.error(
      "❌ OneSignal unregister error:",
      error?.response?.data || error
    );

    return false;

  }
};