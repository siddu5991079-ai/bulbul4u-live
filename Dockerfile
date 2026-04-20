# Puppeteer ka official image use karein jisme Chrome pehle se hota hai
FROM ghcr.io/puppeteer/puppeteer:latest

# Root user ban kar FFmpeg aur Virtual Display (Xvfb) install karein
USER root
RUN apt-get update && apt-get install -y ffmpeg xvfb

# Code ko server mein copy karein
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .

# Virtual screen ke sath script ko 24/7 start karein
CMD ["xvfb-run", "--server-args=-screen 0 1280x720x24", "--auto-servernum", "node", "browser.js"]
