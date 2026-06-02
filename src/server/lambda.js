'use strict';

const serverless = require('serverless-http');
const { createApp } = require('./app');

// We initialize the app once per cold start
const app = createApp();

module.exports.handler = serverless(app);
