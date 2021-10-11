import { logger } from './logger';
import * as express from 'express';
import { v1 as uuidv1 } from 'uuid';
import { fromEvent } from 'rxjs';
import { first, filter } from 'rxjs/operators';
const expect = require(`chai`).expect;
const http = require('http');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const port = 3000;
const fs = require('fs');
const path = require(`path`);



export const launchServer = () => {

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