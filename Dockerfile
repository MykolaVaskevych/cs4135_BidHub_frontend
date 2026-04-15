# Build context: frontend/ (local/CI) or parent repo root (Railway)
FROM node:22-alpine AS build
WORKDIR /app
COPY . .
# Handle Railway: building from parent repo root — source files are in frontend/
RUN if [ -d frontend ] && [ -f frontend/package.json ]; then cp -r frontend/. . && rm -rf backend docs; fi
RUN npm ci
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/nginx.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80
