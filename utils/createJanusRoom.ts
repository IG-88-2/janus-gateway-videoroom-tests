process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const axios = require('axios');

export const createJanusRoom = () : Promise<string> => {

	const url = process.env.url;
	
	return axios
	.post(`${url}/v1/room`, { 
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