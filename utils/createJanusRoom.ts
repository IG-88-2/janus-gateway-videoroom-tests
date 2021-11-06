const axios = require('axios');

export const createJanusRoom = () : Promise<string> => {

	return axios
	.post('http://localhost:3000/v1/room', { 
		description: "my personal room for testing", 
		videocodec: "vp9" 
	})
	.then(res => {
		return res.data.data.load.context.room_id;
	})
	.catch(error => {
		console.error(error)
	});

}