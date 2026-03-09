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

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy custom nginx config to templates so entrypoint substitutes env vars
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Remove default nginx index page
RUN rm -rf /usr/share/nginx/html/*

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl -f http://localhost:3007/ || exit 1

EXPOSE 3007
