import { pause } from "./pause";

export const click = async (client, query) => {

	await client.waitForSelector(query);

	await pause(500);

	const target = (await client.$$(query))[0];

	await target.click();

	await pause(500);

	return target;

}
