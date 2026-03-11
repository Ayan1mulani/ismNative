import { API_URL2, APP_NAME } from "../app/config/env"
import { ApiCommon } from "./ApiCommon"
import { Common } from "./Common"
import { Util } from "./Util"
import AsyncStorage from "@react-native-async-storage/async-storage"

const ismServices = {

  getMyNotifications: async () => {
    const url = await ismServices.appendParamsInUrl(
      `${API_URL2}/getmynotifications`,
      { cache: 0 }
    );
    const headers = await Util.getCommonAuth();
    return ApiCommon.getReq(url, headers);
  },

  // ✅ KEPT: original function used by other pages
  getUserDetails: async () => {
    const user = await Common.getLoggedInUser();
    if (!user) throw new Error("User not logged in");

    const uObj = {
      user_id: user.unit_id,
      group_id: user.role_id,
      flat_no: user.flat_no,
      unit_id: user.unit_id,
      society_id: user.societyId
    };

    const u = encodeURIComponent(JSON.stringify(uObj));
    let url = `${API_URL2}/userDetailsById/${u}`;
    url = await ismServices.appendParamsInUrl(url);

    const headers = await Util.getCommonAuth();
    const response = await ApiCommon.getReq(url, headers);

    await AsyncStorage.setItem("userDetails", JSON.stringify(response));
    return response;
  },

  // ✅ NEW: fetches full profile including permissions — used by ConetextApi
  getUserProfileData: async () => {
    const user = await Common.getLoggedInUser();

    const url = await ismServices.appendParamsInUrl(
      `${API_URL2}/getUserProfileData`,
      { tenant: user.tenant ?? 0 }
    );

    const headers = await Util.getCommonAuth();
    const response = await ApiCommon.getReq(url, headers);

    return response; // response.data.permissions has the permissions array
  },

  getMyBalance: async () => {
    const user = await Common.getLoggedInUser();

    const url = await ismServices.appendParamsInUrl(
      `${API_URL2}/getOutstandingBalance/${user.id}`,
      {
        cache: 0,
        bill_type: 835
      }
    );

    const headers = await Util.getCommonAuth();
    return ApiCommon.getReq(url, headers);
  },


  generateOtp: async (mobile) => {
    const payload = {
      identity: mobile,
      app_roles: ["member", "resident", "tenant"]
    };
    const url = `${API_URL2}/generateotp`;
    return ApiCommon.postReq(url, payload);
  },

  verifyOtp: async (payload) => {
    try {

      const url = `${API_URL2}/validateotp`;

      const response = await ApiCommon.postReq(url, payload);

      return response;

    } catch (error) {

      console.error("OTP Verify API Error:", error);

      throw error;

    }
  },

  getMyAccounts: async (token) => {
    const url = `${API_URL2}/getmyaccounts?token=${token}`;
    return ApiCommon.getReq(url);
  },


  loginUser: async (data) => {
    try {
      const url = `${API_URL2}/login`;
      return await ApiCommon.postReq(url, data);
    } catch (error) {
      console.error("Login API Error:", error);
      throw error;
    }
  },

  
  // ✅ FIXED
logMeIn: async (token, account) => {
  try {

    // ✅ token in URL, account object in POST body
    const url = `${API_URL2}/logmein?token=${token}`;

    console.log("LOGMEIN URL:", url);
    console.log("LOGMEIN BODY:", JSON.stringify(account));

    const response = await ApiCommon.postReq(url, account);
    return response;

  } catch (error) {
    console.error("logMeIn API Error:", error);
    throw error;
  }
},


  getMyNotices: async (category = "COMMON") => {
    const user = await Common.getLoggedInUser();

    const uObj = {
      user_id: user.unit_id,
      group_id: user.role_id,
      flat_no: user.flat_no,
      unit_id: user.unit_id,
      society_id: user.societyId
    };

    const url =
      `${API_URL2}/myNotices` +
      `?api-token=${user.api_token}` +
      `&user-id=${encodeURIComponent(JSON.stringify(uObj))}` +
      `&category=${category}`;

    const headers = await Util.getCommonAuth();
    return ApiCommon.getReq(url, headers);
  },

  getFacilityStaffCategory: async () => {
    const user = await Common.getLoggedInUser();
    if (!user) throw new Error("User not logged in");

    const url = await ismServices.appendParamsInUrl(
      `${API_URL2}/society/${user.societyId}/constant`,
      { type: "FACILITY_STAFF_CATEGORY" }
    );

    const headers = await Util.getCommonAuth();
    return ApiCommon.getReq(url, headers);
  },

  // 🔥 Common param handler
  appendParamsInUrl: async (url, extraParams = {}) => {
    const user = await Common.getLoggedInUser();

    const uObj = {
      user_id: user.unit_id,
      group_id: user.role_id,
      flat_no: user.flat_no,
      unit_id: user.unit_id,
      society_id: user.societyId
    };

    const u = JSON.stringify(uObj);

    const commonParams = {
      "api-token": user.api_token,
      "user-id": u,
      "group-id": user.role_id,
      "app_id": "ism_resident"
    };

    const finalParams = {
      ...commonParams,
      ...extraParams
    };

    const queryParams = Object.keys(finalParams)
      .filter(key => finalParams[key] !== null && finalParams[key] !== undefined)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(finalParams[key])}`)
      .join("&");

    if (queryParams) {
      url += url.includes("?") ? "&" : "?";
      url += queryParams;
    }

    return url;
  }

};

export { ismServices };