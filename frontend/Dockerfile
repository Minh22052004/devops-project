# ===========================================
# STUDENT TODO: Create Frontend Dockerfile
# ===========================================
#
# Requirements:
# 1. Must use multi-stage build
# 2. Stage 1 (builder):
#    - Use node:24-alpine
#    - Install dependencies with npm ci
#    - Accept the backend URL as a build ARG: ARG REACT_APP_API_URL (baked in at build time)
#    - Build the React app with npm run build
#
# 3. Stage 2 (production):
#    - Use node:24-alpine
#    - Install 'serve' globally (pin the major version, e.g. serve@14)
#    - Copy only the build folder from builder stage
#    - Expose port 3000
#    - Use serve to run the app
#
# Hints:
# - npm run build creates a 'build' folder
# - serve -s build -l 3000 serves the static files
# - Research: "Docker multi-stage React production"
# ===========================================

# YOUR CODE HERE:
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG REACT_APP_API_URL=http://localhost:8080
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

FROM node:24-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/build ./build
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
