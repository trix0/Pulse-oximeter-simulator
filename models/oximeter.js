
class oximeter {
    constructor() {
        this.spo2 = null;
        this.pulse = null;
        this.running=false;
        this.isStatic=true;

        //callbacks
        this.vitalsCallback=null;//called when updated vitals eg. spo2, pulse
        this.powerCallback=null;//called when oximeter is turned on or off
    }

    setSpo2(spo2){
    	this.spo2=spo2;
    }
    setPulse(pulse){
    	this.pulse=pulse;
    }

    setIsRunning(shouldRun){
    	this.running=shouldRun;
    	if(powerCallback!=undefined){
    		powerCallback();
    	}
    }

    turnOff(){
    	setIsRunning(false)
    }
    turnOn(){
    	setIsRunning(true)
    }


    setVitals(spo2,pulse){
    	setSpo2(spo2);
    	setPulse(pulse);
    	if(vitalsCallback && typeof vitalsCallback === "function"){
    		vitalsCallback();
    	}
    }


    //callbacks
    setvitalsCallback(callback){
    	this.vitalsCallback=callback;
    }

    setpowerCallback(callback){
    	this.powerCallback=callback;
    }

}