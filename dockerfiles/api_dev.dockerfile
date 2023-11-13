FROM node:lts-hydrogen AS base
WORKDIR /editor_service_api
COPY package.json .
COPY package-lock.json .

FROM base AS dev
COPY nodemon.json .
CMD npm run start:dev

FROM base as builder
COPY src ./src
RUN npm install
RUN npm run build

FROM base as prod
COPY --from=builder ./editor_service_api/build .
RUN npm install --omit=dev -y
CMD node main
