FROM alpine:latest
MAINTAINER R0GGER

# env variable
ENV MAC 11:11:11:11:11:11

# install wol package
RUN apk add --no-cache awake

# start wake command
CMD awake ${OPTIONS} ${MAC}
