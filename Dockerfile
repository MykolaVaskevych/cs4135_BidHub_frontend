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
# Write nginx config directly — avoids envsubst template issues
ARG API_GATEWAY_URL=https://api-gateway-production-d819.up.railway.app
RUN printf 'server {\n\
    listen 80;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    resolver 8.8.8.8 valid=300s;\n\
    location /api/ {\n\
        set $backend "%s";\n\
        proxy_pass $backend/api/;\n\
        proxy_set_header Host $http_host;\n\
        proxy_set_header X-Real-IP $remote_addr;\n\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n\
        proxy_set_header X-Forwarded-Proto $scheme;\n\
    }\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n' "${API_GATEWAY_URL}" > /etc/nginx/conf.d/default.conf
EXPOSE 80
