import { parse } from 'himalaya';

export const getUserStats = async (stats) => {

	const content = await stats.evaluate(() => {
		
		const tabs = document.querySelectorAll(".tab-head");
		
		tabs.forEach((tab:any) => {
			tab.click();
		});

		const stats = document.querySelectorAll('.update-log-table');
		
		let result = {};

		stats.forEach((stats,index) => {

			result[`stats-${index}`] = stats.innerHTML;
			
		});

		return JSON.stringify(result);

	});

	let parsed = JSON.parse(content);

    for(let key in parsed) {
		parsed[key] = parse(parsed[key]);
		parsed[key] = parsed[key][0].children.map((tr) => {

			const event = {
				name: null,
				date: null,
				content: null
			};
			
			try {
				
				event.date = tr.children[0].children[0].content;
	
				const details = tr.children[1].children[0];
	
				event.name = details.children[0].children[0].content;
	
				event.content = details.children[1].children[0].content;
				
			} catch(error) {} //TODO
	
			return event;
			
		});
	}	
	
	return parsed;

}