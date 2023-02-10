#!/usr/bin/env python3
from email.mime import application
from flask import Flask, request, jsonify


import math
import sfloat
import sys
import logging
import random
import dbus
import dbus.exceptions
import dbus.mainloop.glib
import dbus.service
import threading
GATT_CHRC_IFACE = "org.bluez.GattCharacteristic1"
from ble import (
    Advertisement,
    Characteristic,
    Service,
    GATT_CHRC_IFACE,
    Application,
    find_adapter,
    Descriptor,
    Agent,
)

import struct
import requests
import array
from time import sleep
from enum import Enum


import sys
MainLoop = None
try:
    from gi.repository import GLib

    MainLoop = GLib.MainLoop
except ImportError:
    import gobject as GObject

    MainLoop = GObject.MainLoop

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
logHandler = logging.StreamHandler()
filelogHandler = logging.FileHandler("logs.log")
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logHandler.setFormatter(formatter)
filelogHandler.setFormatter(formatter)
logger.addHandler(filelogHandler)
logger.addHandler(logHandler)
myOximeterService=None
running=False

host_name = "0.0.0.0"
port = 5000
app = Flask(__name__)


mainloop = None

BLUEZ_SERVICE_NAME = "org.bluez"
GATT_MANAGER_IFACE = "org.bluez.GattManager1"
LE_ADVERTISEMENT_IFACE = "org.bluez.LEAdvertisement1"
LE_ADVERTISING_MANAGER_IFACE = "org.bluez.LEAdvertisingManager1"


class InvalidArgsException(dbus.exceptions.DBusException):
    _dbus_error_name = "org.freedesktop.DBus.Error.InvalidArgs"


class NotSupportedException(dbus.exceptions.DBusException):
    _dbus_error_name = "org.bluez.Error.NotSupported"


class NotPermittedException(dbus.exceptions.DBusException):
    _dbus_error_name = "org.bluez.Error.NotPermitted"


class InvalidValueLengthException(dbus.exceptions.DBusException):
    _dbus_error_name = "org.bluez.Error.InvalidValueLength"


class FailedException(dbus.exceptions.DBusException):
    _dbus_error_name = "org.bluez.Error.Failed"


POSITIVE_INFINITY=0x07FE
NaN=0x07FF
NaN2=0x0800
Nan3=0x0801
NEGATIVE_INFINITY=0x0802

def uintToSFloat(ieee11073):
    mantissa=ieee11073&0x0FFF

    if(mantissa==POSITIVE_INFINITY):
        return POSITIVE_INFINITY
    if(mantissa==NaN):
        return NaN
    if(mantissa==NaN2):
        return NaN2
    if(mantissa==Nan3):
        return Nan3
    if(mantissa==NEGATIVE_INFINITY):
        return NEGATIVE_INFINITY

    if (mantissa >= 0x0800):
        mantissa = -(0x1000 - mantissa)

    exponent=ieee11073 >> 12

    if (exponent >= 0x08):
        exponent = -(0x10 - exponent)

    magnitude = math.pow(10, exponent)
    return (mantissa*magnitude)

def register_app_cb():
    logger.info("GATT application registered")


def register_app_error_cb(error):
    logger.critical("Failed to register application: " + str(error))
    mainloop.quit()



BIT0 = 0x00,
BIT1  = 0x01,
BIT2  = 0x02,
BIT3  = 0x04,
BIT4  = 0x08,
BIT5  = 0x10,
BIT6= 0x20,
BIT7= 0x40,
BIT8= 0x80,


class plxContinuousMeasurementFlags_tag:
    gPlx_SpO2PRFastPresent_c                      = BIT0,   
    gPlx_SpO2PRSlowPresent_c                      = BIT1,      
    gPlx_ContinuousMeasurementStatusPresent_c     = BIT2,      
    gPlx_ContinuousDeviceAndSensorStatusPresent_c = BIT3,       
    gPlx_ContinuousPulseAmplitudeIndexPresent_c   = BIT4    

