FROM node:slim

RUN mkdir /home/node/app && mkdir /home/node/.node_modules

ADD ./package.json /home/node/app
ADD ./package-lock.json /home/node/app

ENV PATH="${PATH}:/home/node/.node_modules/.bin"
ENV CQ_GITHUB_DIR="/home/node/app/.github"

RUN cd /home/node/app && \
    npm install && \
    cp -r ./node_modules/* /home/node/.node_modules/ && \
    cp -r ./node_modules/.bin /home/node/.node_modules/ && \
    rm -rf ./node_modules

WORKDIR /home/node/app

USER 1000

CMD ["npm", "test"]
