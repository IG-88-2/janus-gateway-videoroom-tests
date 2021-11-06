import { v1 as uuidv1 } from 'uuid';
import { logger } from './logger';
const expect = require(`chai`).expect;
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require(`path`);



export const launchClient = async ({ headless, url, width, height, mockVideoPath, requireUserGesture }) => {

	const args = [
		//'--single-process',
		//'--no-zygote',
		'--ignore-certificate-errors',
		'--no-sandbox'
	];

	if (requireUserGesture) {
		args.push('--user-gesture-required');
		args.push('--autoplay-policy=user-gesture-required');
	} else {
		args.push('--autoplay-policy=no-user-gesture-required');
	}
	
	args.push('--use-fake-ui-for-media-stream');
	args.push('--use-fake-device-for-media-stream');
	args.push(`--use-file-for-fake-video-capture=${mockVideoPath}`);
	
	if (!headless) {
		args.push('--window-size=1800,900');
		args.push('--auto-open-devtools-for-tabs');
	}
	
	const browser = await puppeteer.launch({
		//executablePath: 'C:\\Users\\clint\\Desktop\\chrome-win\\chrome.exe', //'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
		headless,
		devtools: !headless,
		args
	});
	
	const context = browser.defaultBrowserContext();
				
	context.overridePermissions(url, [
		'notifications', 
		//"videoCapture", 
		//"audioCapture",
		'camera', 
		'microphone'
	]);
	
	const debug = await browser.newPage();

	const client = await browser.newPage();
	
	await client.setDefaultNavigationTimeout(0); 

	await debug.goto(`chrome://webrtc-internals/`);
	
	await client.goto(url); 
	
	await client.setViewport({ width, height });

	client.on('console', async (e) => {

		const args = await Promise.all(e.args().map((a) => a.jsonValue()));

		logger.browser(...args);
		
	});
	
	return { 
		browser, 
		client,
		debug
	};
};