class plxSupportedFeatures_tag:
    gPlx_MeasurementStatusSupported_c     = BIT0,     
    gPlx_DeviceAndSensorStatusSupported_c = BIT1,   
    gPlx_MeasurementStorageSupported_c    = BIT2,
    gPlx_TimestampSupported_c             = BIT3,
    gPlx_SpO2PRFastSupported_c            = BIT4,
    gPlx_SpO2PRSlowSupported_c            = BIT5,
    gPlx_PulseAmplitudeIndexSupported_c   = BIT6,
    gPlx_MultipleBondsSupported_c         = BIT7

class plxOpCode_tag:
    gPlx_Reserved_c = 0x00,
    gPlx_ReportStoredRecords_c  = 0x01,
    gPlx_DeleteStoredRecords_c  = 0x02,
    gPlx_AbortOperation_c  = 0x03,
    gPlx_ReportNumOfStoredRecords_c  = 0x04,
    gPlx_NumOfStoredRecordsRsp_c  = 0x05,
    gPlx_RspCode_c= 0x06

import threading 
import time

class RepeatedTimer(object):
  def __init__(self, interval, function, *args, **kwargs):
    self._timer = None
    self.interval = interval
    self.function = function
    self.args = args
    self.kwargs = kwargs
    self.is_running = False
    self.next_call = time.time()
    self.start()

  def _run(self):
    self.is_running = False
    self.start()
    self.function(*self.args, **self.kwargs)

  def start(self):
    if not self.is_running:
      self.next_call += self.interval
      self._timer = threading.Timer(self.next_call - time.time(), self._run)
      self._timer.start()
      self.is_running = True

  def stop(self):
    self._timer.cancel()
    self.is_running = False




class OximeterService(Service):

    OximeterServiceUUID = "0x1822"


    def __init__(self, bus, index):
        Service.__init__(self, bus, index, self.OximeterServiceUUID, True)
        self.ContiniousMeasurementChartacteristic=ContiniousMeasurement(bus, 0, self)
        self.add_characteristic(self.ContiniousMeasurementChartacteristic)
        self.add_characteristic(SpotCheck(bus, 1, self))
        self.add_characteristic(PlxFeatures(bus, 2, self))


class ContiniousMeasurement(Characteristic):
    uuid = "0x2A5F"
    description = b"ContiniousMeasurement"

    def __init__(self, bus, index, service):
        Characteristic.__init__(
            self, bus, index, self.uuid, ["notify"], service,
        )
        self.notifying = False
        self.status = []
        self.value = [0]
        self.spo2=0
        self.pulse=0
        self.add_descriptor(CharacteristicUserDescriptionDescriptor(bus, 1, self))

    def StartNotify(self):
        try:
            if self.notifying:
                print('\nAlready notifying, nothing to do')
                return
            print('Notify Started')
            self.notifying = True
            self.ReadValue()
            self.changeValue(100,75)
            self.status.append('notify')

        except Exception as e:
            print(e)

    def StopNotify(self):
        if not self.notifying:
            print('\nNot notifying, nothing to do')
            return
        self.notifying = False
        print('\nNotify Stopped')

    def Tick(self):
        self.PropertiesChanged(GATT_CHRC_IFACE, {'Value': self.value}, [])
        self.status.append('write')



    def changeValue(self,spo2,pulse):
        self.spo2=spo2
        self.pulse=pulse
        sfloatSpo2=sfloat.floatToSFloat(spo2*10)
        sfloatPulse=sfloat.floatToSFloat(pulse*10)
        self.updateValue(sfloatSpo2,sfloatPulse)


    def ReadValue(self, options=None):
        val_list = []
        for val in self.value:
            val_list.append(dbus.Byte(val))
        self.status.append('read')
        print('\tValue:', '\t', val_list)
        return val_list


    def updateValue(self, spo2,pulse, options=None):
        val_list = [dbus.Byte(0x1)]
        spo2Value = []
        for val in spo2:
            spo2Value.append(dbus.Byte(val))
        spo2Value=spo2Value[::-1]
        pulseValue=[]
        for val in pulse:
           pulseValue.append(dbus.Byte(val))
        pulseValue=pulseValue[::-1]
        val_list=[dbus.Byte(0x1)]+spo2Value+pulseValue
        print(bytes(val_list).hex())
        self.value = val_list

    def WriteValue(self, spo2,pulse, options=None):
        val_list = [dbus.Byte(0x1)]
        spo2Value = []
        for val in spo2:
            spo2Value.append(dbus.Byte(val))
        spo2Value=spo2Value[::-1]
        pulseValue=[]
        for val in pulse:
           pulseValue.append(dbus.Byte(val))
        pulseValue=pulseValue[::-1]
        val_list=[dbus.Byte(0x1)]+spo2Value+pulseValue
        print(bytes(val_list).hex())
        self.value = val_list
        print('New value:', '\t', self.value)
        self.PropertiesChanged(GATT_CHRC_IFACE, {'Value': self.value}, [])
        self.status.append('write')

