FROM node:22.15.0-bullseye-slim

WORKDIR /opt/app

COPY ./package*.json /opt/app/
RUN npm install

COPY ./ /opt/app

ARG PORT
EXPOSE $PORT

ENTRYPOINT ["npm"]