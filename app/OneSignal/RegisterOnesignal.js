export const RegisterAppOneSignal = async () => {
  try {

    const userInfo = await AsyncStorage.getItem("userInfo");
    if (!userInfo) return false;

    const parsedUserInfo = JSON.parse(userInfo);

    const userId = parsedUserInfo.data.id;
    const apiToken = parsedUserInfo.data.api_token;
    const societyId = parsedUserInfo.data.societyId;

    const deviceId = await OneSignal.User.pushSubscription.getIdAsync();

    if (!deviceId) {
      console.log("OneSignal deviceId not ready");
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

    const body = {
      app_name: "ism-staff",
      app_version_code: APP_VERSION_CODE,
      app_device_id: deviceId,
      userId: userId,
      tenant: 0
    };

    await axios.post(`${API_URL2}/appRegistered`, body, {
      params: { app_id: APP_ID_ONE_SIGNAL },
      headers
    });

    return true;

  } catch (error) {
    console.log("Register OneSignal Error:", error);
    return false;
  }
};