const fork = require("child_process").fork;
const path = require("path");

export const spawnProcess = (name:string)  => {

    const options = { stdio:["pipe","pipe","pipe",'ipc'] };

    let script = path.resolve( __dirname, name );

    let handler = fork( script, [], options );

    return handler;
};





