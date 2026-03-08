import { API_URL2 } from "../app/config/env"
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

  getUserDetails: async () => {
    const user = await Common.getLoggedInUser()

    const uObj = {
      user_id: user.unit_id,
      group_id: user.role_id,
      flat_no:  user.flat_no,
      unit_id: user.unit_id,
      society_id: user.societyId
    };

    // ✅ stringify ONCE
    const u = encodeURIComponent(JSON.stringify(uObj));


    // 👇 build base url
    let url = `${API_URL2}/userDetailsById/${u}`;

    // 👇 pass primitive string, not object
    url = await ismServices.appendParamsInUrl(url);


    const headers = await Util.getCommonAuth();
    const response = await ApiCommon.getReq(url, headers);

    await AsyncStorage.setItem("userDetails", JSON.stringify(response));
    return response;
  },

  getMyBalance: async () => {
    const user = await Common.getLoggedInUser()

    const url = await ismServices.appendParamsInUrl(
      `${API_URL2}/getOutstandingBalance/${user.id}`,
      {
        cache: 0,
        bill_type: 835
      }
    )

    const headers = await Util.getCommonAuth()
    return ApiCommon.getReq(url, headers)
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

  const url = await ismServices.appendParamsInUrl(
    `${API_URL2}/society/${user.societyId}/constant`,
    {
      type: "FACILITY_STAFF_CATEGORY"
    }
  );

  const headers = await Util.getCommonAuth();
  return ApiCommon.getReq(url, headers);
},

  // 🔥 Common param handler
  appendParamsInUrl: async (url, extraParams = {}) => {
    const user = await Common.getLoggedInUser()

    const uObj = {
      user_id: user.unit_id,
      group_id: user.role_id,
      flat_no:  user.flat_no,
      unit_id: user.unit_id,
      society_id: user.societyId
    };


    const u = JSON.stringify(uObj); // ✅ no encode

   const commonParams = {
  "api-token": user.api_token,
  "user-id": u,
  "group-id": user.role_id,   // dynamic
  "app_id": "ism_resident"
};

    const finalParams = {
      ...commonParams,
      ...extraParams
    };

    const queryParams = Object.keys(finalParams)
      .filter(key => finalParams[key] !== null && finalParams[key] !== undefined)
      .map(
        key =>
          `${encodeURIComponent(key)}=${encodeURIComponent(finalParams[key])}`
      )
      .join("&");

    if (queryParams) {
      url += url.includes("?") ? "&" : "?";
      url += queryParams;
    }

    return url;
  }

}

export { ismServices }
