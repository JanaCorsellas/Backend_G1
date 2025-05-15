FROM node:24 AS build

WORKDIR /home/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build 

FROM node:24

WORKDIR /home/app

COPY --from=build /home/app/dist ./dist
COPY --from=build /home/app/package*.json ./
COPY --from=build /home/app/src ./src

COPY /src/.env .env

RUN npm install

EXPOSE 3000

CMD ["node" , "dist/index.js" ]