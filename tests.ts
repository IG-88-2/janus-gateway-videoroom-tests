import { confirmVideoAmount } from './utils/confirmVideoAmount';
import { waitForIceConnectedEvent } from './utils/waitForIceConnectedEvent';
import { confirmVideoStreamingActive } from './utils/confirmVideoStreamingActive';
import { constructUrl } from './utils/constructUrl';
import { getRandomNumericId } from './utils/getRandomNumericId';
import { click } from './utils/click';
import { terminateChromeInstances } from './utils/terminateChromeInstances';
import { getNextMockVideoPath } from './utils/getNextMockVideoPath';
import { launchClient } from './utils/launchClient';
import { pause } from './utils/pause';
import * as mocha from 'mocha';
import { v1 as uuidv1 } from 'uuid';
import { logger } from './utils/logger';
import { createJanusRoom } from './utils/createJanusRoom';
const expect = require(`chai`).expect;
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require(`path`);



const rejoinRoomTest = async (amount: number, attempts: number) => {

	const janus_room_id = await createJanusRoom();

	console.log("janus_room_id", janus_room_id);

	const users = [];
	
	for(let i = 0; i < amount; i++) {
		const user_id = getRandomNumericId();

		const url = constructUrl({
			user_id,
			janus_channel: janus_room_id
		});
		
		console.log(url);
		
		const user = await launchClient({
			headless: false, 
			url,
			width: 1400, 
			height: 1200, 
			mockVideoPath: getNextMockVideoPath(),
			requireUserGesture: true
		});
		
		users.push(user);
	}
	
	for(let i = 0; i < attempts; i++) {

		await pause(2000);

		for(let i = 0; i < users.length; i++) {
			const user = users[i];
			await click(user.client, `#start-janus`, false);
		}

		for(let i = 0; i < users.length; i++) {
			const user = users[i];
			await confirmVideoAmount(user.client, users.length);
			await confirmVideoStreamingActive(user.client);
			try {
				await waitForIceConnectedEvent(user.debug, i);
			} catch(error) {
				throw new Error(error);
			}
		}
		
		await pause(30000 * 100);
		
		for(let i = 0; i < users.length; i++) {
			const user = users[i];
			await click(user.client, '#end-call', false);
		}

		await pause(2000);

	}
	
	await pause(2000 * 1000);
	
	for(let i = 0; i < users.length; i++) {
		const user = users[i];
		await terminateChromeInstances(user.browser, user.client, user.debug);
	}
	
}



describe(
	`test`,
	() => {
		
		it(
		   `rejoin room`,
			async function() {

				this.timeout(0);
				
				// await createJanusRoom()
				// .then((id) => {
				// 	console.log("success", id);
				// });

				await rejoinRoomTest(2, 1);
				
			}
		);
		
	}
);
