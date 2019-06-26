FROM alpine:latest
MAINTAINER R0GGER

# env variable
ENV OPTIONS "--port=9 --broadcast=255.255.255.255"
ENV MAC 11:11:11:11:11:11

# install wol package
RUN apk add --no-cache awake

# start wake command
CMD awake ${OPTIONS} ${MAC}
