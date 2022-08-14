class pulseOximeter {
	constructor() {
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
};