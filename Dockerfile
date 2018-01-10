FROM alpine:3.7
MAINTAINER R0GGER

# env variable
ENV MAC 11:11:11:11:11:11

# install wol package
RUN apk add --no-cache awake

# start wake command
CMD awake ${MAC}
