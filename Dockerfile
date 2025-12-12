# Stage 1: Build
FROM node:lts-alpine AS builder
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy source code and config files
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:lts-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
# Skip lifecycle scripts (prepare) to avoid Husky execution in production
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Copy other necessary files
COPY --from=builder /usr/src/app/db ./db

# Expose port
EXPOSE 3000

# Change ownership and switch to non-root user
RUN chown -R node:node /usr/src/app
USER node

# Start the application (using compiled JS)
CMD ["npm", "run", "start:migrate"]