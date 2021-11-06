export const getRandomNumericId = () : number => {
	return Math.round(
		Math.random() * 9000 //Number.MAX_SAFE_INTEGER
	);
}