class SpotCheck(Characteristic):
    uuid = "0x2A5E"
    description = b"SpotCheck"

    def __init__(self, bus, index, service):
        Characteristic.__init__(
            self, bus, index, self.uuid, ["indicate"], service,
        )

        self.value = [31]
        self.add_descriptor(CharacteristicUserDescriptionDescriptor(bus, 1, self))

    def ReadValue(self, options):
        return self.value

    def WriteValue(self, value, options):
        return

class PlxFeatures(Characteristic):
    uuid = "0x2A60"
    description = b"PlxFeatures"
    def __init__(self, bus, index, service):
        Characteristic.__init__(
            self, bus, index, self.uuid, ["read"], service,
        )

        self.value = [31]
        self.add_descriptor(CharacteristicUserDescriptionDescriptor(bus, 1, self))

    def ReadValue(self, options):
        return self.value

    def WriteValue(self, value, options):
        cmd = bytes(value)

class CharacteristicUserDescriptionDescriptor(Descriptor):
    """
    Writable CUD descriptor.
    """

    CUD_UUID = "2901"

    def __init__(
        self, bus, index, characteristic,
    ):

        self.value = array.array("B", characteristic.description)
        self.value = self.value.tolist()
        Descriptor.__init__(self, bus, index, self.CUD_UUID, ["read"], characteristic)

    def ReadValue(self, options):
        return self.value

    def WriteValue(self, value, options):
        if not self.writable:
            raise NotPermittedException()
        self.value = value


class OximeterAdvertisment(Advertisement):
    def __init__(self, bus, index):
        Advertisement.__init__(self, bus, index, "peripheral")
        self.add_manufacturer_data(
            0xFFFF, [0x70, 0x74],
        )
        self.add_service_uuid(OximeterService.OximeterServiceUUID)
        self.add_local_name("Monin")
        self.add_appearance(0xC41)
        self.include_tx_power = True


def register_ad_cb():
    logger.info("Advertisement registered")


def register_ad_error_cb(error):
    logger.critical("Failed to register advertisement: " + str(error))

def unregister_ad_cb():
    logger.info("Advertisement unregistered")


def unregister_ad_error_cb(error):
    logger.critical("Failed to unregister advertisement: " + str(error))


AGENT_PATH = "/com/trixo/oximeter"


def powerUp(bus,adapter,service_manager,ad_manager,agent,agent_manager,application,advertisement):
    agent_manager.RegisterAgent(AGENT_PATH, "NoInputNoOutput")
    ad_manager.RegisterAdvertisement(
        advertisement.get_path(),
        {},
        reply_handler=register_ad_cb,
        error_handler=register_ad_error_cb,
    )

    logger.info("Registering GATT application...")

    service_manager.RegisterApplication(
        application.get_path(),
        {},
        reply_handler=register_app_cb,
        error_handler=[register_app_error_cb],
    )
    agent_manager.RequestDefaultAgent(AGENT_PATH)
    RUNNING = True
    return
    

