import { API_URL2, API_URL4 } from "../app/config/env"
import { ApiCommon } from "./ApiCommon"
import { Common } from "./Common";
import { Util } from "./Util";
import { OneSignal } from "react-native-onesignal";
import { visitorServices } from "./visitorServices";

const otherServices = {

  getOutStandings: async () => {
    const user = await Common.getLoggedInUser()
    const params = {
      "api-token": user.api_token,
      "user-id": user.id,
    };

    const url = otherServices.appendParamsInUrl(`${API_URL2}/my/outstandingbalances`, params);
    const headers = await Util.getCommonAuth()
    const response = await ApiCommon.getReq(url, headers);
    return response
  },

  getAmenityBookingsById: async (amenityId) => {
    try {
      const user = await Common.getLoggedInUser();

      const userObj = {
        user_id: user.id,
        group_id: user.role_id,
        flat_no: user.flat_no,
        unit_id: user.unit_id,
        society_id: user.societyId,
      };

      const encodedUser = encodeURIComponent(
        JSON.stringify(userObj)
      );

      const url = `${API_URL2}/${user.societyId}/${amenityId}/bookings?api-token=${user.api_token}&user-id=${encodedUser}`;

      const headers = await Util.getCommonAuth();

      return await ApiCommon.getReq(url, headers);

    } catch (error) {
      console.log("Get Amenity Bookings Error:", error);
      throw error;
    }
  },
  // CORRECTED sendFeedback function
  getAmenityBookingsByDate: async (locationId, date) => {
    try {
      const user = await Common.getLoggedInUser();

      const userObj = {
        user_id: user.id,
        group_id: user.role_id,
        flat_no: user.flat_no,
        unit_id: user.unit_id,
        society_id: user.societyId,
      };

      const encodedUser = encodeURIComponent(
        JSON.stringify(userObj)
      );

      const url = `${API_URL2}/${user.societyId}/${locationId}/bookings/${date}?api-token=${user.api_token}&user-id=${encodedUser}`;

      const headers = await Util.getCommonAuth();

      return await ApiCommon.getReq(url, headers);

    } catch (error) {
      console.log("Get bookings by date error:", error);
      throw error;
    }
  },

  sendTestNotification: async () => {
  try {

    console.log("🚀 Sending Test Notification...");

    /* -------------------------------
       GET LOGGED IN USER
    -------------------------------- */
    const user = await Common.getLoggedInUser();

    console.log("👤 Logged In User:", user);

    /* -------------------------------
       GET ONESIGNAL DEVICE ID
    -------------------------------- */
    let osid = await OneSignal.User.pushSubscription.getIdAsync();

    // Sometimes OneSignal is not ready immediately
    if (!osid) {
      console.log("⚠️ Device ID not ready, waiting 2 seconds...");

      await new Promise(resolve => setTimeout(resolve, 2000));

      osid = await OneSignal.User.pushSubscription.getIdAsync();
    }

    if (!osid) {
      console.log("❌ OneSignal device ID not found");
      return;
    }

    console.log("📱 Device ID being sent:", osid);

    /* -------------------------------
       PARSE USER ID
    -------------------------------- */

    let parsedUserId;

    try {
      // user.id may be JSON string
      parsedUserId = JSON.parse(user.id).user_id;
    } catch (e) {
      // or may already be number
      parsedUserId = user.unit_id || user.id;
    }

    console.log("🆔 Parsed User ID:", parsedUserId);

    /* -------------------------------
       BUILD API URL
    -------------------------------- */

    const apiUrl =
      `${API_URL4}/v1/society/${user.societyId}/resident/${parsedUserId}/testnotifyring` +
      `?api-token=${user.api_token}` +
      `&user-id=${parsedUserId}` +
      `&deviceid=${osid}`;

    console.log("🌐 Final API URL:", apiUrl);

    /* -------------------------------
       HEADERS
    -------------------------------- */

    const headers = await Util.getCommonAuth();

    /* -------------------------------
       PAYLOAD
    -------------------------------- */

    const payload = {
      test: true
    };

    /* -------------------------------
       API CALL
    -------------------------------- */

    const response = await ApiCommon.postReq(apiUrl, payload, headers);

    console.log("✅ Test Notification Response:", response);

    return response;

  } catch (error) {

    console.log("❌ Test Notification Error:", error);

    throw error;

  }
},


  sendFeedback: async (subject, body) => {
    try {
      const user = await Common.getLoggedInUser();

      const userObj = {
        user_id: user.id,
        group_id: user.role_id,
        flat_no: user.flat_no,
        unit_id: user.unit_id,
        society_id: user.societyId,
      };

      const params = {
        "api-token": user.api_token,
        "user-id": JSON.stringify(userObj),
      };

      const url = otherServices.appendParamsInUrl(
        `${API_URL2}/sendFeedback`,
        params
      );

      const headers = await Util.getCommonAuth();

      const payload = {
        emailSubject: subject,
        emailBody: body,
        user: userObj,
      };

      return await ApiCommon.postReq(url, payload, headers);

    } catch (error) {
      console.log("Send Feedback Error:", error);
      throw error;
    }
  },

  getUserDetail: async () => {
    const user = await Common.getLoggedInUser();




    const url = otherServices.appendParamsInUrl(
      `${API_URL2}/userDetail`,

      {
        "api-token": user.api_token,
        "user-id": JSON.stringify({
          user_id: user.id,
          group_id: user.role_id,
          flat_no: user.flat_no,
          unit_id: user.unit_id,
          society_id: user.societyId
        })
      }
    );


    const headers = await Util.getCommonAuth();
    return ApiCommon.getReq(url, headers);
  },

  updateUserSettings: async (payload) => {
    const user = await Common.getLoggedInUser();

    const url = otherServices.appendParamsInUrl(
      `${API_URL2}/updateUser`,
      {
        "api-token": user.api_token,
        "user-id": JSON.stringify({
          user_id: user.id,
          group_id: user.role_id,
          flat_no: user.flat_no,
          unit_id: user.unit_id,
          society_id: user.societyId
        })
      }
    );

    const headers = await Util.getCommonAuth();
    return ApiCommon.putReq(url, payload, headers);
  },
  getMyAccounts: async () => {
    const user = await Common.getLoggedInUser()
    const params = {
      "api-token": user.api_token,
      "user-id": user.id,
    };

    const url = otherServices.appendParamsInUrl(`${API_URL2}/billing/houseStatement/439139/1/100`, params);
    const headers = await Util.getCommonAuth()
    const response = await ApiCommon.getReq(url, headers);
    return response
  },

  getBillsByFlat: async () => {
    try {
      const user = await Common.getLoggedInUser();

      const userObj = {
        user_id: user.id,
        group_id: user.role_id,
        flat_no: user.flat_no,
        unit_id: user.unit_id,
        society_id: user.societyId,
      };

      const encodedUser = encodeURIComponent(
        JSON.stringify(userObj)
      );

      const url = `${API_URL2}/getBillsByFlat/${user.flat_no}?api-token=${user.api_token}&user-id=${encodedUser}`;

      const headers = await Util.getCommonAuth();

      return await ApiCommon.getReq(url, headers);

    } catch (error) {
      console.log("Get Bills By Flat Error:", error);
      throw error;
    }
  },
  getAmenities: async () => {
    try {
      const user = await Common.getLoggedInUser();

      const userObj = {
        user_id: user.id,
        group_id: user.role_id,
        flat_no: user.flat_no,
        unit_id: user.unit_id,
        society_id: user.societyId,
      };

      const encodedUser = encodeURIComponent(
        JSON.stringify(userObj)
      );

      const url = `${API_URL2}/${user.societyId}/locations?api-token=${user.api_token}&user-id=${encodedUser}&type=AMENITY`;

      const headers = await Util.getCommonAuth();

      const response = await ApiCommon.getReq(url, headers);

      return response?.data || [];

    } catch (error) {
      console.log("Get Amenities Error:", error);
      throw error;
    }
  },

  bookAmenity: async (locationId, bookingFrom, bookingTo, type) => {
    try {
      const user = await Common.getLoggedInUser();

      const userObj = {
        user_id: user.id,
        group_id: user.role_id,
        flat_no: user.flat_no,
        unit_id: user.unit_id,
        society_id: user.societyId,
      };

      const encodedUser = encodeURIComponent(JSON.stringify(userObj));

      const url = `${API_URL2}/${user.societyId}/my/bookLocation?api-token=${user.api_token}&user-id=${encodedUser}`;

      const headers = await Util.getCommonAuth();

      let payload;

      if (type === "PARKING") {
        payload = {
          location_id: locationId,
          booking_from: bookingFrom,
          booking_to: bookingTo,
          reference_id: 0,
          status: 1,
          data: {
            name: user.name || "Resident",
            phone_no: user.mobile || "",
            vehicle_no: "",
            date: bookingFrom.split(" ")[0],
            type: "PARKING",
            openModal: true,
            pass_id: "",
          },
        };
      } else {
        payload = {
          location_id: locationId,
          booking_from: bookingFrom,
          booking_to: bookingTo,
          data: {
            date: new Date().toISOString(),
            type: "AMENITY",
            openModal: false,
            pass_id: "",
          },
        };
      }

      console.log("BOOK PAYLOAD:", payload);

      return await ApiCommon.postReq(url, payload, headers);

    } catch (error) {
      console.log("Booking Error:", error);
      throw error;
    }
  },
  getMyAmenityBookings: async () => {
    try {
      const user = await Common.getLoggedInUser();

      const userObj = {
        user_id: user.id,
        group_id: user.role_id,
        flat_no: user.flat_no,
        unit_id: user.unit_id,
        society_id: user.societyId,
      };

      const url = `${API_URL2}/my/bookings?api-token=${user.api_token
        }&user-id=${encodeURIComponent(
          JSON.stringify(userObj)
        )}&location=1&page=1`;

      const headers = await Util.getCommonAuth();

      return await ApiCommon.getReq(url, headers);
    } catch (error) {
      console.log("Get My Bookings Error:", error);
      throw error;
    }
  },

  checkSlotAvailability: async (locationId, from, to) => {
    try {
      const user = await Common.getLoggedInUser();

      const userObj = {
        user_id: user.id,
        group_id: user.role_id,
        flat_no: user.flat_no,
        unit_id: user.unit_id,
        society_id: user.societyId,
      };

      const encodedUser = encodeURIComponent(JSON.stringify(userObj));

      const url = `${API_URL2}/${user.societyId}/${locationId}/bookedslots?api-token=${user.api_token}&user-id=${encodedUser}&from=${from}&to=${to}`;

      const headers = await Util.getCommonAuth();

      return await ApiCommon.getReq(url, headers);

    } catch (error) {
      console.log("Check Slot Availability Error:", error);
      throw error;
    }
  },


  getStaffByCategory: async (category) => {
    try {
      const user = await Common.getLoggedInUser();

      const userObj = {
        user_id: user.id,
        group_id: user.role_id,
        flat_no: user.flat_no,
        unit_id: user.unit_id,
        society_id: user.societyId,
      };

      const params = {
        "api-token": user.api_token,
        "user-id": JSON.stringify(userObj),
        category: category,
      };

      // Build URL
      const url = otherServices.appendParamsInUrl(
        `${API_URL4}/v1/society/${user.societyId}/staffbycategory`,
        params
      );

      const headers = await Util.getCommonAuth();
      const response = await ApiCommon.getReq(url, headers);

      return response;
    } catch (error) {
      console.log("Get Staff By Category Error:", error);
      throw error;
    }
  },


  getStaffCategories: async () => {
    try {
      const user = await Common.getLoggedInUser();

      const userObj = {
        user_id: user.id,
        group_id: user.role_id,
        flat_no: user.flat_no,
        unit_id: user.unit_id,
        society_id: user.societyId,
      };

      const params = {
        "api-token": user.api_token,
        "user-id": JSON.stringify(userObj),
      };

      const url = otherServices.appendParamsInUrl(
        `${API_URL4}/v1/society/${user.societyId}/allstaffcategory`,
        params
      );

      const headers = await Util.getCommonAuth();

      return await ApiCommon.getReq(url, headers);

    } catch (error) {
      console.log("Get Staff Categories Error:", error);
      throw error;
    }
  },
  addVehicle: async (vehicleData) => {
    try {
      const user = await Common.getLoggedInUser();

      const userObj = {
        user_id: user.id,
        group_id: user.role_id,
        flat_no: user.flat_no,
        unit_id: user.unit_id,
        society_id: user.societyId,
      };

      const params = {
        "api-token": user.api_token,
        "user-id": JSON.stringify(userObj),
      };

      const url = otherServices.appendParamsInUrl(
        `${API_URL2}/my/vehicle`,
        params
      );

      const headers = await Util.getCommonAuth();

      const response = await ApiCommon.putReq(
        url,
        vehicleData,
        headers
      );

      return response;

    } catch (error) {
      console.log("Add Vehicle Error:", error);
      throw error;
    }
  },

  getMyVehicles: async () => {
    const user = await Common.getLoggedInUser();

    const userObj = {
      user_id: user.id,
      group_id: user.role_id,
      flat_no: user.flat_no,
      unit_id: user.unit_id,
      society_id: user.societyId,
    };

    const url = `${API_URL2}/my/vehicles?api-token=${user.api_token
      }&user-id=${encodeURIComponent(JSON.stringify(userObj))}`;

    const headers = await Util.getCommonAuth();
    return ApiCommon.getReq(url, headers);
  },

  updateVehicle: async (vehicleId, payload) => {
    const user = await Common.getLoggedInUser();

    const userObj = {
      user_id: user.id,
      group_id: user.role_id,
      flat_no: user.flat_no,
      unit_id: user.unit_id,
      society_id: user.societyId,
    };

    const url = `${API_URL2}/my/vehicle/${vehicleId}?api-token=${user.api_token
      }&user-id=${encodeURIComponent(JSON.stringify(userObj))}`;

    const headers = await Util.getCommonAuth();

    return ApiCommon.postReq(url, payload, headers);
  },
  getVehicleLogs: async ({
    vehicleId,
    from,
    to,
    getAll = 1,
  }) => {
    try {
      const user = await Common.getLoggedInUser();

      const userObj = {
        user_id: user.id,
        group_id: user.role_id,
        flat_no: user.flat_no,
        unit_id: user.unit_id,
        society_id: user.societyId,
      };

      const params = {
        "api-token": user.api_token,
        "user-id": JSON.stringify(userObj),
        from,
        to,
        vehicle_id: vehicleId,
        get_all: getAll,
      };

      const url = otherServices.appendParamsInUrl(
        `${API_URL2}/my/vehicle/log`,
        params
      );

      const headers = await Util.getCommonAuth();

      const response = await ApiCommon.getReq(url, headers);

      return response;

    } catch (error) {
      console.log("Vehicle Logs Error:", error);
      throw error;
    }
  },

  toggleVehicleSubscription: async (vehicleId, isSubscribed) => {
    try {
      const user = await Common.getLoggedInUser();

      const userObj = {
        user_id: user.id,
        group_id: user.role_id,
        flat_no: user.flat_no,
        unit_id: user.unit_id,
        society_id: user.societyId,
      };

      const url = `${API_URL2}/my/vehiclesubscription?api-token=${user.api_token
        }&user-id=${encodeURIComponent(JSON.stringify(userObj))}`;

      const headers = await Util.getCommonAuth();

      const payload = {
        id: vehicleId,
        is_subscribed: isSubscribed,
      };

      return await ApiCommon.postReq(url, payload, headers);

    } catch (error) {
      console.log("Toggle subscription error:", error);
      throw error;
    }
  },

  toggleVehicleAccess: async (vehicleId, payload) => {
    try {
      const user = await Common.getLoggedInUser();

      const userObj = {
        user_id: user.id,
        group_id: user.role_id,
        flat_no: user.flat_no,
        unit_id: user.unit_id,
        society_id: user.societyId,
      };

      const url = `${API_URL2}/my/vehicletagautolock/${vehicleId}?api-token=${user.api_token
        }&user-id=${encodeURIComponent(JSON.stringify(userObj))}`;

      const headers = await Util.getCommonAuth();

      return await ApiCommon.postReq(url, payload, headers);

    } catch (error) {
      console.log("Vehicle Access toggle error:", error);
      throw error;
    }
  },
  getMyNotices: async (category = "") => {
    try {
      const user = await Common.getLoggedInUser();

      const userObj = {
        user_id: user.id,
        group_id: user.role_id,
        flat_no: user.flat_no,
        unit_id: user.unit_id,
        society_id: user.societyId,
      };

      const params = {
        "api-token": user.api_token,
        "user-id": JSON.stringify(userObj),
        category: category, // can be empty string
      };

      const url = otherServices.appendParamsInUrl(
        `${API_URL2}/myNotices`,
        params
      );

      const headers = await Util.getCommonAuth();

      const response = await ApiCommon.getReq(url, headers);

      return response;

    } catch (error) {
      console.log("Get My Notices Error:", error);
      throw error;
    }
  },

  getPanicContacts: async () => {
    try {
      const user = await Common.getLoggedInUser();

      const userObj = {
        user_id: user.id,
        group_id: user.role_id,
        flat_no: user.flat_no,
        unit_id: user.unit_id,
        society_id: user.societyId,
      };

      const params = {
        "api-token": user.api_token,
        "user-id": JSON.stringify(userObj),
      };

      const url = otherServices.appendParamsInUrl(
        `${API_URL2}/paniccontacts`,
        params
      );

      const headers = await Util.getCommonAuth();

      // Empty body because API expects {}
      return await ApiCommon.postReq(url, {}, headers);

    } catch (error) {
      console.log("Get Panic Contacts Error:", error);
      throw error;
    }
  },

  sendPanicAlert: async (type) => {
    try {
      const user = await Common.getLoggedInUser();

      const userObj = {
        user_id: user.id,
        group_id: user.role_id,
        flat_no: user.flat_no,
        unit_id: user.unit_id,
        society_id: user.societyId,
      };

      const params = {
        "api-token": user.api_token,
        "user-id": JSON.stringify(userObj),
      };

      const url = otherServices.appendParamsInUrl(
        `${API_URL2}/panic`,
        params
      );

      const headers = await Util.getCommonAuth();

      const payload = {
        type: type, // FIRE / THEFT / LIFT / EMERGENCY
      };

      return await ApiCommon.postReq(url, payload, headers);

    } catch (error) {
      console.log("Send Panic Error:", error);
      throw error;
    }
  },

  createOrUpdateVehicleTag: async (vehicleId, payload) => {
    try {
      const user = await Common.getLoggedInUser();

      const userObj = {
        user_id: user.id,
        group_id: user.role_id,
        flat_no: user.flat_no,
        unit_id: user.unit_id,
        society_id: user.societyId,
      };

      const url = `${API_URL2}/vehicletag/${vehicleId}?api-token=${user.api_token
        }&user-id=${encodeURIComponent(JSON.stringify(userObj))}`;

      const headers = await Util.getCommonAuth();

      return await ApiCommon.postReq(url, payload, headers);

    } catch (error) {
      console.log("Vehicle Tag Error:", error);
      throw error;
    }
  },

  getAllStaffs: async () => {
    try {
      const user = await Common.getLoggedInUser();

      const userObj = {
        user_id: user.id,
        group_id: user.role_id,
        flat_no: user.flat_no,
        unit_id: user.unit_id,
        society_id: user.societyId,
      };

      const encodedUser = encodeURIComponent(
        JSON.stringify(userObj)
      );

      const url = `${API_URL4}/v1/society/${user.societyId
        }/${encodedUser}/staffs?api-token=${user.api_token}&user-id=${encodedUser}`;

      const headers = await Util.getCommonAuth();

      return await ApiCommon.getReq(url, headers);
    } catch (error) {
      console.log("Get All Staff Error:", error);
      throw error;
    }
  },
  getStaffRatingById: async (staffId) => {
    try {
      const user = await Common.getLoggedInUser();

      const userObj = {
        user_id: user.id,
        group_id: user.role_id,
        flat_no: user.flat_no,
        unit_id: user.unit_id,
        society_id: user.societyId,
      };

      const params = {
        "api-token": user.api_token,
        "user-id": JSON.stringify(userObj),
        staff_id: staffId,
      };

      const url = otherServices.appendParamsInUrl(
        `${API_URL4}/v1/society/${user.societyId}/getStaffRatingByStaffId`,
        params
      );

      const headers = await Util.getCommonAuth();

      const response = await ApiCommon.getReq(url, headers);

      return response;

    } catch (error) {
      console.log("Get Staff Rating Error:", error);
      throw error;
    }
  },

  assignStaff: async (staffId) => {
    try {
      const user = await Common.getLoggedInUser();

      const userObj = {
        user_id: user.id,
        group_id: user.role_id,
        flat_no: user.flat_no,
        unit_id: user.unit_id,
        society_id: user.societyId,
      };

      const encodedUser = encodeURIComponent(JSON.stringify(userObj));

      const url = `${API_URL4}/v1/society/${user.societyId}/assignStaff?api-token=${user.api_token}&user-id=${encodedUser}`;

      const headers = await Util.getCommonAuth();

      // 🔥 THIS IS THE IMPORTANT FIX
      const payload = {
        staff_id: staffId,
        user: {
          flat_no: user.flat_no,
          id: JSON.stringify(userObj),   // must be stringified
          name: user.name || "",         // add name if available
        },
      };

      const response = await ApiCommon.postReq(url, payload, headers);

      return response;

    } catch (error) {
      console.log("Assign Staff Error:", error);
      throw error;
    }
  },

  getStaffAttendance: async (staffId, month, year) => {
    try {
      const user = await Common.getLoggedInUser();

      const userObj = {
        user_id: user.id,
        group_id: user.role_id,
        flat_no: user.flat_no,
        unit_id: user.unit_id,
        society_id: user.societyId,
      };

      const params = {
        "api-token": user.api_token,
        "user-id": JSON.stringify(userObj),
        month,
        year,
        staff_id: staffId,
      };

      const url = otherServices.appendParamsInUrl(
        `${API_URL4}/v2/society/${user.societyId}/staffattendance`,
        params
      );

      const headers = await Util.getCommonAuth();

      return await ApiCommon.getReq(url, headers);

    } catch (error) {
      console.log("Attendance Error:", error);
      throw error;
    }
  },
  unassignStaff: async (staffId) => {
    try {
      const user = await Common.getLoggedInUser();

      const userObj = {
        user_id: user.id,
        group_id: user.role_id,
        flat_no: user.flat_no,
        unit_id: user.unit_id,
        society_id: user.societyId,
      };

      const encodedUser = encodeURIComponent(JSON.stringify(userObj));

      const url = `${API_URL4}/v1/society/${user.societyId}/unassignStaff?api-token=${user.api_token}&user-id=${encodedUser}`;

      const headers = await Util.getCommonAuth();

      // 🔥 IMPORTANT — user must NOT be stringified
      const payload = {
        staff_id: staffId,
        user: userObj,   // ✅ object, not string
      };

      const response = await ApiCommon.postReq(url, payload, headers);

      console.log("Unassign Response:", response);

      return response;

    } catch (error) {
      console.log("Unassign Staff Error:", error);
      throw error;
    }
  },
  addOrUpdateRating: async (staffId, rating, review) => {
    try {
      const user = await Common.getLoggedInUser();

      const userObj = {
        user_id: user.id,
        group_id: user.role_id,
        flat_no: user.flat_no,
        unit_id: user.unit_id,
        society_id: user.societyId,
      };

      const encodedUser = encodeURIComponent(JSON.stringify(userObj));

      const url = `${API_URL4}/v1/society/${user.societyId}/addOrUpdateRating?api-token=${user.api_token}&user-id=${encodedUser}`;

      const headers = await Util.getCommonAuth();

      const payload = {
        staff_id: staffId,
        rating: rating,
        remarks: review,
        user: userObj,
      };

      const response = await ApiCommon.postReq(url, payload, headers);

      console.log("Rating Response:", response);

      return response;

    } catch (error) {
      console.log("Rating Error:", error);
      throw error;
    }
  },
  appendParamsInUrl: (url, params) => {
    if (params && typeof params === "object") {
      const queryParams = Object.keys(params)
        .filter((key) => params[key] !== null && params[key] !== undefined)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&');

      if (queryParams) {
        url += url.includes('?') ? '&' : '?';
        url += queryParams;
      }
    }

    return url;
  }

}

export { otherServices }