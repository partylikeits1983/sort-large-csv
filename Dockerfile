FROM postgres:latest

# Set the environment variables for PostgreSQL
ENV POSTGRES_USER postgres
ENV POSTGRES_PASSWORD password
ENV POSTGRES_DB postgres

# Copy the SQL initialization script to the Docker container
COPY init.sql /docker-entrypoint-initdb.d/

# Install Node.js and npm
RUN apt-get update && apt-get install -y \
    curl \
    && curl -sL https://deb.nodesource.com/setup_16.x | bash - \
    && apt-get install -y nodejs 

# Install pnpm
RUN npm install -g pnpm

# Install ts-node globally
RUN npm install -g ts-node

# Install wait-for-it script
RUN apt-get install -y wait-for-it

# Create the app directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install the dependencies using pnpm
RUN pnpm install

# Copy the rest of the application files
COPY . .

# Wait for PostgreSQL to start before running the app, then keep the container alive
CMD wait-for-it postgres:5432 -- pnpm start && tail -f /dev/null

# Expose the port for the Node.js app
EXPOSE 3000
