const pause = (n:number) => new Promise((resolve) => setTimeout(() => resolve(), n));
const path = require(`path`);
const mocksFolder = `C:\\Users\\clint\\Downloads\\mocks`;
const fs = require('fs');



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