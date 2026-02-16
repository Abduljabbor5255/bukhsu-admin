# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy all project files
COPY . .

# Install dependencies (skip postinstall to control build order)
RUN yarn install --frozen-lockfile --ignore-scripts

# Build icons
RUN yarn build:icons

# Accept build-time environment variables
ARG VITE_APP_URL_V1
ENV VITE_APP_URL_V1=$VITE_APP_URL_V1

# Build the project
RUN yarn build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove default nginx index page
RUN rm -rf /usr/share/nginx/html/*

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]
