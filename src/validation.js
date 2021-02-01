const axios = require("axios");
const Sentry = require("./sentry");

const messages = {
  badTitle: "bad title",
  noJira: "no jira",
  goodJira: "jira ok",
};

async function checkJiraTicket(title, headers) {
  title = title.trim();
  const regex = /^[a-z]{2,6}( |-)[0-9]{1,6}/gi;

  // PR title must begin with ticket name
  if (!title.match(regex)) {
    return [false, messages.badTitle];
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
    headers,
  };

  try {
    await axios(config);
    return [true, messages.goodJira];
  } catch (e) {
    Sentry.captureException(e);
    return [false, messages.noJira];
  }
}

module.exports = {
  messages,
  checkJiraTicket,
};
