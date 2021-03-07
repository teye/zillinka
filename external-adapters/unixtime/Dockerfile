FROM node:14.16.0-alpine
RUN apk --update upgrade \
    && apk add autoconf automake make gcc g++ libtool pkgconfig python \
    && mkdir -p /home/node/app/node_modules 
WORKDIR /home/node/app
COPY unixtime/package*.json unixtime/yarn.lock ./
RUN chown -Rh node node_modules
RUN yarn --frozen-lockfile 
COPY --chown=node:node unixtime/ . 
COPY --chown=node:node commons/ ../commons
RUN cd ../commons && yarn && cd -
CMD [ "node", "app.js" ]
