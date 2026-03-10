import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL2, APP_VERSION_CODE,APP_ID_ONE_SIGNAL } from '../../app/config/env';
import { OneSignal } from 'react-native-onesignal';



export const RegisterAppOneSignal = async () => {
  try {

    const userInfo = await AsyncStorage.getItem('userInfo');

    if (!userInfo) {
      console.log("⚠️ No user info");
      return false;
    }

    const parsedUserInfo = JSON.parse(userInfo);

    const userId = parsedUserInfo?.data?.id;
    const apiToken = parsedUserInfo?.data?.api_token;
    const societyId = parsedUserInfo?.data?.societyId;

    if (!userId || !apiToken) {
      console.log("⚠️ Invalid user info:", parsedUserInfo);
      return false;
    }

    const deviceId = await OneSignal.User.pushSubscription.getIdAsync();

    if (!deviceId) {
      console.log("⚠️ OneSignal device ID not ready");
      return false;
    }

    const headers = {
      'Content-Type': 'application/json',
      'ism-auth': JSON.stringify({
        'api-token': apiToken,
        'user-id': userId,
        'site-id': societyId
      })
    };

    const body = {
      app_name: "ism_resident",
      app_version_code: APP_VERSION_CODE,
      app_device_id: deviceId,
      userId: deviceId,
      app_id: deviceId,
      tenant: 0
    };

    const params = {
      app_id: APP_ID_ONE_SIGNAL
    };

    await axios.post(`${API_URL2}/appRegistered`, body, { params, headers });

    return true;

  } catch (error) {
    console.error('Error registering app:', error);
    return false;
  }
};