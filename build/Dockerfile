FROM node:21.4.0-bullseye-slim

WORKDIR /opt/app

ARG FOLDER
COPY $FOLDER/package*.json /opt/app/
RUN npm install

COPY $FOLDER/ /opt/app

EXPOSE $PORT
ENTRYPOINT npm $COMMAND