const fs = require('fs');
const logFile = fs.createWriteStream(__dirname + '/test.log', { flags : 'w' });
const util = require('util');

let enable = true;

export const logger = {
	enable : () => {

        enable = true;
    
    },
    disable : () => {
    
        enable = false;
    
    },
	info : (message) => {

		if (enable) {
			console.log("\x1b[32m", `[test info] ${message}`);
			logFile.write(util.format(message) + '\n');
		}

	},
	browser : (...args) => {

		/*
		if (enable) {
			if (args) {
				const message = args.join(' ');
				console.log("\x1b[33m", `[test browser] ${message}`);
				if (message.includes("error")) {
					logFile.write(util.format(message) + '\n');
				}
			}
		}
		*/

	},
	error : (message) => {
		
		if (enable) {
			if (typeof message==="string") {
				console.log("\x1b[31m", `[test error] ${message}`);
				logFile.write(util.format(message) + '\n');
			} else {
				try {
					const string = util.inspect(message, {showHidden: false, depth: null});
					console.log("\x1b[31m", `[test error] ${string}`);
					logFile.write(util.format(string) + '\n');
				} catch(error) {}
			}
		}

	},
	json : (object) => {

		if (enable) {
			const string = JSON.stringify(object, null, 2);
			console.log("\x1b[37m", `[test json] ${string}`);
			logFile.write(util.format(string) + '\n');
		}

	}
};