import * as mocha from 'mocha';
import * as express from 'express';
import { Janus } from './janus-gateway-node/dist';
import { v1 as uuidv1 } from 'uuid';
import { exec } from 'child_process';
const pause = (n:number) => new Promise((resolve) => setTimeout(() => resolve(), n));
const expect = require(`chai`).expect;
const path = require(`path`);
const http = require('http');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const port = 3000;
const fs = require('fs');
const util = require('util');
const logFile = fs.createWriteStream(__dirname + '/test.log', { flags : 'w' });



let enable = true;



const logger = {
	enable: () => {

        enable = true;
    
    },
    disable: () => {
    
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
					const string = JSON.stringify(message, null, 2);
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



const click = async (client, query) => {

	await client.waitForSelector(query);

	await pause(500);

	const target = (await client.$$(query))[0];

	await target.click();

	await pause(500);

	return target;

}



const getRooms = async (client, query) => {

	const rooms = (await client.$$(query));

	const roomsText = [];

	for(let i = 0; i < rooms.length; i++) {

		const element = rooms[i];

		const text = await client.evaluate((element) => {
			
			return element.textContent;
			
		}, element);

		roomsText.push(text);

	}

	return roomsText;

}



const connected = async (client) => {
	
	await client.waitForSelector('.room-element');
		
}



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
			debug_level : 4 //5 //6
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



const mocksFolder = `C:\\Users\\clint\\Downloads\\mocks`;



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

	const host = `127.0.0.1`;

	await client.goto(`http://localhost:${port}?search&user_id=${user_id}&host=${host}&port=${p}`);
	
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

	const command = `FOR /F %A IN ('docker ps -q') DO docker rm -f %~A`; //docker stop

	//docker rm $(docker ps -a -q)

	try {

		const result = await exec(
			command
		);

	} catch(error) {}

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



const retrieveContext = () => {

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

};



const updateContext = async (rooms) => {

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

};



const mockVideos = fs.readdirSync(mocksFolder)
.filter((entry) => {

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



const getRoomsFromFirstClient = async (ps) => {

	const { client } = await ps[0];

	await click(client, '#connect');

	await connected(client);

	let rooms = await getRooms(client, '.room-id');

	await click(client, '#disconnect');

	rooms = rooms.filter((room_id) => room_id.length > 5);

	return rooms;

}



describe(
	`test`,
	() => {
		
		it(
		   `test`,
			async function() {

				this.timeout(0);

				const publishers = 6;

				const nInstances = 2;
				
				const nRooms = 1;

				const nClients = nRooms * publishers;

				await launchServer();
				
				const instances = generateInstances(nInstances);
				
				launchContainers('janus-gateway', instances);

				const configs = instancesToConfigurations(instances);

				await pause(3000);
				
				const janus = new Janus({
					getId: () => uuidv1(),
					instances: configs,
					retrieveContext, 
					updateContext,
					logger,
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
				
				await pause(1500);
				
				for(let i = 0; i < nRooms; i++) {
					const result = await janus.createRoom({
						load: {
							description: uuidv1()
						}
					});
					logger.json(result);
				}
				
				const ps = [];

				for(let i = 0; i < nClients; i++) {
					const p = getNextMockVideoPath();
					logger.info(p);
					ps.push(
						launchClient(false, p, i)
					);
				}

				await Promise.all(ps);
				
				const rooms = await getRoomsFromFirstClient(ps);

				await pause(1000);

				const f = async (id, client, interval) => {
					await click(client, '#connect');
					await connected(client);
					await pause(300);
					await click(client, `#join-${id}`);
					await pause(interval);
					await click(client, `#leave-${id}`);
					await pause(2000);
					await click(client, '#disconnect');
				};

				const list = [];
				
				for(let i = 0; i < rooms.length; i++) {
					const id = rooms[i];
					const start = i * publishers;
					for(let j = start; j < start + publishers; j++) {
						const { client } = await ps[j];
						const p = f(id, client, 60000);
						list.push(p);
					}
				}

				await Promise.all(list);

				for(let i = 0; i < nClients; i++) {
					const { browser } = await ps[i];
					await browser.close();
				}

				await janus.terminate();

				await terminateContainers();

			}
		);
	}
);
