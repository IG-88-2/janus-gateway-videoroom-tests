import * as mocha from 'mocha';
import * as express from 'express';
import Janus from './janus-gateway-node/lib/janus-gateway-node';
import { v1 as uuidv1 } from 'uuid';
const { spawn } = require('child_process');
const expect = require(`chai`).expect;
const fs = require(`fs-extra`);
const path = require(`path`);
const http = require('http');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const Docker = require('dockerode');
const port = 3000;
const local_config_folder = `${__dirname}/config`;
const adminKey = `gzsehzxe4334634us9sh09sjts30t9s0w3t9jw039j`;



const pause = (n:number) => new Promise((resolve) => setTimeout(() => resolve(), n));



const launchJanus = ({
	config,
	config_folder
}) => {
	
	const program = "/opt/janus/bin/janus";
	const args = [
		`--config=${config}`,
		`--configs-folder=${config_folder}`
	];

	const janus = spawn(program, args);

	janus.stdout.on('data', (data) => {
		//console.log(`stdout: ${data}`);
	});

	janus.stderr.on('data', (data) => {
		//console.error(`stderr: ${data}`);
	});

	janus.on('close', (code) => {
		//console.log(`child process exited with code ${code}`);
	});
	
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
    headless: false,
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



const launchDocker = async () => {

	const docker = new Docker();

	try {

		const container = await docker.createContainer({
			Image: 'janus-gateway-videoroom',
			Tty: true
		});
		//const stream = await container.attach({stream: true, stdout: true, stderr: true});
		//stream.pipe(process.stdout);
		await container.start();
		
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

		/*
		await container.exec({
			"AttachStdin": false,
			"AttachStdout": false,
			"AttachStderr": false,
			//"DetachKeys": "ctrl-p,ctrl-q",
			//"Tty": false,
			"Cmd": [
				"ls",
				"cd /opt/janus/bin",
				"./janus"
			],
			//"Env": [
			//	"FOO=bar"
			//]
		});
		*/
		await pause(20000);
		await container.stop();
		await container.remove();

	} catch(error) {

		console.error(error);

	}
	
	/*
	docker.run(
		'janus-gateway-videoroom', 
		['bash', '-c', 'uname -a'],
		process.stdout, 
		function (err, data, container) {
			
			console.log(err, data, container);

			container.start()
			.then(() => {
				container.exec({
					"AttachStdin": false,
					"AttachStdout": true,
					"AttachStderr": true,
					//"DetachKeys": "ctrl-p,ctrl-q",
					"Tty": false,
					"Cmd": [
						"cd /opt/janus/bin",
						"./janus"
					],
					"Env": [
						"FOO=bar"
					]
				})
			})
			
		}
	);
	*/

};



describe(
	`publishing`,
	() => {

		it(
		   `initial connection`,
			async function() {

				this.timeout(0);

				await launchServer();
				
				const instance = launchJanus({
					config: `${local_config_folder}/janus.jcfg`, 
					config_folder: `${local_config_folder}`
				});
				
				await pause(1500);
				
				const janus = new Janus({
					instances: [
						{
							protocol: `ws`,
							address: `127.0.0.1`,
							port: 8188,
							adminPort: 7188,
							adminKey
						}
					],
					onConnected:() => {
						
						

					},
					onDisconnected:() => {
						


					},
					onError: (error) => {
						


					}
				});
				
				await janus.initialize();
				
				const result = await janus.createRoom({
					type:'create_room',
					load: { 
						description: "afawfawgawgaw"
					}
				});
				
				await pause(1500);
				
				await launchClient("publisher", "husky_cif.y4m");
				
				await pause(1500);

				//await launchClient("publisher", "sign_irene_qcif.y4m");

				await pause(2000000);
				
				//await janus.dispose();

				//instance.stdin.pause();

				//instance.kill();
				
				
			}
		);
		
	}
);
