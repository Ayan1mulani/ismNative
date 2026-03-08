import { ApiCommon } from "./ApiCommon"
import { Common } from "./Common";
import { Util } from "./Util";
import { API_URL2, API_URL4  } from "../app/config/env";

const visitorServices = {

  getMyVisitors: async () => {
    const user = await Common.getLoggedInUser()
    const params = {
      "api-token": user.api_token,
      "user-id": user.id,
    };
    const paylod = {
      input: "",
      residentId: user.id
    }
    const url = await visitorServices.appendParamsInUrl(`${API_URL4}/v1/society/${user.societyId}/getVisitsForResident`);
    const headers = await Util.getCommonAuth()
    const response = await ApiCommon.postReq(url, paylod, headers);
    return response
  },

  getParkingBookings: async () => {
    const user = await Common.getLoggedInUser();

    const url = await visitorServices.appendParamsInUrl(
      `${API_URL2}/society/${user.societyId}/bookings`
    );

    const headers = await Util.getCommonAuth();

    return ApiCommon.getReq(url, headers);
  },
  getMyPasses: async () => {
    const user = await Common.getLoggedInUser()
    const params = {
      "api-token": user.api_token,
      "user-id": user.id,
    };
    const paylod = {
      input: "",
      residentId: user.id
    }
    const url = await visitorServices.appendParamsInUrl(`${API_URL4}/v1/society/${user.societyId}/searchPass`);
    const headers = await Util.getCommonAuth()
    const response = await ApiCommon.postReq(url, paylod, headers);
    return response
  },

  getParkingLocations: async () => {
    const user = await Common.getLoggedInUser();

    const url = await visitorServices.appendParamsInUrl(
      `${API_URL2}/${user.societyId}/locations`,
      { type: "PARKING" }
    );


    const headers = await Util.getCommonAuth();

    return ApiCommon.getReq(url, headers);
  },

  getParkingFormFields: async () => {
    const user = await Common.getLoggedInUser();

    const url = await visitorServices.appendParamsInUrl(
      `${API_URL2}/${user.society_id}/getfields?form_id=769`
    );


    const headers = await Util.getCommonAuth();

    const res = await ApiCommon.getReq(url, headers);


    return res;
  },


  visitAttended: async (visitId, attendedValue) => {
    const user = await Common.getLoggedInUser();
    const uObj = {
      user_id: user.unit_id,
      group_id: user.role_id,
      flat_no: user.flat_no,
      unit_id: user.unit_id,
      society_id: user.societyId
    };


    const url = await visitorServices.appendParamsInUrl(
      `${API_URL4}/v1/society/${uObj.society_id}/visitAttended`
    );

    const payload = {
      attended: attendedValue,
      visit_id: visitId,
    };

    const headers = await Util.getCommonAuth();

    return ApiCommon.postReq(url, payload, headers);
  },



  bookParking: async (payload) => {
    const user = await Common.getLoggedInUser();

    const url = await visitorServices.appendParamsInUrl(
      `${API_URL2}/${user.societyId}/my/bookLocation`
    );

    const headers = await Util.getCommonAuth();

    return ApiCommon.postReq(url, payload, headers);
  },




  addMyVisitor: async (data) => {
    const user = await Common.getLoggedInUser()
    const url = await visitorServices.appendParamsInUrl(
      `${API_URL4}/v2/society/${user.societyId}/createallpass`

    )

    const headers = await Util.getCommonAuth()



    return ApiCommon.postReq(url, data, headers)
  },




  getStaffCategories: async () => {
    const user = await Common.getLoggedInUser()
    const params = {
      "api-token": user.api_token,
      "user-id": user.id,
    };

    const url = visitorServices.appendParamsInUrl(`${API_URL4}/v1/society/${user.societyId}/allstaffcategory`, params);
    const headers = await Util.getCommonAuth()
    const response = await ApiCommon.getReq(url, headers);
    return response
  },

  addFamilyMember: async (memberData) => {
    try {
      const user = await Common.getLoggedInUser();

      // Build URL with common params
      const url = await visitorServices.appendParamsInUrl(
        `${API_URL2}/addFamilyMember`
      );

      const headers = await Util.getCommonAuth();

      // Payload exactly as backend expects
      const payload = {
        name: memberData.name,
        phone_no: memberData.phone_no,
        email: memberData.email,
        relation: memberData.relation,
        vehicle_no: memberData.vehicle_no,
        image_src: memberData.image_src || null,
      };

      const response = await ApiCommon.postReq(url, payload, headers);

      return response;
    } catch (error) {
      console.log("Add Family Member Error:", error);
      throw error;
    }
  },
  getFamilyMembers: async () => {
    try {
      const user = await Common.getLoggedInUser();

      const userObj = {
        user_id: user.unit_id,
        group_id: user.role_id,
        flat_no: user.flat_no,
        unit_id: user.unit_id,
        society_id: user.societyId,
      };

      const encodedUser = encodeURIComponent(JSON.stringify(userObj));

      const url = `${API_URL2}/${user.societyId}/${encodedUser}/members?api-token=${user.api_token}&user-id=${encodedUser}`;

      const headers = await Util.getCommonAuth();

      const response = await ApiCommon.getReq(url, headers);

      return response;

    } catch (error) {
      console.log("Get Family Members Error:", error);
      throw error;
    }
  },

  getMyStaffs: async (category) => {
    const user = await Common.getLoggedInUser()
    const params = {
      "api-token": user.api_token,
      "user-id": user.id,
      "category": category || null,
    };

    const url = visitorServices.appendParamsInUrl(`${API_URL4}/v1/society/${user.societyId}/staffbycategory`, params);
    const headers = await Util.getCommonAuth()
    const response = await ApiCommon.getReq(url, headers);
    return response
  },

  cancelPass: async (passId) => {
    const user = await Common.getLoggedInUser();

    const url = await visitorServices.appendParamsInUrl(
      `${API_URL4}/v2/society/${user.societyId}/cancelpass`
    );

    const headers = await Util.getCommonAuth();

    const payload = {
      id: passId,
    };

    return ApiCommon.postReq(url, payload, headers);
  },

  updateFamilyMember: async (memberData) => {
    try {

      const user = await Common.getLoggedInUser();

      const url = await visitorServices.appendParamsInUrl(
        `${API_URL2}/updatefamilymember`
      );

      const headers = await Util.getCommonAuth();

      const payload = {
        id: memberData.id,
        name: memberData.name,
        phone_no: memberData.phone_no,
        email: memberData.email,
        relation: memberData.relation,
        vehicle_no: memberData.vehicle_no,
        image_src: memberData.image_src || null,
      };

      return ApiCommon.putReq(url, payload, headers);

    } catch (error) {
      console.log("Update Member Error:", error);
      throw error;
    }
  },
  deleteFamilyMember: async (memberId) => {
    try {

      const url = await visitorServices.appendParamsInUrl(
        `${API_URL2}/deleteFamilyMember/${memberId}`
      );

      const headers = await Util.getCommonAuth();

      return ApiCommon.delReq(url, null, headers);

    } catch (error) {
      console.log("Delete Member Error:", error);
      throw error;
    }
  },
  appendParamsInUrl: async (url, extraParams = {}) => {
    const user = await Common.getLoggedInUser()

    const uObj = {
      user_id: user.unit_id,
      group_id: user.role_id,
      flat_no: user.flat_no,
      unit_id: user.unit_id,
      society_id: user.societyId
    };

    const u = JSON.stringify(uObj); // ✅ no encode

    const commonParams = {
      "api-token": user.api_token,
      "user-id": u,
      "group-id": 2265,
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

export { visitorServices }