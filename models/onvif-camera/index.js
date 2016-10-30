/*
 *  index.js
 *
 *  David Janes
 *  IOTDB
 *  2016-10-30
 */

var iotdb = require("iotdb");

exports.binding = {
    bridge: require('../../ONVIFBridge').Bridge,
    model: require('./model.json'),
};
