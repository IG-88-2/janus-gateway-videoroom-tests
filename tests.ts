import { pause } from './utils/pause';
import { spawnProcess } from './utils/spawnProcess';
import * as mocha from 'mocha';
import * as express from 'express';
import { Janus } from './janus-gateway-node/janus-gateway-node';
import { v1 as uuidv1 } from 'uuid';
import { logger } from './utils/logger';
import child_process = require('child_process');
const expect = require(`chai`).expect;
const http = require('http');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const port = 3000;
const fs = require('fs');
const path = require(`path`);

const terminateInstances = async () => {
	
	const command = process.platform==='linux' ? `docker rm $(docker ps -a -q)` : `FOR /F %A IN ('docker ps -q') DO docker rm -f %~A`;
	
	try {

		const result = await child_process.exec(
			command
		);

	} catch(error) {

		console.error(error);

	}
	
}

const runLaunchInstancesScript = (p: number) => {
	
    const source = spawnProcess("launchInstances.js");

	source.stdout.setEncoding('utf8');

	source.stderr.setEncoding('utf8');

	source.stdout.on('data', function(data) {
		//data.toString()
		console.log('stdout: ' + data);
	});
	
	source.stderr.on('data', function(data) {
		//data.toString()
		console.log('stderr: ' + data);
	});
    
    const promise = new Promise((resolve) => {
		
		source.on("message", (data) => {
			//TODO exec docker not calling callback - hence pause
			pause(p)
			.then(() => {
				source.send({
					type:"exit"
				});
				resolve(data);
			});
			
		});
		
	});

    source.send({
		type:"launch", 
		load: {
			image: "herbert1947/janus-gateway-videoroom",
			n: 2
		}
	});

    return promise;
}



describe(
	`test`,
	() => {
		
		it(
		   `test`,
			async function() {

				this.timeout(0);
				
				console.log('start');

				const instances = await runLaunchInstancesScript(3000);

				console.log('instances', instances);

				await pause(1000);

				await terminateInstances();
				
			}
		);
	}
);



/*
const nRooms = 5;

const nClients = 5;

//const httpServer : any = await launchServer();

let instances = null;

try {
	const instancesPath = path.resolve('instances.json');
	const result = fs.readFileSync(instancesPath, 'utf-8');
	instances = JSON.parse(result);
} catch(e) {}

const generateInstances = instances ? () => instances : undefined; 

interface JanusInstanceOptions {
	protocol: string,
	address: string,
	port: number,
	adminPort: number,
	adminKey: string,
	server_name: string
}

const janus = new Janus({
	instances: [] as JanusInstanceOptions[],
	logger,
	onError: (error) => {
		
		logger.error(error);

	}
});

await janus.initialize();

const exitHandler = async () => {
	//process.stdin.resume();
	//await janus.terminate();
	//await httpServer.close();
	//process.exit(0);
};

process.on('exit', exitHandler);
//catches ctrl+c event
process.on('SIGINT', exitHandler);

await pause(3500);

for(let i = 0; i < nRooms; i++) {
	const result = await janus.createRoom({
		load: {
			description: i%2 ? `Cool vp8 room (${i})` : `Cool vp9 room (${i})`,
			bitrate: 512000,
			bitrate_cap: false,
			fir_freq: undefined,
			videocodec:i===0 ? "vp8" : "vp9",
			vp9_profile:i===0 ? undefined : "1"
		}
	});
	logger.json(result);
}

let ps = [];

for(let i = 0; i < nClients; i++) {
	const p = getNextMockVideoPath();
	logger.info(p);
	const width = 950;
	const height = 900;
	const flags = [
		'--ignore-certificate-errors',
		'--no-sandbox',
		`--window-size=${width},${height}`
	];
	//if (i===0) {
	flags.push(
		'--use-fake-ui-for-media-stream',
		'--use-fake-device-for-media-stream',
		`--use-file-for-fake-video-capture=${p}`
	);
	//}
	ps.push(
		launchClient({
			headless: false, 
			user_id: i, 
			flags, 
			width, 
			height 
		})
	);
}

ps = await Promise.all(ps);

let rooms : any = await janus.getRooms();

rooms = rooms.load.filter((room) => room.secret);

for(let i = 0; i < rooms.length; i++) {
	const room = rooms[i];
	const id = room.room_id;
	for(let j = 0; j < nClients; j++) {
		const { client } = ps[j];
		await client.waitForSelector('.room');
		await pause(1000);
		try {
			await click(client, `#room-${id}`);
		} catch(error) {
			logger.error(error);
		}
	}
	for(let j = 0; j < nClients; j++) {
		const { client } = ps[j];
		for(let k = 0; k < nClients; k++) {
			if (k===j) {
				continue;
			}
			const { user_id } = ps[k];
			await client.waitForSelector(`#video-${user_id}`, { timeout: 10000 });
			const r = await client.evaluate((user_id) => {

				const video : any = document.getElementById(`video-${user_id}`);

				if (!video) {
					return;
				}

				return {
					currentTime: video.currentTime, 
					paused: video.paused, 
					ended: video.ended, 
					readyState: video.readyState,
					streamActive: video.srcObject.active,
					streamId:video.srcObject.id
				};

			}, user_id);
			const {
				streamActive,
				streamId
			} = r;
			expect(streamActive).to.equal(true);
			expect(streamId).to.equal('janus');
		}
	}
	await pause(1000);
}

for(let i = 0; i < nClients; i++) {
	const { browser } = await ps[i];
	await browser.close();
}

await janus.terminate();

//await httpServer.close();
*/