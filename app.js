'use strict';

const Client = require('node-ssdp').Client;
const client = new Client();
const playersfound = [];
const playerxml = ':49152/description.xml';
const httpapi = '/httpapi.asp?command=';
const playerstatus = 'getPlayerStatus';
const setplayer = 'setPlayerCmd:';
const request = require('request');
// list of currently configured devices
const devices = {};

const manufacturers = {
	iEAST: {
		hardware: 'A11',
		icon: 'audiocast.svg',
	},
	'Linkplay Technology Inc.': {
		hardware: 'A31',
		icon: 'audiocast.svg',
	},
};

// Get IP addresses of potential iEast players
function getPlayersaddresses() {
	let Playeraddress;
	let Playerheaders = [];
	client.on('response', (headers, code, rinfo) => {
	// client.on('response', function inResponse(headers, code, rinfo) {
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
		return playersfound;
	});

	// client.search('urn:schemas-tencent-com:service:QPlay:1');
	client.search('ssdp:all');
	// And after 10 seconds, you want to stop
	setTimeout(() => {
		client.stop();
	}, 10000);
}

// get data from description.xml

function checkdescriptionxml(ip) {
	const url = `http://${ip}${playerxml}`;
	const options = {
		method: 'GET',
		uri: url,
	};
	request(options, (error, response, body) => {
		// Check for error
		if (error) {
			return console.log('Error: ', error);
		}
		if (!error && response.statusCode === 200) {
			// console.log(JSON.stringify(body, null, ''));
			// const manufacturer = body.substring(body.indexOf('<manufacturer>') + 14, body.indexOf('</manufacturer>'));
			// console.log(manufacturer);
			// const friendlyName = body.substring(body.indexOf('<friendlyName>') + 14, body.indexOf('</friendlyName>'));
			// console.log(friendlyName)
			// if ()
			const result = {
				// Set devicename the friendlyName
				name: body.substring(body.indexOf('<friendlyName>') + 14, body.indexOf('</friendlyName>')),
				data: {
					manufacturer: body.substring(body.indexOf('<manufacturer>') + 14, body.indexOf('</manufacturer>')),
					address: ip,
				},
			};
			console.log(result);
			return result;
		}
	});
}

// Get the player status

function getplayerstatus(ip, devicename) {
	const url = `http://${ip}${httpapi}${playerstatus}`;
	const options = {
		method: 'GET',
		uri: url,
	};
	console.log(url);
	request(options, (error, response, body) => {
		// Check for error
		if (error) {
			return console.log('Error: ', error);
		}
		if (!error && response.statusCode === 200) {
			const status = console.log(JSON.parse(body, null, ''));
			console.log(status);
			// return status;
		}
	});
}

// Send command to the player

function setplayercommand(ip, setcommand) {
	const url = `http://${ip}${httpapi}${setplayer}`;
	const options = {
		method: 'POST',
		uri: url,
	};
	console.log(url);
	request(options, (error, response, body) => {
		// Check for error
		if (error) {
			return console.log('Error: ', error);
		}
		if (!error && response.statusCode === 200) {
			const feedback = console.log(JSON.parse(body, null, ''));
			console.log(feedback);
			// return feedback;
		}
	});
}

module.exports.init = (devicesData, callback) => {
	console.log('iEast AudioCast app starting');
	// Get the possible playerdevices ip addresses
	getPlayersaddresses();
	// playersfound.push('192.168.2.23');
	const output = playersfound.forEach(checkdescriptionxml);
	console.log(output);
	getplayerstatus('192.168.2.22', 'Living Room');
};
