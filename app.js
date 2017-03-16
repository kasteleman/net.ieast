'use strict';

const Client = require('node-ssdp').Client;
const client = new Client();
// const playersfound = [];
const playerxml = ':49152/description.xml';
const httpapi = '/httpapi.asp?command=';
const apidevicestatus = 'getStatusEx';
const apiplayerstatus = 'getPlayerStatus';
const apisetplayer = 'setPlayerCmd:';
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
	const playersfound = [];
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
			// console.log(body.substring(body.indexOf('<manufacturer>') + 14, body.indexOf('</manufacturer>')));
			// console.log(body.substring(body.indexOf('<friendlyName>') + 14, body.indexOf('</friendlyName>')));
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

// Get the device status by httpapi

function getdevicestatus(ip, devicename) {
	const url = `http://${ip}${httpapi}${apidevicestatus}`;
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
			const devicestatus = console.log(JSON.parse(body, null, ''));
			console.log(devicestatus);
			return devicestatus;
		}
	});
}

// Get the player status by httpapi

function getplayerstatus(ip, devicename) {
	const url = `http://${ip}${httpapi}${apiplayerstatus}`;
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
			const playstatus = console.log(JSON.parse(body, null, ''));
			console.log(playstatus);
			return playstatus;
		}
	});
}

// Send command to the player by httpapi

function setplayercommand(ip, setcommand) {
	const url = `http://${ip}${httpapi}${apisetplayer}`;
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
			return feedback;
		}
	});
}

// Get url data

function geturldata(urlmethod, url) {
	const options = {
		method: urlmethod,
		uri: url,
	};
	console.log(urlmethod);
	console.log(url);
	request(options, (error, response, body) => {
		// Check for error
		if (error) {
			return console.log('Error: ', error);
		}
		if (!error && response.statusCode === 200) {
			const devicestatus = console.log(JSON.parse(body, null, ''));
			console.log(body);
			return body;
		}
	});
}

module.exports.init = (devicesData, callback) => {
	console.log('iEast AudioCast app starting');
	// Get the possible playerdevices ip addresses
	// getPlayersaddresses();
	// playersfound.push('192.168.2.23');
	// const output = playersfound.forEach(checkdescriptionxml);
	// console.log(output);
	// getdevicestatus('192.168.2.22', 'Living Room');
	// getplayerstatus('192.168.2.22', 'Living Room');
	
	console.log(getPlayersaddresses());
	
	const myStringArray = getPlayersaddresses();
	const arrayLength = myStringArray.length;
	for (var i = 0; i < arrayLength; i++) {
	    console.log(myStringArray[i]);
	    //Do something
	}
	
	console.log(geturldata(GET, `http://192.168.2.22${playerxml}`));
	console.log(geturldata(GET, `http://192.168.2.22${httpapi}${apidevicestatus}`));
	console.log(geturldata(GET, `http://192.168.2.22${httpapi}${apiplayerstatus}`));
	
	callback(null, true);
}
