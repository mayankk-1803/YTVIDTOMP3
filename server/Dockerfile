FROM node:18-alpine

WORKDIR /usr/src/app
RUN apk add --no-cache ffmpeg python3 wget ca-certificates


RUN wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp


COPY package*.json ./
RUN npm install


COPY . .


CMD ["node", "index.js"]