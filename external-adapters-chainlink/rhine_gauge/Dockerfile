FROM node:14.16.0-alpine
RUN apk --update upgrade \
    && apk add autoconf automake make gcc g++ libtool pkgconfig python \
    && mkdir -p /home/node/app/node_modules 
WORKDIR /home/node/app
COPY rhine_gauge/package*.json rhine_gauge/yarn.lock ./
RUN chown -Rh node node_modules
RUN yarn --frozen-lockfile 
COPY --chown=node:node rhine_gauge/ . 
COPY --chown=node:node commons/ ../commons
CMD [ "node", "app.js" ]
