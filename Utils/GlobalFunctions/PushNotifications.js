import { OneSignal, LogLevel } from "react-native-onesignal";
import { APP_ID_ONE_SIGNAL } from "../../app/config/env";

const getOneSignalId = async () => {
  try {
    const id = await OneSignal.User.getOnesignalId();
  } catch (error) {
    console.error('Error getting OneSignal ID:', error);
  }
};

// Example to get External ID
const getExternalId = async () => {
  try {
    const id = await OneSignal.User.getExternalId();
  } catch (error) {
    console.error('Error getting External ID:', error);
  }
};

// Example to get Push Subscription ID and Token
const getPushId = async () => {
  try {
    const id = await OneSignal.User.pushSubscription.getIdAsync();
    const token = await OneSignal.User.pushSubscription.getTokenAsync();
  } catch (error) {
    console.error('Error getting Push ID:', error);
  }
};

const onesignalInitalize = async () => {
  // Set log level for debugging strictly to NO so no debugging is enabled
OneSignal.Debug.setLogLevel(LogLevel.None); 
  // Initialize with your OneSignal App ID
  OneSignal.initialize(APP_ID_ONE_SIGNAL);
  OneSignal.InAppMessages.setPaused(true); 
  // Request push notification permission
  await OneSignal.Notifications.requestPermission(false);
  
  // Get Push ID and Token
  await getPushId();

  // Log in with a user ID (example: "2165")
  OneSignal.login("2165");
  

  // Get OneSignal ID and External ID
  await getOneSignalId();
  await getExternalId();
// OneSignal.setLogLevel(LogLevel.Debug, LogLevel.Debug);
  // Check notification permissions (optional)
  const permissionStatus = await OneSignal.Notifications.getPermissionAsync();
};

export default onesignalInitalize;