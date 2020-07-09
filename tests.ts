import * as mocha from 'mocha';
import * as express from 'express';
import Janus from './janus-gateway-node/lib/janus-gateway-node';
import { v1 as uuidv1 } from 'uuid';
import { spawnSync } from 'child_process';
const { spawn, execSync } = require('child_process');
const expect = require(`chai`).expect;
const fs = require(`fs-extra`);
const path = require(`path`);
const http = require('http');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const Docker = require('dockerode');
const port = 3000;

//TODO 
//move configure to repo
//add configure program inclusion to docker script 

//during container execution
//duplicate configuration in temp space
//modify configuration using configure program (using env variables)
//launch janus pointing to modified configuration

//how do i setup env variables when launching docker container ?
//how do i access/use them inside ?

const pause = (n:number) => new Promise((resolve) => setTimeout(() => resolve(), n));


const launchJanus = async ({
	admin_key,
	server_name,
	ws_port,
	admin_ws_port,
	log_prefix
}) => {
	
	const temp = `${__dirname}/${uuidv1()}`;

	const src = "/opt/janus/etc/janus";

	const program = "/opt/janus/bin/janus";

	await fs.copy(src, temp);

	console.log(`copying files from ${src} to ${temp}`);

	const args = [
		"--admin_key",
		admin_key,
		"--server_name",
		server_name,
		"--config_base",
		temp,
		"--ws_port",
		ws_port,
		"--admin_ws_port",
		admin_ws_port,
		"--log_prefix",
		log_prefix
	];
	
	const command = `./configure ${args.join(" ")}`;

	console.log(command);

	try {

		const result = execSync(
			command,
			{
				stdio: 'inherit'
			}
		);

	} catch(error) {

		console.error(error);

	}
	
	const janus = spawn(program, [
		`--configs-folder=${temp}`
	]);

	janus.stdout.on('data', (data) => {
		console.log(`stdout: ${data}`);
	});

	janus.stderr.on('data', (data) => {
		console.error(`stderr: ${data}`);
	});

	janus.on('close', (code) => {
		console.log(`child process exited with code ${code}`);
	});
	
	janus.temp = temp;

	return janus;

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
		
			console.log('connected');

			resolve();
	
		});

	});
	
};



const launchClient = async (type, video) => {

  const browser = await puppeteer.launch({
    headless: true, //false,
    args: [
		'--ignore-certificate-errors',
		'--no-sandbox',
		'--use-fake-ui-for-media-stream',
		'--use-fake-device-for-media-stream',
		`--use-file-for-fake-video-capture=/home/herbert/Downloads/${video}`
    ]
  });

  const debug = await browser.newPage();

  const client = await browser.newPage();
  
  await debug.goto(`chrome://webrtc-internals/`);

  await client.goto(`http://localhost:${port}/?type=${type}`);

  client.on('console', msg => {
	  
	console.log('BROWSER', msg.text());
	
  });

  await client.evaluate(() => console.log(`url is ${location.href}`));
  
  return browser;
  
};



const launchDocker = async ({
	admin_key,
	server_name,
	ws_port,
	log_prefix,
	admin_ws_port,
	ps
}) => {

	const docker = new Docker();

	try {

		const p1 = `${ws_port}/tcp`;
		const p2 = `${admin_ws_port}/tcp`;

		const container = await docker.createContainer({
			Image: 'janus-gateway-videoroom',
			Tty: true,
			HostConfig: {
				PortBindings: {
					[p1]: [{ HostPort: `${ws_port}` }],
					[p2]: [{ HostPort: `${admin_ws_port}` }],
				}
			}
		});

		await container.start();

		/*
		const temp = `${__dirname}/${uuidv1()}`;

		const src = "/opt/janus/etc/janus";
	
		const program = "/opt/janus/bin/janus";
	
		await fs.copy(src, temp);
		
		const args = [
			"--admin_key",
			admin_key,
			"--server_name",
			server_name,
			"--config_base",
			temp,
			"--ws_port",
			ws_port,
			"--admin_ws_port",
			admin_ws_port,
			"--log_prefix",
			log_prefix
		];
		
		const command = `./configure ${args.join(" ")}`;
		*/
		
		const result = await container.exec({
			Cmd: ['/bin/sh', '-c', 'cd /opt/janus/bin/ && ./janus'],
			Env: [], //'VAR=ttslkfjsdalkfj'
			AttachStdout: true,
			AttachStderr: true
		});

		result.start((error, stream) => {

			if (error) {
				return;
			}

			stream.on('end', (e) => {

				console.log('on end', e);

			});

			stream.on('data', (d) => {

				console.log('on data', d.toString('utf8'));

			});
			
		});
		
		//await pause(20000);
		//await container.stop();
		//await container.remove();

		return container;

	} catch(error) {

		console.error(error);
	}
};


