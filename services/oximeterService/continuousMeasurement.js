// var util = require('util');
// var bleno = require('bleno'); 
// var BlenoCharacteristic  = bleno.Characteristic;

// var isSubscribed = false
// var notifyInterval = 2 //seconds


// function delayedNotification(callback) {
//     setTimeout(function() { 
//         if (isSubscribed) {
//             var data = Buffer(3);
//             var now = new Date();
//             data.writeUInt8(now.getHours(), 0);
//             data.writeUInt8(now.getMinutes(), 1);
//             data.writeUInt8(now.getSeconds(), 2);
//             callback(data);
//             delayedNotification(callback);
//         }
//     }, notifyInterval * 1000);
// };

// var continuousMeasurement = function() {
//     CustomCharacteristic.super_.call(this, {
//         uuid: '0x2A5F',
//         properties: ['read','notify'],
//     });
//     this._value = new Buffer(0);
//     this._updateValueCallback = null;
// };
// continuousMeasurement.prototype.onReadRequest = function (offset, callback) {
//     console.log('continuousMeasurement onReadRequest');
//     var data = new Buffer(1);
//     data.writeUInt8(42, 0);
//     callback(this.RESULT_SUCCESS, data);
// };

// continuousMeasurement.prototype.onSubscribe = function(maxValueSize, updateValueCallback) {
//     console.log('continuousMeasurement - onSubscribe');
//     isSubscribed = true;
//     delayedNotification(updateValueCallback);
//     this._updateValueCallback = updateValueCallback;
// };

// continuousMeasurement.prototype.onUnsubscribe = function() {
//     console.log('continuousMeasurement - onUnsubscribe');
//     isSubscribed = false;
//     this._updateValueCallback = null;
// };

// util.inherits(continuousMeasurement, BlenoCharacteristic);

// exports = continuousMeasurement;