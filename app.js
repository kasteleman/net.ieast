'use strict';

const Client = require('node-ssdp').Client;
const client = new Client();
const playersfound = [];
const playerxml = ':49152/description.xml';
const request = require('request');
// list of currently configured devices
const devices = {};
// list of currently found devices
let clients = {};

const manufacturers = {
	iEAST: {
		hardware: 'A11',
	},
	'Linkplay Technology Inc.': {
		hardware: 'A31',
	},
};

// Get IP addresses of potential iEast players
function getPlayersaddresses() {
	let Playeraddress;
	let Playerheaders = [];
	client.on('response', function inResponse(headers, code, rinfo) {
		// console.log(JSON.parse(JSON.stringify(rinfo, null, '  ')));
		// console.log(JSON.parse(JSON.stringify(headers, null, '  ')));
		Playeraddress = JSON.parse(JSON.stringify(rinfo, null, '  '));
		Playerheaders = JSON.parse(JSON.stringify(headers, null, '  '));
		// check if address is already in array and is not []
		if (playersfound.indexOf(Playeraddress.address) === -1 || playersfound.length === 0) {
			// check if header has description.xml at specific port in header LOCATION
			if (Playerheaders.LOCATION.indexOf(playerxml) > -1) {
				// check description.xml Linkplay Technology Inc. or iEast
				checkdescriptionxml(Playeraddress.address);
				// add address to collection
				playersfound.push(Playeraddress.address);
			}
		}
		console.log(playersfound);
	});

	// client.search('urn:schemas-tencent-com:service:QPlay:1');
	client.search('ssdp:all');
	// And after 10 seconds, you want to stop
	setTimeout(function () {
		client.stop();
	}, 10000);
}

function checkdescriptionxml(ip) {
	const url = 'http://' + ip + playerxml;
	const options = {
		method: 'GET',
		uri: url,
	};
	request(url, function (error, response, body) {
		// Check for error
		if (error) {
			return console.log('Error: ', error);
		}
		if (!error && response.statusCode === 200) {
			const result = [];
			// console.log(JSON.stringify(body, null, ''));
			// const manufacturer = body.substring(body.indexOf('<manufacturer>') + 14, body.indexOf('</manufacturer>'));
			// console.log(manufacturer);
			// const friendlyName = body.substring(body.indexOf('<friendlyName>') + 14, body.indexOf('</friendlyName>'));
			// console.log(friendlyName)
			// if ()
			result.push({
				devicemanufacturer: body.substring(body.indexOf('<manufacturer>') + 14, body.indexOf('</manufacturer>')),
				devicefriendlyname: body.substring(body.indexOf('<friendlyName>') + 14, body.indexOf('</friendlyName>')),
				deviceaddress: ip,
			});
			console.log(result);
			return result;
		}
	});
}

module.exports.init = () => {
	console.log('iEast AudioCast app starting');
	// Get the possible playerdevices ip addresses
	getPlayersaddresses();
	playersfound.push('192.168.2.23');
	// const output = playersfound.forEach(checkdescriptionxml);
	// console.log(output);
};

/*
 * This method will be run when starting to pair.
 */
module.exports.pair = (socket) => {
	socket.on('list_devices', (data, callback) => {
//			getJson().then(json => {
//				const result = parseJson(json);
//				const listDevices = getListDevices(result);
		console.log('searching for devices');
		const listDevices = playersfound.forEach(checkdescriptionxml);
		callback(null, listDevices);
//			}).catch(function(error) {
//				_debug('Failed to get a list of devices', error);
//				callback('Failed to get a list of devices.', null);
//			});
	});
	socket.on('disconnect', () => {
		console.log('User aborted pairing, or pairing is finished');
	});
};
