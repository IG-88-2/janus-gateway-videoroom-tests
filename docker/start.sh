#!/bin/bash
echo $ID
cp -a /opt/janus/etc/janus/. /$ID
cd configure
./configure --admin_key $ADMIN_KEY --server_name $SERVER_NAME --config_base /$ID --ws_port $WS_PORT --admin_ws_port $ADMIN_WS_PORT --log_prefix $LOG_PREFIX
cd /opt/janus/bin/
./janus --configs-folder=/$ID