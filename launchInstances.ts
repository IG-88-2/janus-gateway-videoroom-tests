const uuid = require('uuid');
import child_process = require('child_process');

process.on(
    'uncaughtException', 
    (err) => {
        console.error(err);
        process.exit(1);
    }
);

process.on(
    "message",
    (action:any) => {

        if (action.type==="exit") {

            process.exit(action.load);

        } else if (action.type==="launch") {

            launchInstances(action.load)
            .then((instances) => {

                process.send({
                    type:"result", 
                    load:instances //JSON.stringify(instances)
                });

            });
        
        }
    }
);

const launchInstances = async (config) => {

    const instances = [];

    const dockerJanusImage = config.image;
    const instancesAmount = config.n || 2;
    const start_ws_port = 8188;
    const start_admin_ws_port = 7188;
    const step = 101;
    const maxBuffer = 1024 * 1024 * 1024;
    let udpStart = 20000;
    let udpEnd = udpStart + step - 1;

    console.log(`launching ${instancesAmount} containers`);

    for(let i = 0; i < instancesAmount; i++) {
        const instance = {
            id : uuid.v1(),
            admin_key : uuid.v1(),
            server_name : `instance_${i}`,
            log_prefix : `instance_${i}:`,
            docker_ip :  `127.0.0.${1 + i}`, //"127.0.0.1",
            ws_port : start_ws_port + i,
            admin_ws_port : start_admin_ws_port + i,
            stun_server : "stun.voip.eutelia.it",
            nat_1_1_mapping : `127.0.0.${1 + i}`, //"127.0.0.1", //"3.121.126.200",
            stun_port : 3478,
            debug_level : 5 //6
        };

        const {
            id,
            admin_key,
            server_name,
            ws_port,
            log_prefix,
            admin_ws_port,
            stun_server, 
            stun_port,
            docker_ip,
            debug_level,
            nat_1_1_mapping
        } = instance;
        
        const args = [
            [ "ID", id ],
            [ "ADMIN_KEY", admin_key ],
            [ "SERVER_NAME", server_name ],
            [ "WS_PORT", ws_port ],
            [ "ADMIN_WS_PORT", admin_ws_port ],
            [ "LOG_PREFIX", log_prefix ],
            [ "DOCKER_IP", docker_ip ],
            [ "DEBUG_LEVEL", debug_level ],
            [ "NAT_1_1_MAPPING", nat_1_1_mapping],
            [ "RTP_PORT_RANGE", `${udpStart}-${udpEnd}` ],
            [ "STUN_SERVER", stun_server ],
            [ "STUN_PORT", stun_port ]
        ];
        
        let command = `docker run -i --cap-add=NET_ADMIN --name ${server_name} `;
        //--publish-all=true
        //-P
        //--network=host
        //-p 127.0.0.1:20000-40000:20000-40000
        //command += `-p ${udpStart}-${udpEnd}:${udpStart}-${udpEnd}/udp `;
        //command += `-p 127.0.0.1:${udpStart}-${udpEnd}:${udpStart}-${udpEnd}/udp `;
        command += `-p ${docker_ip}:${udpStart}-${udpEnd}:${udpStart}-${udpEnd}/udp `;
        command += `-p ${ws_port}:${ws_port} `;
        command += `-p ${admin_ws_port}:${admin_ws_port} `;
        command += `${args.map(([name,value]) => `-e ${name}="${value}"`).join(' ')} `;
        command += `${dockerJanusImage}`;
        
        console.log(`launching container ${i}...${command}`);
        
        child_process.exec(
            command,
            {
                maxBuffer
            },
            (error, stdout, stderr) => {
                
                if (error) {
                    console.error(error);
                }

            }
        );
        
        udpStart += step;
        udpEnd += step;

        instances.push(instance);
    }

    
    
    return instances.map(({
        admin_key,
        server_name,
        ws_port,
        docker_ip,
        admin_ws_port,
        log_prefix,
        stun_server, 
        stun_port,
        id,
        debug_level
    }) => {
        return {
            protocol: `ws`,
            address: docker_ip,
            port: ws_port,
            adminPort: admin_ws_port,
            adminKey: admin_key,
            server_name
        };
    });

}
