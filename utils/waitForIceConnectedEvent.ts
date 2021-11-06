import { compose, find, filter, flatten, values } from 'ramda';
import { getUserStats } from './getUserStats';
import { waitUntil } from './waitUntil';

export const waitForIceConnectedEvent = async (client, index) => {

	await waitUntil(() => {

        let f = compose(
            (values) => {
                return values.find(({ content }) => { return content==="connected" });
            },
            filter(({ name }) => name==="connectionstatechange"),
            flatten, 
            values
        );

        return getUserStats(client).then((result) => {
            console.log(result);
            return f(result);
        });
        
    }, 10000, 1000);

}
