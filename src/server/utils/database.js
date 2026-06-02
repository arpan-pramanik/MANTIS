'use strict';

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand, DeleteCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { logger } = require('./logger');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const LOGS_TABLE = process.env.LOGS_TABLE || 'mantis-logs';
const BLOCKLIST_TABLE = process.env.BLOCKLIST_TABLE || 'mantis-blocklist';

function getDb() {
  return docClient;
}

async function insertLog(entry) {
  try {
    await docClient.send(new PutCommand({
      TableName: LOGS_TABLE,
      Item: {
        request_id: entry.correlationId || Date.now().toString(),
        type: 'log',
        ...entry
      }
    }));
  } catch (err) {
    logger.error('DynamoDB insertLog error', { error: err.message });
  }
}

async function isBlocked(ip, token) {
  try {
    if (ip) {
      const res = await docClient.send(new QueryCommand({
        TableName: BLOCKLIST_TABLE,
        KeyConditionExpression: 'ip = :ip',
        ExpressionAttributeValues: { ':ip': ip }
      }));
      if (res.Items && res.Items.length > 0 && res.Items[0].status === 'active') {
        return res.Items[0];
      }
    }
    // For tokens, we'd ideally have a GSI, but for simplicity in serverless we scan or use GSI.
    // Assuming mostly IP blocks for now.
    return null;
  } catch (err) {
    logger.error('DynamoDB isBlocked error', { error: err.message });
    return null;
  }
}

async function isAllowlisted(ip, token) {
  return null; // Stubbed for DynamoDB
}

async function addBlock(entry) {
  try {
    await docClient.send(new PutCommand({
      TableName: BLOCKLIST_TABLE,
      Item: {
        ...entry,
        status: 'active'
      }
    }));
  } catch (err) {
    logger.error('DynamoDB addBlock error', { error: err.message });
  }
}

async function removeBlock(id) {
  // Not easily implemented without IP, assuming id is IP for DynamoDB
}

async function getActiveBlocks() {
  try {
    const res = await docClient.send(new ScanCommand({
      TableName: BLOCKLIST_TABLE,
      FilterExpression: '#st = :status',
      ExpressionAttributeNames: { '#st': 'status' },
      ExpressionAttributeValues: { ':status': 'active' }
    }));
    return res.Items || [];
  } catch (err) {
    logger.error('DynamoDB getActiveBlocks error', { error: err.message });
    return [];
  }
}

async function getAllBlocks(limit = 1000, offset = 0) {
  return getActiveBlocks();
}

async function updateStrikes(ip, token) {
  try {
    if (ip) {
      await docClient.send(new UpdateCommand({
        TableName: BLOCKLIST_TABLE,
        Key: { ip },
        UpdateExpression: 'ADD strikes :inc',
        ExpressionAttributeValues: { ':inc': 1 }
      }));
    }
  } catch (err) {
    logger.error('DynamoDB updateStrikes error', { error: err.message });
  }
}

async function insertThreatEvent(event) {
  try {
    await docClient.send(new PutCommand({
      TableName: LOGS_TABLE,
      Item: {
        request_id: event.eventId || Date.now().toString(),
        type: 'threat',
        ...event
      }
    }));
  } catch (err) {
    logger.error('DynamoDB insertThreatEvent error', { error: err.message });
  }
}

async function getThreatEvents(filters = {}) {
  return [];
}

async function getThreatStats() {
  return {
    totalThreats: 0,
    threatsLast24h: 0,
    bySeverity: {},
    byType: {},
    topActors: [],
    activeBlocks: 0,
    totalRequestsLogged: 0
  };
}

async function getThreatTimeline() {
  return [];
}

async function addAllowlist(entry) {}

async function expireBlocks() {}

function closeDb() {}

module.exports = {
  getDb, insertLog, isBlocked, isAllowlisted, addBlock, removeBlock,
  getActiveBlocks, getAllBlocks, updateStrikes, insertThreatEvent,
  getThreatEvents, getThreatStats, getThreatTimeline,
  addAllowlist, expireBlocks, closeDb
};
