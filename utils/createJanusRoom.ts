process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const axios = require('axios');

export const createJanusRoom = () : Promise<string> => {
	
	const url = "https://s-janus.bioiq.cam"; //"http://localhost:3000";
	
	return axios
	.post(`${url}/v1/room`, { 
		description: "test room", 
		videocodec: "vp9", 
		video_svc: true, // ?
		vp9_profile: "1", // ?
		// "vp8"
		// "vp9" (not supported on iOS ?)
		// "h264"
		// "h265" (iOS only)
		record: true,
		secret: "ghse45h4es5hxh234h45jh5jdj45u4u4u4"
	})
	.then(res => {
		
		return res.data.data;

	})
	.catch((error) => {

		console.error(error)

	});

}