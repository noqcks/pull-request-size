const axios = require("axios");
require("dotenv").config();

let tokenStatus = "";
let headers = {
  Authorization: "The Initial Token",
};

const validateToken = async () => {
  const config = {
    method: "get",
    url: "https://api.atlassian.com/oauth/token/accessible-resources",
    headers,
  };
  try {
    // console.log("Before", config.headers);
    const response = await axios(config);
    if (response.status === 200) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

const refreshToken = async (tryRefreshTimes) => {
  const config = {
    method: "post",
    url: "https://auth.atlassian.com/oauth/token",
    data: {
      refresh_token: process.env.REFRESH_TOKEN,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECREAT,
      grant_type: process.env.GRANT_TYPE,
    },
  };
  try {
    if (tryRefreshTimes > process.env.RETRY_TIMES) {
      return false;
    }
    const response = await axios(config);
    if (response.status === 200 && !("error" in response.data)) {
      return response.data.access_token;
    }
    tryRefreshTimes += 1;
    return refreshToken(tryRefreshTimes);
  } catch (error) {
    return { error: `RefreshToken - ${error}` };
  }
};

const auth = async () => {
  let accessToken = "";
  try {
    tokenStatus = await validateToken();
    // If token is invalid, then we refresh the token for X times.
    if (!tokenStatus) {
      const tmpToken = await refreshToken(0);
      if (!tmpToken) {
        return false;
      }
      accessToken = "Bearer ".concat(tmpToken);

      // Update token
      headers = {
        Authorization: accessToken,
      };
    }

    // Else the token is still valid, then we use it.
    // console.log("After", headers);
    return headers;
  } catch (error) {
    return { "Auth Error": error };
  }
};

module.exports = {
  auth,
  refreshToken,
  validateToken,
};
