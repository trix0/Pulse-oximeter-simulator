let testFunction = function(services) {
  console.log("Inside test function")
  var deviceName = process.env.BLENO_DEVICE_NAME || os.hostname();

  // base services and characteristics
  var allServices = [
    {
      uuid: '1800',
      characteristics: [
        {
          uuid: '2a00',
          properties: ['read'],
          secure: [],
          value: Buffer.from(deviceName),
          descriptors: []
        },
        {
          uuid: '2a01',
          properties: ['read'],
          secure: [],
          value: Buffer.from([0x80, 0x00]),
          descriptors: []
        }
      ]
    },
    {
      uuid: '1801',
      characteristics: [
        {
          uuid: '2a05',
          properties: ['indicate'],
          secure: [],
          value: Buffer.from([0x00, 0x00, 0x00, 0x00]),
          descriptors: []
        }
      ]
    }
  ].concat(services);

  this._handles = [];

  var handle = 0;
  var i;
  var j;

  for (i = 0; i < allServices.length; i++) {
    var service = allServices[i];

    handle++;
    var serviceHandle = handle;

    this._handles[serviceHandle] = {
      type: 'service',
      uuid: service.uuid,
      attribute: service,
      startHandle: serviceHandle
      // endHandle filled in below
    };

    for (j = 0; j < service.characteristics.length; j++) {
      var characteristic = service.characteristics[j];

      var properties = 0;
      var secure = 0;

      if (characteristic.properties.indexOf('read') !== -1) {
        properties |= 0x02;

        if (characteristic.secure.indexOf('read') !== -1) {
          secure |= 0x02;
        }
      }

      if (characteristic.properties.indexOf('writeWithoutResponse') !== -1) {
        properties |= 0x04;

        if (characteristic.secure.indexOf('writeWithoutResponse') !== -1) {
          secure |= 0x04;
        }
      }

      if (characteristic.properties.indexOf('write') !== -1) {
        properties |= 0x08;

        if (characteristic.secure.indexOf('write') !== -1) {
          secure |= 0x08;
        }
      }

      if (characteristic.properties.indexOf('notify') !== -1) {
        properties |= 0x10;

        if (characteristic.secure.indexOf('notify') !== -1) {
          secure |= 0x10;
        }
      }

      if (characteristic.properties.indexOf('indicate') !== -1) {
        properties |= 0x20;

        if (characteristic.secure.indexOf('indicate') !== -1) {
          secure |= 0x20;
        }
      }

      handle++;
      var characteristicHandle = handle;

      handle++;
      var characteristicValueHandle = handle;

      this._handles[characteristicHandle] = {
        type: 'characteristic',
        uuid: characteristic.uuid,
        properties: properties,
        secure: secure,
        attribute: characteristic,
        startHandle: characteristicHandle,
        valueHandle: characteristicValueHandle
      };

      this._handles[characteristicValueHandle] = {
        type: 'characteristicValue',
        handle: characteristicValueHandle,
        value: characteristic.value
      };

      if (properties & 0x30) { // notify or indicate
        // add client characteristic configuration descriptor

        handle++;
        var clientCharacteristicConfigurationDescriptorHandle = handle;
        this._handles[clientCharacteristicConfigurationDescriptorHandle] = {
          type: 'descriptor',
          handle: clientCharacteristicConfigurationDescriptorHandle,
          uuid: '2902',
          attribute: characteristic,
          properties: (0x02 | 0x04 | 0x08), // read/write
          secure: (secure & 0x10) ? (0x02 | 0x04 | 0x08) : 0,
          value: Buffer.from([0x00, 0x00])
        };
      }

      for (var k = 0; k < characteristic.descriptors.length; k++) {
        var descriptor = characteristic.descriptors[k];

        handle++;
        var descriptorHandle = handle;

        this._handles[descriptorHandle] = {
          type: 'descriptor',
          handle: descriptorHandle,
          uuid: descriptor.uuid,
          attribute: descriptor,
          properties: 0x02, // read only
          secure: 0x00,
          value: descriptor.value
        };
      }
    }

    this._handles[serviceHandle].endHandle = handle;
  }

  var debugHandles = [];
  for (i = 0; i < this._handles.length; i++) {
    handle = this._handles[i];

    debugHandles[i] = {};
    for(j in handle) {
      if (Buffer.isBuffer(handle[j])) {
        debugHandles[i][j] = handle[j] ? 'Buffer(\'' + handle[j].toString('hex') + '\', \'hex\')' : null;
      } else if (j !== 'attribute') {
        debugHandles[i][j] = handle[j];
      }
    }
  }

  debug('handles = ' + JSON.stringify(debugHandles, null, 2));
};

module.exports=testFunction;