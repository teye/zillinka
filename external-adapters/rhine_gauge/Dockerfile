FROM node:14.16.0-alpine
RUN apk --update upgrade \
    && apk add autoconf automake make gcc g++ libtool pkgconfig python \
    && mkdir -p /home/node/app/node_modules \
    && chown -R node:node /home/node/app

WORKDIR /home/node/app
COPY package.json yarn.lock ./
USER node

RUN yarn --frozen-lockfile
COPY --chown=node:node . .

CMD [ "node", "app.js" ]