def tickData(service):
    service.ContiniousMeasurementChartacteristic.Tick()
    return


def setData(service,data):
    if(data==None or data['spO2']==None or data['pulse']==None):
        service.ContiniousMeasurementChartacteristic.changeValue(0,0)    
        return
    service.ContiniousMeasurementChartacteristic.changeValue(data['spO2'],data['pulse'])
    return

    


def main():
    global mainloop
    dbus.mainloop.glib.DBusGMainLoop(set_as_default=True)
     # get the system bus
    bus = dbus.SystemBus()
    # get the ble controller
    adapter = find_adapter(bus)


    if not adapter:
        logger.critical("GattManager1 interface not found")
        return
    adapter_obj = bus.get_object(BLUEZ_SERVICE_NAME, adapter)



    # Get manager objs
    service_manager = dbus.Interface(adapter_obj, GATT_MANAGER_IFACE)
    ad_manager = dbus.Interface(adapter_obj, LE_ADVERTISING_MANAGER_IFACE)
    agent = Agent(bus, AGENT_PATH)
    obj = bus.get_object(BLUEZ_SERVICE_NAME, "/org/bluez")
    agent_manager = dbus.Interface(obj, "org.bluez.AgentManager1")
    mainloop = MainLoop()

    @app.route('/status', methods=['GET'])
    def status():
        response={
            "running": running,
        }
        if(running):
            response["data"] = {
                "spO2":myOximeterService.ContiniousMeasurementChartacteristic.spo2,
                "pulse":myOximeterService.ContiniousMeasurementChartacteristic.pulse
                }
        return jsonify(response)


    @app.route('/command', methods=['POST'])
    def data():
        content = request.json
        global running
        commandType=content['type']
        value=content["value"]
        if(commandType=="POWER"):
            if(value):
                # Power up
                logger.info("Powering up...")

                if(running):
                    return "Already running", 200
                global advertisement
                global bleApp
                global myOximeterService
                global rt

                advertisement = OximeterAdvertisment(bus, 0)
                adapter_props = dbus.Interface(adapter_obj, "org.freedesktop.DBus.Properties")
                adapter_props.Set("org.bluez.Adapter1", "Powered", dbus.Boolean(1))
                bleApp = Application(bus)
                myOximeterService=OximeterService(bus, 2)
                bleApp.add_service(myOximeterService)
                rt = RepeatedTimer(1, tickData, myOximeterService)
                powerUp(bus,adapter,service_manager,ad_manager,agent,agent_manager,bleApp,advertisement)
                rt.start()
                running = True


            elif(~value):
                # Power down
                logger.info("Powering down...")

                if(not running):
                    return "Already off", 200
                myOximeterService.release()
                agent_manager.UnregisterAgent(AGENT_PATH)
                ad_manager.UnregisterAdvertisement(advertisement.get_path())
                advertisement.release()
                adapter_props = dbus.Interface(adapter_obj, "org.freedesktop.DBus.Properties")
                adapter_props.Set("org.bluez.Adapter1", "Powered", dbus.Boolean(0))
                service_manager.UnregisterApplication(bleApp.get_path())
                bleApp.release()
                rt.stop()
                running = False

        elif(commandType=="ADVERTISMENT"):
            if(value):
                # Advertisment start
                logger.info("Advertisment start...")
            elif(~value):
                # Advertistment stop
                logger.info("Advertisment stop...")
        elif(commandType=="DATA"):
            if(not running):
                return "Monin is not running", 404  
            setData(myOximeterService,content['value'])
        else:
            return "Bad request", 400

        return jsonify(content)
    mainloop.run()




if __name__ == "__main__":
    threading.Thread(target=lambda: app.run(host=host_name, port=port, debug=True, use_reloader=False)).start()
    main()
