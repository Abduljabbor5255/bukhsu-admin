# stage1 as builder
FROM node:16-alpine as builder

# copy the package.json to install dependencies
COPY package.json package-json.lock ./

# Install the dependencies and make the folder
RUN npm install && mkdir /project && mv ./node_modules ./project

WORKDIR /project

COPY . .

# Build the project and copy the files
RUN npm build-dev


FROM nginx:alpine

#!/bin/sh

COPY nginx.conf /etc/nginx/conf.d/default.conf

## Remove default nginx index page
RUN rm -rf /usr/share/nginx/html/*

# Copy from the stahg 1
COPY --from=builder /project/dist /usr/share/nginx/html

EXPOSE 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]
