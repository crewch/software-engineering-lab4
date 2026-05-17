FROM ghcr.io/userver-framework/ubuntu-22.04-userver-pg-dev:latest

ENV CCACHE_DIR=/home/user/lab2/.ccache \
  CORES_DIR=/cores \
  PREFIX=~/.local \
  SHELL=/bin/bash

USER root

RUN apt-get update \
  && apt-get install -y --no-install-recommends git ninja-build pkg-config libsasl2-dev libssl-dev \
  && git clone --depth 1 --branch releases/v3.10 --recurse-submodules https://github.com/mongodb/mongo-cxx-driver.git /tmp/mongo-cxx-driver \
  && cmake -S /tmp/mongo-cxx-driver -B /tmp/mongo-cxx-driver/build -G Ninja -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=ON -DCMAKE_INSTALL_PREFIX=/usr/local -DENABLE_BSONCXX_POLY_USE_IMPLS=ON -DCMAKE_POLICY_VERSION_MINIMUM=3.5 \
  && cmake --build /tmp/mongo-cxx-driver/build --parallel \
  && cmake --install /tmp/mongo-cxx-driver/build \
  && ldconfig \
  && rm -rf /tmp/mongo-cxx-driver \
  && rm -rf /var/lib/apt/lists/*

USER user

WORKDIR /home/user/lab2

COPY --chown=user:user . .

USER root

RUN rm -rf build-release \
  && cmake -S . -B build-release -DCMAKE_BUILD_TYPE=Release \
  && cmake --build build-release --parallel

USER user

EXPOSE 8080

CMD ["./build-release/lab2", "--config", "configs/static_config.yaml", "--config_vars", "configs/config_vars.yaml"]
