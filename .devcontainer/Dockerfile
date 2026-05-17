FROM ghcr.io/userver-framework/ubuntu-22.04-userver-pg-dev:latest

USER root

RUN apt-get update && apt-get install -y \
	git ninja-build pkg-config libsasl2-dev libssl-dev \
	&& git clone --depth 1 --branch releases/v3.10 --recurse-submodules \
	https://github.com/mongodb/mongo-cxx-driver.git /tmp/mongo-cxx-driver \
	&& cmake -S /tmp/mongo-cxx-driver -B /tmp/mongo-cxx-driver/build -G Ninja \
	-DCMAKE_BUILD_TYPE=Release \
	-DBUILD_SHARED_LIBS=ON \
	-DCMAKE_INSTALL_PREFIX=/usr/local \
	-DENABLE_BSONCXX_POLY_USE_IMPLS=ON \
	&& cmake --build /tmp/mongo-cxx-driver/build -j \
	&& cmake --install /tmp/mongo-cxx-driver/build \
	&& ldconfig \
	&& rm -rf /tmp/mongo-cxx-driver

USER user