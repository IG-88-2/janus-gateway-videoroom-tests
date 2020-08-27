import * as mocha from 'mocha';
import * as express from 'express';
import { Janus } from './janus-gateway-node/janus-gateway-node';
import { v1 as uuidv1 } from 'uuid';
const expect = require(`chai`).expect;
const http = require('http');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const port = 3000;
const fs = require('fs');
const logFile = fs.createWriteStream(__dirname + '/test.log', { flags : 'w' });
const util = require('util');
const pause = (n:number) => new Promise((resolve) => setTimeout(() => resolve(), n));
const path = require(`path`);
const mocksFolder = `C:\\Users\\clint\\Downloads\\mocks`;
/*
const redis = require("redis");
const client = redis.createClient();
client.on("error", (error) => logger.error(error));
*/



const mockVideos = fs.readdirSync(mocksFolder).filter((entry) => {

	const extension = entry.split('.').pop();

	return extension==='y4m';

});



let counter = 0;



const getNextMockVideoPath = () => {

	let next = mockVideos[counter];

	if (!next) {
		counter = 0;
		next = mockVideos[counter];
	}

	counter++;
	
	return path.resolve(mocksFolder, next);

}



const click = async (client, query) => {

	await client.waitForSelector(query);

	await pause(500);

	const target = (await client.$$(query))[0];

	await target.click();

	await pause(500);

	return target;

}



let enable = true;



const logger = {
	enable : () => {

        enable = true;
    
    },
    disable : () => {
    
        enable = false;
    
    },
	info : (message) => {

		if (enable) {
			console.log("\x1b[32m", `[test info] ${message}`);
			//logFile.write(util.format(message) + '\n');
		}

	},
	browser : (...args) => {

		if (enable) {
			if (args) {
				const message = args.join(' ');
				console.log("\x1b[33m", `[test browser] ${message}`);
				if (message.includes("error")) {
					logFile.write(util.format(message) + '\n');
				}
			}
		}

	},
	error : (message) => {
		
		if (enable) {
			if (typeof message==="string") {
				console.log("\x1b[31m", `[test error] ${message}`);
				logFile.write(util.format(message) + '\n');
			} else {
				try {
					const string = util.inspect(message, {showHidden: false, depth: null});
					console.log("\x1b[31m", `[test error] ${string}`);
					logFile.write(util.format(string) + '\n');
				} catch(error) {}
			}
		}

	},
	json : (object) => {

		if (enable) {
			const string = JSON.stringify(object, null, 2);
			console.log("\x1b[37m", `[test json] ${string}`);
			//logFile.write(util.format(string) + '\n');
		}

	}
};



const launchServer = () => {
	const staticPath = path.join(__dirname, "development");
	const app : any = express();
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({extended: true}));
	app.use(express.static(staticPath));
	app.get('*', (req, res) => {       

		res.sendFile(path.resolve(staticPath, 'index.html'));    

	});
	const httpServer = http.createServer(app);
	return new Promise((resolve) => {

		httpServer.listen(port, () => {

			logger.info(`server listening on port ${port}`);

			resolve(httpServer);
	
		});

	});
};



const launchClient = async ({ headless, user_id, flags, width, height }) => {
	const browser = await puppeteer.launch({ headless, args: flags });
	const debug = await browser.newPage();
	const client = await browser.newPage();
	await debug.goto(`chrome://webrtc-internals/`);
	const p = 8080;
	//const user_id = this.options.user_id;
	const aws = `3.121.126.200`;
	let host = `127.0.0.1`;
	const server = `ws://${host}:8080/?id=${user_id}`;
	await client.goto(`http://localhost:${port}?search&user_id=${user_id}&host=${host}&port=${p}`); //http://localhost:3000?search&user_id=12&host=127.0.0.1&port=8080
	await client.setViewport({ width, height });
	client.on('console', async (e) => {

		const args = await Promise.all(e.args().map((a) => a.jsonValue()));

		logger.browser(...args);
		
	});
	//await client.evaluate(() => {});
	return { 
		browser, 
		client,
		user_id
	};
};



const retrieveContextFile = async () => {
	try {
		const contextPath = path.resolve('context.json');
		const file = fs.readFileSync(contextPath, 'utf-8');
		const context = JSON.parse(file);
		logger.info('context loaded');
		//logger.json(context);
		return context;
	} catch(error) {
		logger.error(error);
		return {};
	}
}



const updateContextFile = async (rooms) => {
	try {
		const contextPath = path.resolve('context.json');
		const file = JSON.stringify(rooms);
		logger.info('update context');
		//logger.json(rooms);
		const fsp = fs.promises;
		await fsp.writeFile(contextPath, file, 'utf8');
	} catch(error) {
		logger.error(error);
	}
	return rooms;
}



/*
const retrieveContextRedis = async () => {
	const context = {};
	const keys : string[] = await new Promise((resolve) => {
		client.keys('*', (err, keys) => {
			resolve(keys);
		});
	}); 
	if (keys) {
		for(let i = 0; i < keys.length; i++) {
			const key = keys[i];
			const value = await new Promise((resolve) => {
				client.get(key, (error, value) => {
					try {
						const v = JSON.parse(value);
						resolve(v);
					} catch(error) {
						resolve(null);
					}
				});
			});
			if (value) {
				context[key] = value;
			}
		}
	}
	return context;
}



const updateContextRedis = async (rooms) => {
	for(let id in rooms) {
		await new Promise((resolve) => {
			client.set(id, JSON.stringify(rooms[id]), () => {
				resolve();
			});
		})
	}
	return rooms;
}
*/



describe(
	`test`,
	() => {
		
		it(
		   `test`,
			async function() {

				this.timeout(0);
				
				const nRooms = 5;

				const nClients = 2;

				const httpServer : any = await launchServer();
				
				let instances = null;

				try {
					const instancesPath = path.resolve('instances.json');
					const result = fs.readFileSync(instancesPath, 'utf-8');
					instances = JSON.parse(result);
				} catch(e) {}
				
				const generateInstances = instances ? () => instances : undefined; 
				
				const janus = new Janus({
					logger,
					keepAliveTimeout:10000,
					syncInterval:10000,
					instancesAmount:2,
					generateId: () => uuidv1(),
					retrieveContext: retrieveContextFile, //retrieveContextRedis,
					updateContext: updateContextFile, //updateContextRedis,
					generateInstances,
					onError: (error) => {
						
						logger.error(error);

					}
				});
				
				await janus.initialize();

				const exitHandler = async () => {
					//process.stdin.resume();
					//await janus.terminate();
					await httpServer.close();
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
				
				const rooms = await janus.getRooms();

				for(let i = 0; i < rooms.load.length; i++) {
					const room = rooms.load[i];
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

				await httpServer.close();
				
			}
		);
	}
);
