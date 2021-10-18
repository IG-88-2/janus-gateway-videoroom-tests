import { click } from './utils/click';
import { terminateChromeInstances } from './utils/terminateChromeInstances';
import { getNextMockVideoPath } from './utils/getNextMockVideoPath';
import { launchClient } from './utils/launchClient';
import { pause } from './utils/pause';
import * as mocha from 'mocha';
import { v1 as uuidv1 } from 'uuid';
import { logger } from './utils/logger';
const expect = require(`chai`).expect;
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require(`path`);



describe(
	`test`,
	() => {
		
		it(
		   `test`,
			async function() {

				this.timeout(0);

				const amount = 2;
				const users = [];
				
				for(let i = 0; i < amount; i++) {
					const user_id = uuidv1();
					const url = `${process.env.url}/?id=${user_id}`;
					
					console.log(url);

					const user = await launchClient({
						headless: false, 
						url,
						width: 1400, 
						height: 1200, 
						mockVideoPath: getNextMockVideoPath()
					});
					users.push(user);
				}

				const first = users[0].client;

				const rooms = await first.$$('.room');

				const ids = [];

				for(let i = 0; i < rooms.length; i++) {
					const next = rooms[i];
					const id = await first.evaluate(x => x.id, next);
					ids.push(id);
				}
				
				console.log('rooms', ids);

				const firstRoom = ids[0];

				console.log('first room', firstRoom);

				for(let i = 0; i < users.length; i++) {
					const next = users[i].client;
					await click(next, `#${firstRoom}`);
				}

				await pause(60000 * 100);

				for(let i = 0; i < users.length; i++) {
					const user = users[i];
					await terminateChromeInstances(user.browser, user.client, user.debug);
				}
				
				// `ws://${host}:8080/?id=${user_id}`;
				// `http://localhost:${port}?search&user_id=${user_id}&host=${host}&port=${ws_port}`
				
			}
		);
	}
);
