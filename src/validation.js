const axios = require("axios");
const Sentry = require("./sentry");
require("dotenv").config();

async function checkJiraTicket(title) {
  title = title.trim();
  const regex = /^[a-z]{2,6}( |-)[0-9]{1,6}/gi;

  // PR title must begin with ticket name
  if (!title.match(regex)) {
    return [false, "bad title"];
  }

  // extract ticket name from pr title
  let [ticketNum] = title.match(regex);

  // convert ticket number format to "JIRA-123"
  if (ticketNum.match(/^[a-z]{2,6} [0-9]{1,6}/gi)) {
    ticketNum = ticketNum.replace(" ", "-");
  }
  // check if the ticket exist
  const config = {
    method: "get",
    url: `https://risepeople.atlassian.net/rest/api/latest/issue/${ticketNum}`,
    auth: {
      username: process.env.USER_NAME,
      password: process.env.PASSWORD,
    },
  };

  try {
    await axios(config);
    return [true, "jira ok"];
  } catch (e) {
    Sentry.captureException(e);
    return [false, "no jira"];
  }
}

module.exports = {
  checkJiraTicket,
};
