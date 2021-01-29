FROM smartcontract/chainlink:0.9.4
RUN mkdir ~/.chainlink-rinkby
WORKDIR "~.chainlink-rinkeby"
ADD .api .
ADD .password .
CMD ["local", "n", "-p", ".password", "-a", ".api"]
