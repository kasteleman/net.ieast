'use strict';

const Client = require('node-ssdp').Client;
const client = new Client();
const playersfound = [];

// Get IP addresses of potential iEast players
function getPlayersaddresses() {
	let Playeraddress;
	client.on('response', function inResponse(headers, code, rinfo) {
		Homey.log(JSON.stringify(headers, null, '  '));
		Homey.log(JSON.stringify(rinfo, null, '  '));
		Playeraddress = JSON.parse(JSON.stringify(rinfo, null, '  '));
		if (playersfound.indexOf(Playeraddress.address) === -1 || playersfound.length === 0) {
			playersfound.push(Playeraddress.address);
		}
		Homey.log(playersfound);
	});

	// client.search('urn:schemas-tencent-com:service:QPlay:1');
	client.search('ssdp:all');
}
