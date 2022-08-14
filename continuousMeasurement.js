var util = require('util');
var bleno = require('bleno'); 
var BlenoCharacteristic  = bleno.Characteristic;
var blePacket = require('ble-packet');

var isSubscribed = false
var notifyInterval = 2 //seconds

var continuousMeasurement = function() {
    continuousMeasurement.super_.call(this, {
        uuid: "2A5F",
        properties: ['read','notify'],
    });
    this.dataPrefix=new Buffer(10);
    this.dataPrefix.writeUInt8(1,0);
    this._value = new Buffer(0);
    this._updateValueCallback = null;
};
continuousMeasurement.prototype.onReadRequest = function (offset, callback) {
    console.log('continuousMeasurement onReadRequest');
    callback(this.RESULT_SUCCESS, this._value);
};

continuousMeasurement.prototype.onSubscribe = function(maxValueSize, updateValueCallback) {
    console.log('continuousMeasurement - onSubscribe');
    isSubscribed = true;
    //delayedNotification(updateValueCallback);
    this._updateValueCallback = updateValueCallback;
};

continuousMeasurement.prototype.onUnsubscribe = function() {
    console.log('continuousMeasurement - onUnsubscribe');
    isSubscribed = false;
    this._updateValueCallback = null;
};

continuousMeasurement.prototype.setVitals=function(pulse,spo2) {
     let Values =  {
            flags: 31,
            normalSpO2: spo2/100,
            normalPR: pulse/100,
            fastSpO2: spo2/100, 
            fastPR: pulse/100, 
            slowSpO2: spo2/100, 
            slowPR: pulse/100,
            measureStatus: 1, 
            deviceAndSensorStatus: 3, 
            pulseAmpIndex: 2
        }
    this._value = blePacket.frame('0x2a5f', Values)
    if(this._updateValueCallback!=null)
            this._updateValueCallback(this._value);
};


function delayedNotification(callback) {
    setTimeout(function() { 
        if (isSubscribed) {
            var data = Buffer(3);
            var now = new Date();
            data.writeUInt8(now.getHours(), 0);
            data.writeUInt8(now.getMinutes(), 1);
            data.writeUInt8(now.getSeconds(), 2);
            callback(data);
            delayedNotification(callback);
        }
    }, notifyInterval * 1000);
};

util.inherits(continuousMeasurement, BlenoCharacteristic);
module.exports = continuousMeasurement;
