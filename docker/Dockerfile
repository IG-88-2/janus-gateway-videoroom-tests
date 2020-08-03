FROM ubuntu

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
	&& apt-get install -y git wget build-essential cmake libwebsockets-dev golang pkg-config libconfig-dev libmicrohttpd-dev libcurl4-openssl-dev libjansson-dev libnice-dev libssl-dev libglib2.0-dev libopus-dev libogg-dev gengetopt libtool automake \
	&& git clone --single-branch --branch master https://github.com/IG-88-2/configure \
	&& cd configure \
	&& gcc -w -g3 configure.c -o configure -lconfig \
	&& cd .. \
	&& wget https://github.com/cisco/libsrtp/archive/v2.2.0.tar.gz \
	&& tar xfv v2.2.0.tar.gz \
	&& cd libsrtp-2.2.0 \
	&& ./configure --prefix=/usr --enable-openssl \
	&& make shared_library && make install \
	&& cd .. \
	&& rm v2.2.0.tar.gz \
	&& rm -rf libsrtp-2.2.0 \
	&& git clone https://boringssl.googlesource.com/boringssl \
	&& cd boringssl \
	&& mkdir build \
	&& cd build \
	&& cmake .. \
	&& make \
	&& mkdir -p /opt/boringssl/lib/ \
	&& cd .. \
	&& cp -R include /opt/boringssl/ \
	&& cp build/ssl/libssl.a /opt/boringssl/lib/ \
	&& cp build/crypto/libcrypto.a /opt/boringssl/lib/ \
	&& cd .. \
	&& rm -rf boringssl \
	&& cd / \
	&& git clone --single-branch --branch master https://github.com/meetecho/janus-gateway \
	&& cd janus-gateway \
	&& sh autogen.sh \
    && ./configure --prefix=/opt/janus --disable-rest --disable-docs --disable-data-channels --disable-rabbitmq --disable-mqtt --disable-plugin-audiobridge --disable-plugin-echotest --disable-plugin-recordplay --disable-plugin-sip --disable-plugin-nosip --disable-plugin-streaming --disable-plugin-textroom --disable-plugin-videocall --disable-plugin-voicemail --enable-libsrtp2 --enable-boringssl \
	&& make \
	&& make install \
	&& make configs \
	&& cd .. \
	&& rm -rf janus-gateway \
	&& rm -rf /opt/boringssl \
	&& apt-get purge -y git libssl-dev libglib2.0-dev libopus-dev libogg-dev libtool libmicrohttpd-dev wget build-essential cmake golang pkg-config gengetopt libtool automake \
	&& apt-mark manual libconfig9 libwebsockets15 libnice10 libconfig-dev libwebsockets-dev libjansson-dev libnice-dev libcurl4-openssl-dev \
	&& apt-get autoremove -y

COPY start.sh start.sh

ENTRYPOINT ["/start.sh"]
