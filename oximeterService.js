var bleno = require('bleno') ; 
var oximeterSerive = bleno.PrimaryService;
var continuousMeasurement = require('./continuousMeasurement');

//var oximeterSerive = require('./continuousMeasurement');
bleno.on('advertisingStart', function(error) {
    console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));
     if (!error) {
        bleno.setServices([
            new oximeterSerive({
                uuid: '0000182200001000800000805F9BB34FB',
                characteristics: [
                    new continuousMeasurement()
                ]
            })
        ]);
    }
});
module.exports=oximeterSerive;
