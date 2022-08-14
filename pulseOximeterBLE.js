var util = require('util');
var bleno = require('bleno'); 
var continuousMeasurement = require('./continuousMeasurement');
var systemIdCharacteristic = require('./deviceInformationCharacteristics/systemId');
var spotCheck = require('./spotCheck');


var customService = bleno.PrimaryService;
//var testFunction = require('./testFunction.js');
var BlenoCharacteristic  = bleno.Characteristic;
var isSubscribed = false
var notifyInterval = 2 //seconds

class pulseOximeter {
	constructor() {
		//ble
	  this.name="Monin oximeter";
	  this.bleno=bleno;
	  this.continuousMeasurement=new continuousMeasurement();
	  this.spotCheck=new spotCheck();
	  this.primaryServiceUUID="1822";     // oximeter service
	  this.deviceInformationServiceUUID="180a";     // device information service
	  this.systemIdCharacteristic=new systemIdCharacteristic();

	  this.primaryService=new customService({
                uuid: this.primaryServiceUUID,
                characteristics: [
                    this.continuousMeasurement,
                    this.spotCheck
                ]
            })
  	  this.deviceInformationService=new customService({
            uuid: this.deviceInformationServiceUUID,
            characteristics: [
                this.systemIdCharacteristic
            ]
        })

	  console.log(JSON.stringify(this.primaryService));

	  //testFunction(this.primaryService);

	  //oximeter
	  this.pulse = null;
	  this.spo2 = null;
	  this.isStatic = true;
	  this.isRunning = false;
	  this.listeners=new Map();


	  //todo add test data

	}
	setPulse(pulse){
		if(pulse>350||pulse<0){
			this.trigger("error","Incorrect pulse value:" +pulse);
			return;
		}
		this.pulse=pulse;
	}
	setSpo2(spo2){
		if(spo2>100||spo2<0){
			this.trigger("error","Incorrect spo2 value:" +spo2);
			this.trigger("vitalsChanged",null,null);
			return;
		}
		this.spo2=spo2;
	}



	setVitals(pulse,spo2){
		if(!this.isRunning){
			this.setPulse(null);
			this.setSpo2(null);
			this.trigger("error","oximeter is not running");
			this.trigger("vitalsChanged",null,null);
			return;
		}
		this.setPulse(pulse);
		this.setSpo2(spo2);
		this.continuousMeasurement.setVitals(this.pulse,this.spo2);
		this.trigger("vitalsChanged",this.pulse,this.spo2);
	}
	setMode(isStatic){
		this.isStatic=isStatic;
		this.trigger("modeChanged",this.isStatic);
	}
	turnOff(){
		this.isRunning=false;
		this.setVitals(null,null);
		this.trigger("isRunningChanged",this.isRunning);
	}
	turnOn(){
		this.isRunning=true;

		this.trigger("isRunningChanged",this.isRunning);
		this.setVitals(75,100);
	}

    on(label, callback, checkPast = false) {
	    this.listeners.has(label) || this.listeners.set(label, []);
	    this.listeners.get(label).push(callback);
	}

    trigger(label, ...args) {
        let res = false;
        //this.triggerdLabels.set(label, ...args); // save all triggerd labels for onready and onceready
        let _trigger = (inListener, label, ...args) => {
            let listeners = inListener.get(label);
            if (listeners && listeners.length) {
                listeners.forEach((listener) => {
                    listener(...args);
                });
                res = true;
            }
        };
        _trigger(this.listeners, label, ...args);
        return res;
    }

    setUpBleListeners(){
		this.bleno.on('disconnect', (clientAddress)=>{
			console.log("disconnect"+JSON.stringify(clientAddress));
		}); // Linux only


	    this.bleno.on('advertisingStart', (error)=> {
		    console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));
		     if (!error) {
		     	let services=[this.primaryService,this.deviceInformationService];
	  			console.log(JSON.stringify(services));

		    	this.bleno.setServices([this.primaryService,this.deviceInformationService], function(error){
		     		console.log('setServices: '  + (error ? 'error ' + error : 'success'));
		    	});
		    }
		});

		this.bleno.on('stateChange', (state)=> {
			console.log(state);
		  if (state === 'poweredOn'){
		  		let services=[this.primaryServiceUUID,this.deviceInformationServiceUUID];
		  		let advData=Buffer.from("0201060f0950756c7365204f78696D65746572030222180319410C", "hex")
		  		this.bleno.startAdvertisingWithEIRData(advData,null,(err)=>{
		  			console.log(err);
		  		});
		        //this.bleno.startAdvertising(this.name, services, (error)=>{console.log(error)});
		  }
		});
    }

};

module.exports=pulseOximeter;

