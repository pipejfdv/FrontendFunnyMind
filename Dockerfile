FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG API_URL=http://localhost:8080/pipejfdv/api/v1
RUN sed -i "s|http://localhost:8080/pipejfdv/api/v1|${API_URL}|g" src/environments/environment.prod.ts

RUN npm run build -- --configuration production

FROM nginx:alpine
COPY --from=build /app/www /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
