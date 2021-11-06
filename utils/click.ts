import { pause } from "./pause";

export const click = async (client, query, mobile?) => {

	try {
		await client.waitForSelector(query, {
			timeout: 10000
		});
	} catch(error) {
		throw new Error(`could not locate ${query}`);
	}

	await pause(50);

	const target = await client.$(query);

	if (!target) {
		throw new Error(`unable to click nonexisting element ${query}`);
	}

	if (mobile) {
		await target.tap();
	} else {
		await target.click();
	}

	await pause(100);

	return target;

}