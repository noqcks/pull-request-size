FROM node:10.21.0

WORKDIR /myapp

COPY package*.json ./

RUN npm install
# Bundle app source. Copy local files to the current working directory
COPY . .

EXPOSE 3000

CMD ["npm","start"]
