# Use the latest Node.js version (24 is current latest)
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    git-lfs

# Clone the repository with Git LFS support
RUN git clone https://github.com/shaneomac1337/komplexaci_js.git . && \
    git lfs pull

# Copy .env file from local context
COPY .env .env

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Build the application
RUN npm run build

# Remove devDependencies and build tools after build to reduce image size
RUN npm prune --production && \
    apk del python3 make g++ git git-lfs

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

# Build and run commands:
# docker build -t komplexaci:latest .
# docker run -p 3000:3000 komplexaci:latest
