import { waitUntil } from "./waitUntil";

export const confirmVideoAmount = async (client, nMembers:number) => {
    try {
        await waitUntil(async () => {
            const n = await client.evaluate(() => {
                const v = document.getElementsByTagName("video");
                return v.length;
            });
            return n == nMembers;
        }, 10000, 50);
    } catch(error) {
        throw new Error(`expected ${nMembers} video elements could not be located \n`);
    }
}