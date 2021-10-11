const fs = require('fs');
const path = require(`path`);
const mocksFolder = `C:\\Users\\clint\\Downloads\\mocks`;

let counter = 0;

const mockVideos = fs.readdirSync(mocksFolder).filter((entry) => {

	const extension = entry.split('.').pop();

	return extension==='y4m';

});

export const getNextMockVideoPath = () => {

	let next = mockVideos[counter];

	if (!next) {
		counter = 0;
		next = mockVideos[counter];
	}

	counter++;
	
	return path.resolve(mocksFolder, next);

}