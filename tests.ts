import * as mocha from 'mocha';
import * as express from 'express';
import Janus from './janus-gateway-node/lib/janus-gateway-node';
import { v1 as uuidv1 } from 'uuid';
import { exec } from 'child_process';
const expect = require(`chai`).expect;
const path = require(`path`);
const http = require('http');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const port = 3000;



const pause = (n:number) => new Promise((resolve) => setTimeout(() => resolve(), n));



const logger = {
	info : (message) => {

		//console.log("\x1b[32m", `[test] ${message}`);

	},
	browser : (message) => {

		//console.log("\x1b[33m", `[test] ${message}`);

	},
	error : (message) => {

		/*
		if (typeof message==="string") {
			console.log("\x1b[31m", `[test] ${message}`);
		} else {
			try {
				const string = JSON.stringify(message, null, 2);
				console.log("\x1b[31m", `[test] ${string}`);
			} catch(error) {}
		}
		*/

	},
	json : (object) => {

		//const string = JSON.stringify(object, null, 2); 

		//console.log("\x1b[37m", `[test] ${string}`);

	}
};



const generateInstances = (amount:number) => {

	const instances = [];
	const start_ws_port = 8188;
	const start_admin_ws_port = 7188;

	for(let i = 0; i < amount; i++) {
		instances.push({
			id : uuidv1(),
			admin_key : uuidv1(),
			server_name : `instance_${i}`,
			log_prefix : `instance_${i}:`,
			docker_ip : `127.0.0.${1 + i}`, //"127.0.0.1", 
			ws_port : start_ws_port + i,
			admin_ws_port : start_admin_ws_port + i,
			stun_server : "stun.voip.eutelia.it",
			stun_port : 3478,
			debug_level : 5 //6
		});
	}
	
	return instances;
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

			resolve();
	
		});
	});
};



const launchClient = async (headless, video, user_id) => {
	
	const mocksFolder = `C:\\Users\\clint\\Downloads\\mocks`;

	const flags = [
		'--ignore-certificate-errors',
		'--no-sandbox',
		'--use-fake-ui-for-media-stream',
		'--use-fake-device-for-media-stream',
		`--use-file-for-fake-video-capture=${mocksFolder}\\${video}`
	];

	const browser = await puppeteer.launch({ headless, args: flags });

	const debug = await browser.newPage();

	const client = await browser.newPage();

	await debug.goto(`chrome://webrtc-internals/`);

	const p = 8080;

	const host = `127.0.0.1`;

	await client.goto(`http://localhost:${port}?search&user_id=${user_id}&host=${host}&port=${p}`);

	client.on('console', msg => {

		logger.browser(`message from browser: ${msg.text()}`);
		
	});

	//await client.evaluate(() => {});

	return browser;
};



const launchContainers = (image, instances) => {

	logger.info(`launching ${instances.length} containers`);

	logger.json(instances);

	const step = 101;

	let udpStart = 20000;

	let udpEnd = udpStart + step - 1;

	for(let i = 0; i < instances.length; i++) {
		const {
			id,
			admin_key,
			server_name,
			ws_port,
			log_prefix,
			admin_ws_port,
			stun_server, 
			stun_port,
			docker_ip,
			debug_level
		} = instances[i];
		
		const args = [
			[ "ID", id ],
			[ "ADMIN_KEY", admin_key ],
			[ "SERVER_NAME", server_name ],
			[ "WS_PORT", ws_port ],
			[ "ADMIN_WS_PORT", admin_ws_port ],
			[ "LOG_PREFIX", log_prefix ],
			[ "DOCKER_IP", docker_ip ],
			[ "DEBUG_LEVEL", debug_level ],
			[ "RTP_PORT_RANGE", `${udpStart}-${udpEnd}` ],
			[ "STUN_SERVER", stun_server ],
			[ "STUN_PORT", stun_port ]
		];
		
		let command = `docker run -i --cap-add=NET_ADMIN --name ${server_name} `;
		//--publish-all=true
		//-P
		//--network=host
		//-p 127.0.0.1:20000-40000:20000-40000
		//command += `-p 127.0.0.1:${udpStart}-${udpEnd}:${udpStart}-${udpEnd}/udp `;
		command += `-p ${docker_ip}:${udpStart}-${udpEnd}:${udpStart}-${udpEnd}/udp `;
		command += `-p ${ws_port}:${ws_port} `;
		command += `-p ${admin_ws_port}:${admin_ws_port} `;
		command += `${args.map(([name,value]) => `-e ${name}="${value}"`).join(' ')} `;
		command += `${image}`;
		
		logger.info(`launching container ${i}...${command}`);

		exec(
			command,
			{
				maxBuffer: 1024 * 1024 * 1024
			},
			(error, stdout, stderr) => {
				
				logger.info(`container ${server_name} terminated`);

				if (error) {
					if (error.message) {
						logger.error(error.message);
					} else {
						logger.error(error);
					}
				}
			}
		);

		udpStart += step;
		udpEnd += step;
	}
};



const terminateContainers = async () => {

	const command = `FOR /F %A IN ('docker ps -q') DO docker stop %~A`; //`docker stop $(docker ps -a -q)`;

	try {

		const result = await exec(
			command
		);

	} catch(error) {

		

	}
};



const instancesToConfigurations = (instances) => {

	const data = instances.map(({
		admin_key,
		server_name,
		ws_port,
		docker_ip,
		admin_ws_port,
		log_prefix,
		stun_server, 
		stun_port,
		id,
		debug_level
	}) => {
		return {
			protocol: `ws`,
			address: docker_ip,
			port: ws_port,
			adminPort: admin_ws_port,
			adminKey: admin_key,
			server_name
		};
	});

	return data;
};



describe(
	`publishing`,
	() => {

		after(async () => {
			
			await terminateContainers();

		});

		it(
		   `initial connection`,
			async function() {

				this.timeout(0);

				await launchServer();
				
				const instances = generateInstances(1);
				
				launchContainers('janus-gateway', instances);

				const configs = instancesToConfigurations(instances);

				await pause(3000);
				
				const janus = new Janus({
					instances: configs,
					selectInstance:(instances) => {

						const sorted = instances.sort((a,b) => {
							const aHandles = Object.values(a.handles);
							const bHandles = Object.values(b.handles);
							return aHandles.length - bHandles.length;
						});
						
						let instance = sorted[0];
						
						return instance;

					},
					onConnected:() => {
						

						
					},
					onDisconnected:() => {
						
						

					},
					onError: (error) => {
						
						

					}
				});
				
				await janus.initialize();
				
				await pause(1500);
				
				await launchClient(false, "husky_cif.y4m", 13);

				await launchClient(false, "flower_cif.y4m", 14);
				
				await pause(800000);
			}
		);
	}
);
