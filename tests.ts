import { getNextMockVideoPath, getRoomsFromFirstClient, click, connected, logger } from './utils';
import * as mocha from 'mocha';
import * as express from 'express';
import { Janus } from 'janus-gateway-node';
import { v1 as uuidv1 } from 'uuid';
const pause = (n:number) => new Promise((resolve) => setTimeout(() => resolve(), n));
const expect = require(`chai`).expect;
const path = require(`path`);
const http = require('http');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const fs = require('fs');
const port = 3000;



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



const launchClient = async (headless, video, user_id) => {
	
	const width = 950;

	const height = 900;

	const flags = [
		'--ignore-certificate-errors',
		'--no-sandbox',
		'--use-fake-ui-for-media-stream',
		'--use-fake-device-for-media-stream',
		`--window-size=${width},${height}`,
		`--use-file-for-fake-video-capture=${video}`
	];

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
		client 
	};

};



describe(
	`test`,
	() => {
		
		it(
		   `test`,
			async function() {

				this.timeout(0);

				const publishers = 1;
				
				const nRooms = 2;

				const nClients = nRooms * publishers;

				//const httpServer : any = await launchServer();
				
				const janus = new Janus({
					logger,
					keepAliveTimeout:30000,
					syncInterval:30000,
					instancesAmount:1,
					dockerJanusImage:'herbert1947/janus-gateway-videoroom',
					generateId: () => uuidv1(),
					retrieveContext: () => {

						try {
					
							const contextPath = path.resolve('context.json');
					
							const file = fs.readFileSync(contextPath, 'utf-8');
					
							const context = JSON.parse(file);
					
							logger.info('context loaded');
					
							logger.json(context);
					
							return context;
					
						} catch(error) {
					
							logger.error(error);
					
							return {};
					
						}
					
					}, 
					updateContext: async (rooms) => {

						try {
							
							const contextPath = path.resolve('context.json');
					
							const file = JSON.stringify(rooms);
					
							logger.info('update context');
					
							logger.json(rooms);
					
							const fsp = fs.promises;
					
							await fsp.writeFile(contextPath, file, 'utf8');
							
						} catch(error) {
					
							logger.error(error);
							
						}
					
						return rooms;
					
					},
					onConnected : () => {
						
						logger.info(`janus - connected`);
						
					},
					onDisconnected : () => {
						
						logger.info(`janus - disconnected`);
						
					},
					onError : (error) => {
						
						logger.error(error);

					}
				});
				
				await janus.initialize();
				
				await pause(3500);
				
				for(let i = 0; i < nRooms; i++) {
					const result = await janus.createRoom({
						load: {
							description: uuidv1(),
							bitrate: 58000,
							bitrate_cap: false,
							fir_freq: undefined,
							videocodec:i===0 ? "vp8" : "vp9",
							vp9_profile:i===0 ? undefined : "2"
						}
					});
					logger.json(result);
				}

				await pause(35000000);
				/*
				const ps = [];

				for(let i = 0; i < nClients; i++) {
					const p = getNextMockVideoPath();
					logger.info(p);
					ps.push(
						launchClient(false, p, i)
					);
				}

				await Promise.all(ps);
				
				await pause(1000000000);

				for(let i = 0; i < nClients; i++) {
					const { browser } = await ps[i];
					await browser.close();
				}

				await janus.terminate();
				*/

				//await httpServer.close();

			}
		);
	}
);
