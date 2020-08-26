const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');

const terminateInstances = async () => {
		
    const command = process.platform==='linux' ? `docker rm $(docker ps -a -q)` : `FOR /F %A IN ('docker ps -q') DO docker rm -f %~A`;
    
    try {

        const result = await exec(
            command
        );

    } catch(error) {

        console.error(error);

    }
    
}



terminateInstances()
.then(() => {

    const filePath = path.resolve('instances.json');
    
    try {
        fs.unlinkSync(filePath);
    } catch(e) {}
    
    console.log('done');

});
