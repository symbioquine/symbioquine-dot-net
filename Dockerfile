FROM node:14.18.2-buster

RUN apt update && apt upgrade -y && \
    apt install gcc g++ make python git libc6-dev build-essential libpng-dev \
    libjpeg-dev libvips-dev libvips musl-dev node-gyp pngquant webp -y

RUN npm install -g gatsby-cli

WORKDIR /app

# COPY the package.json file, update any deps and install them
COPY package.json .
COPY package-lock.json .
RUN npm install

# copy the whole source folder(the dir is relative to the Dockerfile
COPY content/ /app/content
COPY data/ /app/data
COPY public/ /app/public
COPY src/ /app/src
COPY static/ /app/static
COPY gatsby-config.js /app/gatsby-config.js
COPY gatsby-node.js /app/gatsby-node.js

RUN find /app/

CMD [ "npm", "run", "develop" ]
