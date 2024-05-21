FROM node:21.4.0-bullseye-slim

WORKDIR /opt/app

ARG FOLDER
COPY ./package*.json /opt/app/
RUN npm install

COPY ./ /opt/app

EXPOSE $PORT
ENTRYPOINT npm $COMMAND