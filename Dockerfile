FROM alpine:3.13

WORKDIR /app/
ADD . / /app/

RUN apk add --no-cache nodejs npm && npm install -g
