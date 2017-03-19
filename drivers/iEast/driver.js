'use strict';

// a list of devices, with their 'id' as key
// it is generally advisable to keep a list of
// paired and active devices in your driver's memory.
const Client = require('node-ssdp').Client;
const client = new Client();
const playerxml = ':49152/description.xml';
const httpapi = '/httpapi.asp?command=';
const apidevicestatus = 'getStatusEx';
const apiplayerstatus = 'getPlayerStatus';
const apisetplayer = 'setPlayerCmd:';
const request = require('request');
let devices = {};

// the `init` method is called when your driver is loaded for the first time
module.exports.init = function (devices_data, callback) {
	devices_data.forEach(function (device_data) {
		initDevice(device_data);
	});

	callback();
};

// the `added` method is called is when pairing is done and a device has been added
module.exports.added = function (device_data, callback) {
	initDevice(device_data);
	callback(null, true);
};

// the `delete` method is called when a device has been deleted by a user
module.exports.deleted = function (device_data, callback) {
	delete devices[device_data.id];
	callback(null, true);
};

// the `pair` method is called when a user start pairing
module.exports.pair = (socket) => {

	socket.on('list_devices', (data, callback) => {

		const founddevices = [];
		const tempdevice_data = [];
		getPlayersaddresses(founddevices, (returnedips) => {
			console.log(returnedips);
			// playersfound = returnedips;

			for (let i = 0; i < returnedips.length; i++) {
				let objectname = '';
				let objectmanufacturer = '';
				console.log(returnedips[i]);
        // get xml file
				geturldata('GET', `http://${returnedips[i]}${playerxml}`, (xml) => {
					// console.log('=======================================');
					// console.log(xml);
					// console.log('=======================================');
              // Set devicename the friendlyName
					objectname = xml.substring(xml.indexOf('<friendlyName>') + 14, xml.indexOf('</friendlyName>'));
              // read manufacturer
					objectmanufacturer = xml.substring(xml.indexOf('<manufacturer>') + 14, xml.indexOf('</manufacturer>'));

				});

        // get devicestatus by httpapi call
				geturldata('GET', `http://${returnedips[i]}${httpapi}${apidevicestatus}`, (devicestatus) => {
					console.log('=======================================');
					console.log(JSON.parse(devicestatus, null, ''));
					console.log('=======================================');
					const result = JSON.parse(devicestatus, null, '');
					tempdevice_data.push({
						name: objectname,
						data: {
							manufacturer: objectmanufacturer,
							hardware: result.hardware,
							mac: result.MAC,
							ip: result.apcli0,
						},
					});
				});

			}
			tempdevice_data.push({
				name: 'test',
				data: {
					manufacturer: 'iEast',
				},
			});
		});
		console.log(tempdevice_data);
		const device_data = tempdevice_data;
		// callback(null, device_data);

		// even when we found another device, these can be shown in the front-end
		setTimeout(() => {
			// socket.emit('list_devices', device_data);
			callback(null, device_data);
		}, 20000);

	});

	socket.on('disconnect', () => {
		console.log('User aborted pairing, or pairing is finished');
	});

};

// these are the methods that respond to get/set calls from Homey
// for example when a user pressed a button
module.exports.capabilities = {};
module.exports.capabilities.onoff = {};
module.exports.capabilities.onoff.get = function (device_data, callback) {

	var device = getDeviceByData(device_data);
	if (device instanceof Error) return callback(device);

	return callback(null, device.state.onoff);

};
module.exports.capabilities.onoff.set = function (device_data, onoff, callback) {

	var device = getDeviceByData(device_data);
	if (device instanceof Error) return callback(device);

	device.state.onoff = onoff;

    // here you would use a wireless technology to actually turn the device on or off

    // also emit the new value to realtime
    // this produced Insights logs and triggers Flows
	self.realtime(device_data, 'onoff', device.state.onoff);

	return callback(null, device.state.onoff);

};

// a helper method to get a device from the devices list by it's device_data object
function getDeviceByData(device_data) {
	var device = devices[device_data.id];
	if (typeof device === 'undefined') {
		return new Error('invalid_device');
	} else {
		return device;
	}
}

// a helper method to add a device to the devices list
function initDevice(device_data) {
	devices[device_data.id] = {};
	devices[device_data.id].state = { onoff: true };
	devices[device_data.id].data = device_data;
}

// Get IP addresses of potential iEast players
function getPlayersaddresses(playersfound, callback) {
	// playersfound.push('192.168.2.23');
	let Playeraddress;
	let Playerheaders = [];
	client.on('response', (headers, code, rinfo) => {
		// console.log(JSON.parse(JSON.stringify(rinfo, null, '  ')));
		// console.log(JSON.parse(JSON.stringify(headers, null, '  ')));
		Playeraddress = JSON.parse(JSON.stringify(rinfo, null, '  '));
		Playerheaders = JSON.parse(JSON.stringify(headers, null, '  '));
		// check if address is already in array and is not []
		if (playersfound.indexOf(Playeraddress.address) === -1 || playersfound.length === 0) {
			// check if header has description.xml at specific port in header LOCATION
			if (Playerheaders.LOCATION.indexOf(playerxml) > -1) {
				// check description.xml Linkplay Technology Inc. or iEast
				// checkdescriptionxml(Playeraddress.address);
				// add address to collection
				playersfound.push(Playeraddress.address);
			}
		}
	});

	// client.search('urn:schemas-tencent-com:service:QPlay:1');
	client.search('ssdp:all');
	// And after 10 seconds, you want to stop
	setTimeout(() => {
		client.stop();
		callback(playersfound);
	}, 10000);

}

// Get url data

function geturldata(urlmethod, url, callback) {
	const options = {
		method: urlmethod,
		uri: url,
	};
	console.log(urlmethod);
	console.log(url);
	request(options, (error, response, body) => {
		// Check for error
		if (error) {
			console.log('Error: ', error);
			body = null;
		}
		if (!error && response.statusCode === 200) {
			// console.log(body);
			callback(body);
		}
	});
}

function hextoascii(str1) {
	const hex = str1.toString();
	let str = '';
	for (let n = 0; n < hex.length; n += 2) {
		str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
	}
	return str;
}