const launchDocker2 = ({
	admin_key,
	server_name,
	ws_port,
	log_prefix,
	admin_ws_port,
	ps
}) => {

	const command = `docker`; //bash,  -it

	try {
		const ps = spawn(
			command, 
			[
				`run`, 
				`-i`, 
				`-p`, 
				`${ws_port}:${ws_port}`, 
				`-p`, 
				`${admin_ws_port}:${admin_ws_port}`, 
				`f9af8d15f217`, 
				`/bin/sh`, 
				`-c`, 
				"cd /opt/janus/bin/ && ./janus"
			]
			/*{
				stdio: 'inherit'
			}*/
		);
		console.log(ps);
		return ps;
	} catch(error) {
		console.error(error);
		return null;
	}
}


describe(
	`publishing`,
	() => {

		let folders = [];

		let cleanup = () => {
			
			for(let i = 0; i < folders.length; i++) {
				console.log(`remove config folder ${folders[i]}`);
				fs.removeSync(folders[i]);
			};

		};

		after(() => {
			
			cleanup();

		});

		it(
		   `initial connection`,
			async function() {

				this.timeout(0);
				
				await launchServer();
				
				const instances = [
					{
						admin_key : uuidv1(),
						server_name : `instance1`,
						ws_port : 8188,
						log_prefix : `instance1`,
						admin_ws_port : 7188,
						ps : null
					},
					/*
					{
						admin_key : uuidv1(),
						server_name : `instance2`,
						ws_port : 8189,
						log_prefix : `instance2`,
						admin_ws_port : 7189,
						ps : null
					}
					*/
				];

				for(let i = 0; i < instances.length; i++) {
					instances[i].ps = launchDocker2(instances[i]);
					folders.push(instances[i].ps.temp);
				}
				
				const data = instances.map(({
					admin_key,
					server_name,
					ws_port,
					log_prefix,
					admin_ws_port,
					ps
				}) => {
					return {
						protocol: `ws`,
						address: `127.0.0.1`,
						port: ws_port,
						adminPort: admin_ws_port,
						adminKey: admin_key,
						ps,
						server_name
					};
				})

				console.log('ready to start janus');
				/*const instance = launchJanus({
					config: `${local_config_folder}/janus.jcfg`, 
					config_folder: `${local_config_folder}`
				});*/
				
				await pause(1500);
				
				const janus = new Janus({
					instances: data,
					selectInstance:(instances) => {

						const sorted = instances.sort((a,b) => {
							const aHandles = Object.values(a.handles);
							const bHandles = Object.values(b.handles);
							return aHandles.length - bHandles.length;
						});
				
						console.log(`sorted`, sorted, sorted.map((i) => i.activeHandles));
						
						let instance = sorted[0];
				
						return instance;

					},
					onConnected:(instances) => {
						
						console.log(instances);
						
					},
					onDisconnected:() => {
						
						console.log('disconnected');

					},
					onError: (error) => {
						
						console.log('error', error);

					}
				});
				
				await janus.initialize();

				const result = await janus.createRoom({
					type:'create_room',
					load: { 
						description: "afawfawgawgaw"
					}
				});

				console.log(instances);
				
				await pause(1500);
				
				await launchClient("publisher", "husky_cif.y4m");
				
				await pause(1500);

				//await launchClient("publisher", "sign_irene_qcif.y4m");

				await pause(50000);
				
				for(let i = 0; i < instances.length; i++) {
					if (instances[i].ps) {
						instances[i].ps.kill();
					}
					janus.terminate();
				}
				
				//await launchClient("publisher", "husky_cif.y4m");
				//await janus.dispose();

				//instance.stdin.pause();

				//instance.kill();
				
				
				//await pause(1500);

				//await launchClient("publisher", "sign_irene_qcif.y4m");	
			}
		);
	}
);
