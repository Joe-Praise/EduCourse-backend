# # Use Node 20 (lightweight Alpine variant)
# FROM node:20-alpine

# # Set environment variable for production
# ENV NODE_ENV=production

# # Set working directory inside container
# WORKDIR /usr/src/app

# # Copy only package files first (to leverage Docker layer caching)
# COPY package*.json ./

# # Install deps, build, and prune in one step
# RUN npm install && npm run build && npm prune --production

# # Copy the rest of your app source code
# COPY . .

# # Switch to a non-root user for better security
# USER node

# # Expose the port your app runs on
# EXPOSE 3050

# # Default command to start your app
# CMD ["node", "dist/server.js"]


# Stage 1 — Build
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy dependency files
COPY package*.json ./

# Install all deps (including dev for TypeScript)
RUN npm install

# Copy source code
COPY . .

# Build the project (creates dist/)
RUN npm run build


# Stage 2 — Production
FROM node:20-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy only needed files from builder
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/config.env ./config.env

# Install only production deps
RUN npm install --omit=dev

# Expose your app port
EXPOSE 3050

# Start the compiled app (dist/server.js, not src/server.js)
CMD ["node", "dist/server.js"]
