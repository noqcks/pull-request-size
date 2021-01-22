const axios = require("axios");
require("dotenv").config();

async function createCommitStatus(statusesUrl, status) {
  console.log(status);
  let description = "";
  if (status === "pending") {
    description = "Checking size";
  } else if (status === "success") {
    description = "Pass";
  }
  const config = {
    method: "post",
    url: statusesUrl,
    headers: {
      Authorization: process.env.GIT_TOKEN,
    },
    data: {
      state: status,
      description,
      context: "PR check",
    },
  };
  try {
    const response = await axios(config);
    return response;
  } catch (error) {
    return error;
  }
}

module.exports = {
  createCommitStatus,
};
