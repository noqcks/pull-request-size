const Sentry = require("@sentry/node");
require("dotenv").config();

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

module.exports = Sentry;
