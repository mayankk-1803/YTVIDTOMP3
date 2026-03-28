FROM node:18-alpine

WORKDIR /usr/src/app

# 🔥 Install dependencies
RUN apk add --no-cache ffmpeg python3 wget ca-certificates

# 🔥 Install yt-dlp
RUN wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# 📦 Install Node deps
COPY package*.json ./
RUN npm install

# 📁 Copy app
COPY . .

# 🚀 Run WORKER (NOT index.js)
CMD ["node", "index.js"]