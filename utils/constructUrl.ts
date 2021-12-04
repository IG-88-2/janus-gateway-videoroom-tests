export const constructUrl = ({
	user_id,
	janus_channel
}) => {
	
	const url = process.env.url;
	
	return `${url}/?user_id=${user_id}&janus_channel=${janus_channel}`;

}