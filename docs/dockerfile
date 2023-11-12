FROM node:lts-hydrogen AS base
WORKDIR /docs_service_api
COPY package.json .
COPY package-lock.json .

FROM base AS dev
COPY nodemon.json .
RUN npm install
CMD npm run start:dev

FROM base as builder
COPY src ./src
RUN npm install
RUN npm run build

FROM base as prod
COPY --from=builder ./docs_service_api/build .
RUN npm install --omit=dev -y
CMD node main
