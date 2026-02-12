# Stage 1: Build the Vue 3 Vite project
FROM node:16 AS builder

# Set the working directory within the container
WORKDIR /app
# Copy the entire project to the container
COPY . .
# Copy package.json and package-lock.json to install dependencies
COPY package.json ./

# Install project dependencies
RUN yarn install
RUN yarn build:icons

# Build the project
RUN yarn run build


# Stage 2: Serve the built application using a lightweight web server
FROM nginx:alpine

# Remove the default Nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy the built application from the builder stage to the web server directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose the port on which Nginx will listen (default is 80)
EXPOSE 80

# Start Nginx to serve the application
CMD ["nginx", "-g", "daemon off;"]
