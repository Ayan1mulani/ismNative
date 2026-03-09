import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL2, APP_VERSION_CODE, APP_ID_ONE_SIGNAL } from '../app/config/env';
import { OneSignal } from 'react-native-onesignal';
import { ApiCommon } from './ApiCommon';

export const RegisterAppOneSignal = async () => {
  try {
    const userInfo = await AsyncStorage.getItem('userInfo');
    if (!userInfo) return;

    const parsedUserInfo = JSON.parse(userInfo);

    const userId = parsedUserInfo.id;
    const apiToken = parsedUserInfo.api_token;
    const societyId = parsedUserInfo.societyId || parsedUserInfo.s_id;

    if (!userId || !apiToken) {
      console.warn('OneSignal: Missing user credentials');
      return;
    }

    const deviceId = await OneSignal.User.pushSubscription.getIdAsync();

    if (!deviceId) {
      console.warn('OneSignal: Device ID not ready');
      return;
    }

    console.log('OneSignal Device ID:', deviceId);

    const headers = {
      "Content-Type": "application/json",
      "ism-auth": JSON.stringify({
        "api-token": apiToken,
        "user-id": userId,
        "site-id": societyId
      })
    };

    const payload = {
      app_name: "ism-resident",
      app_version_code: APP_VERSION_CODE,
      app_device_id: deviceId,
      userId: userId,
      tenant: 0
    };

    const url = `${API_URL2}/appRegistered?app_id=${APP_ID_ONE_SIGNAL}`;

    const response = await ApiCommon.postReq(url, payload, headers);

    console.log("OneSignal Registered:", response);

    return true;

  } catch (error) {
    console.error("OneSignal register error:", error);
    return false;
  }
};


export const appUnRegistered = async () => {
  try {

    const userInfo = await AsyncStorage.getItem('userInfo');
    if (!userInfo) return;

    const parsedUserInfo = JSON.parse(userInfo);

    const userId = parsedUserInfo.id;
    const apiToken = parsedUserInfo.api_token;
    const societyId = parsedUserInfo.societyId || parsedUserInfo.s_id;

    const deviceId = await OneSignal.User.pushSubscription.getIdAsync();

    if (!deviceId) {
      console.warn("OneSignal deviceId missing");
      return;
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

    console.log("OneSignal Unregistered:", response);

    return true;

  } catch (error) {
    console.error("OneSignal unregister error:", error);
    return false;
  }
};