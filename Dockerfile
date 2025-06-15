# Use the latest Node.js version (24 is current latest)
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Clone the repository with Git LFS support
RUN apk add --no-cache git git-lfs && \
    git clone https://github.com/shaneomac1337/komplexaci_js.git . && \
    git lfs pull && \
    apk del git git-lfs

# Copy .env file from local context
COPY .env .env

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Build the application
RUN npm run build

# Remove devDependencies after build to reduce image size
RUN npm prune --production

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

# Build and run commands:
# docker build -t komplexaci:latest .
# docker run -p 3000:3000 komplexaci:latest
