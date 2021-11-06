export const constructUrl = ({
	user_id,
	provider,
	agora_channel,
	janus_channel
}) => {

	console.log('gere', process.env.url)

	const url = process.env.url;

	return `${url}/?user_id=${user_id}&provider=${provider}&agora_channel=${agora_channel}&janus_channel=${janus_channel}`;

}