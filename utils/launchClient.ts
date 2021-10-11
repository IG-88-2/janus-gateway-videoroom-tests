import * as express from 'express';
import { v1 as uuidv1 } from 'uuid';
import { logger } from './logger';
import { fromEvent } from 'rxjs';
import { first, filter } from 'rxjs/operators';
const expect = require(`chai`).expect;
const http = require('http');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const port = 3000;
const fs = require('fs');
const path = require(`path`);



export const launchClient = async ({ headless, user_id, flags, width, height }) => {

	const browser = await puppeteer.launch({ headless, args: flags });

	const debug = await browser.newPage();

	const client = await browser.newPage();

	await debug.goto(`chrome://webrtc-internals/`);
	
	const ws_port = 8080;

	const host = `127.0.0.1`;

	const server = `ws://${host}:8080/?id=${user_id}`;

	await client.goto(`http://localhost:${port}?search&user_id=${user_id}&host=${host}&port=${ws_port}`); 
	
	await client.setViewport({ width, height });

	client.on('console', async (e) => {

		const args = await Promise.all(e.args().map((a) => a.jsonValue()));

		logger.browser(...args);
		
	});
	
	return { 
		browser, 
		client,
		user_id
	};
};