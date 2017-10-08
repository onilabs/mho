FROM onilabs/conductance:latest
MAINTAINER alex@onilabs.com

# install mho
RUN mkdir -p /usr/src/mho
WORKDIR /usr/src/mho
COPY . /usr/src/mho

ENTRYPOINT [ "/usr/src/mho/mho.sjs" ]