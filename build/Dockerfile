FROM node:21.7.3-bullseye-slim

WORKDIR /opt/app

COPY ./package*.json /opt/app/
RUN npm install

COPY ./ /opt/app

ARG PORT
EXPOSE $PORT

ENTRYPOINT ["npm"]