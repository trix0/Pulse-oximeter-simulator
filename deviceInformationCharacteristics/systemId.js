var util = require('util');
var bleno = require('bleno'); 
var BlenoCharacteristic  = bleno.Characteristic;
var blePacket = require('ble-packet');

var systemId = function() {
    systemId.super_.call(this, {
        uuid: "2A23",
        properties: ['read'],
    });
    this._value = new Buffer(0);
    this._updateValueCallback = null;
};
systemId.prototype.onReadRequest = function (offset, callback) {
    console.log('systemId onReadRequest');
    callback(this.RESULT_SUCCESS, this._value);
};


util.inherits(systemId, BlenoCharacteristic);
module.exports = systemId;
