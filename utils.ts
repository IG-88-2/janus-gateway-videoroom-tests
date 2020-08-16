const pause = (n:number) => new Promise((resolve) => setTimeout(() => resolve(), n));
const path = require(`path`);
const mocksFolder = `C:\\Users\\clint\\Downloads\\mocks`;
const fs = require('fs');
const logFile = fs.createWriteStream(__dirname + '/test.log', { flags : 'w' });
const util = require('util');



let enable = true;



export const logger = {
	enable : () => {

        enable = true;
    
    },
    disable : () => {
    
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



export const mockVideos = fs.readdirSync(mocksFolder).filter((entry) => {

	const extension = entry.split('.').pop();

	return extension==='y4m';

});



let counter = 0;



export const getNextMockVideoPath = () => {

	let next = mockVideos[counter];

	if (!next) {
		counter = 0;
		next = mockVideos[counter];
	}

	counter++;
	
	return path.resolve(mocksFolder, next);

}



export const click = async (client, query) => {

	await client.waitForSelector(query);

	await pause(500);

	const target = (await client.$$(query))[0];

	await target.click();

	await pause(500);

	return target;

}

export const connected = async (client) => {
	
	await client.waitForSelector('.room-element');
		
}

export const getRooms = async (client, query) => {

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

export const getRoomsFromFirstClient = async (ps) => {

	const { client } = await ps[0];

	await click(client, '#connect');

	await connected(client);

	let rooms = await getRooms(client, '.room-id');

	await click(client, '#disconnect');

	rooms = rooms.filter((room_id) => room_id.length > 5);

	return rooms;

}

export const f = async (id, client, interval) => {
	await click(client, '#connect');
	await connected(client);
	await pause(300);
	await click(client, `#join-${id}`);
	await pause(interval);
	await click(client, `#leave-${id}`);
	await pause(2000);
	await click(client, '#disconnect');
};