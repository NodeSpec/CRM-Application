# syntax=docker/dockerfile:1
FROM nginx:1.27-alpine
# Replace the default config with the project reverse-proxy configuration.
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80 443
