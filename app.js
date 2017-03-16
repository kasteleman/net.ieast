'use strict';

const Client = require('node-ssdp').Client;
const client = new Client();
const playersfound = [];
const playerxml = ':49152/description.xml';
const httpapi = '/httpapi.asp?command=';
const apidevicestatus = 'getStatusEx';
const apiplayerstatus = 'getPlayerStatus';
const apisetplayer = 'setPlayerCmd:';
const request = require('request');
// list of currently configured devices
const devices = [];

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

module.exports.init = (devicesData) => {
	console.log('iEast AudioCast app starting');

	getPlayersaddresses((num) => {
		console.log('testje....');
		console.log(`callback called! ${num}`);
		console.log(playersfound.length);
		for (let i = 0; i < num.length; i++) {
			console.log(playersfound[i]);

			// get xml file
			let result = {};
			geturldata('GET', `http://${playersfound[i]}${playerxml}`, (xml) => {
				console.log('=======================================');
				console.log(xml);
				console.log('=======================================');
				result = {
					// Set devicename the friendlyName
					name: xml.substring(xml.indexOf('<friendlyName>') + 14, xml.indexOf('</friendlyName>')),
					data: {
						manufacturer: xml.substring(xml.indexOf('<manufacturer>') + 14, xml.indexOf('</manufacturer>')),
						address: playersfound[i],
					},
				};
			});

			// get devicestatus by httpapi call
			geturldata('GET', `http://${playersfound[i]}${httpapi}${apidevicestatus}`, (devicestatus) => {
				console.log('=======================================');
				console.log(JSON.parse(devicestatus, null, ''));
				const DeviceStatus = JSON.parse(devicestatus, null, '');
				console.log('=======================================');
				result.data.hardware = DeviceStatus.hardware;
				console.log(result);
			});

			// get playerstatus by httpapi call
			geturldata('GET', `http://${playersfound[i]}${httpapi}${apiplayerstatus}`, (playerstatus) => {
				console.log('=======================================');
				console.log(JSON.parse(playerstatus, null, ''));
				console.log('=======================================');
				const PlayerStatus = JSON.parse(playerstatus, null, '');
				result.data.status = PlayerStatus.status;
				result.data.curpos = parseInt(PlayerStatus.curpos) / 1000;
				result.data.totlen = parseInt(PlayerStatus.totlen) / 1000;
				result.data.Title = hextoascii(PlayerStatus.Title);
				result.data.Artist = hextoascii(PlayerStatus.Artist);
				result.data.Album = hextoascii(PlayerStatus.Album);
				result.data.vol = PlayerStatus.vol;
				result.data.mute = PlayerStatus.mute;
				result.data.loop = PlayerStatus.loop;
				result.data.Album = PlayerStatus.Album;

				devices.push(result);
				console.log(devices);
			});
		}
	});

};

// Get IP addresses of potential iEast players
function getPlayersaddresses(callback) {
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
		callback(playersfound);
		client.stop();
	}, 10000);

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
			return console.log('Error: ', error);
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
