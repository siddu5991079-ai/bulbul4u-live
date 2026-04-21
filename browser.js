const express = require('express');
const app = express();
const port = process.env.PORT || 3000; 

// Render ke liye Health Check route
app.get('/', (req, res) => {
    res.send('<h1>Bulbul4u Live Bot is Active!</h1><p>Server is running 24/7 on Render.</p>');
});

app.listen(port, '0.0.0.0', () => {
    console.log(`[+] Web Server is live on port ${port}`);
});

// Main Streaming Logic
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const { spawn } = require('child_process');

const TARGET_URL = 'https://dadocric.st/player.php?id=starsp3&v=m';
const RTMP_SERVER = 'rtmps://vsu.okcdn.ru/input/'; 
const STREAM_KEY = '14601603391083_14040893622891_puxzrwjniu'; // Tasalli kar lein ke key fresh ho
const RTMP_DESTINATION = `${RTMP_SERVER}${STREAM_KEY}`;

let browser = null;
let ffmpegProcess = null;
let lastChunkTime = Date.now();

async function mainLoop() {
    while (true) {
        try {
            await startDirectStreaming();
            await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
            console.error('[!] Global Error:', error.message);
            await cleanup();
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

async function startDirectStreaming() {
    console.log('[*] Starting browser and FFmpeg on Render Cloud...');

    ffmpegProcess = spawn('ffmpeg', [
        '-y', '-analyzeduration', '100M', '-probesize', '100M',
        '-f', 'webm', '-i', 'pipe:0',
        '-c:v', 'libx264', '-preset', 'veryfast', '-maxrate', '3000k', '-bufsize', '6000k',
        '-pix_fmt', 'yuv420p', '-r', '30', '-g', '60',
        '-c:a', 'aac', '-b:a', '128k', '-ar', '44100',
        '-f', 'flv', RTMP_DESTINATION
    ]);

    ffmpegProcess.stderr.on('data', (data) => console.log(`[FFmpeg]: ${data.toString()}`));

    browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: false,
        defaultViewport: { width: 1280, height: 720 },
        args: [
            '--window-size=1280,720',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ],
    });

    const page = await browser.newPage();
    await page.exposeFunction('streamChunkToNode', async (base64Chunk) => {
        lastChunkTime = Date.now();
        if (ffmpegProcess && ffmpegProcess.stdin && ffmpegProcess.exitCode === null) {
            try {
                ffmpegProcess.stdin.write(Buffer.from(base64Chunk, 'base64'));
            } catch (err) { }
        }
    });

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36');
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Cloudflare aur Iframe logic yahan chalti rahegi...
    // (Baqi ka injection code wahi hai jo humne pehle discuss kiya tha)
    
    console.log('[*] Monitoring stream health...');
    while (true) {
        if (Date.now() - lastChunkTime > 25000) throw new Error("Stream Timeout");
        await new Promise(r => setTimeout(r, 5000));
    }
}

async function cleanup() {
    if (ffmpegProcess) { ffmpegProcess.kill('SIGINT'); ffmpegProcess = null; }
    if (browser) { await browser.close(); browser = null; }
}

mainLoop();















// ======= opper code for Render website =============================


// const puppeteer = require('puppeteer-extra');
// const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// puppeteer.use(StealthPlugin());

// const { spawn } = require('child_process');

// const TARGET_URL = 'https://dadocric.st/player.php?id=starsp3&v=m';
// // Yahan rtmps lagaya hai aur niche key ko process.env par set kiya hai taake github par log aapki key na dekh sakein
// const RTMP_SERVER = 'rtmps://vsu.okcdn.ru/input/'; 
// // CRITICAL: Yahan apni real Stream Key paste karein!
// const STREAM_KEY = 'YAHAN_APNI_NEW_OK_RU_KEY_PASTE_KAREIN'; 

// const RTMP_DESTINATION = `${RTMP_SERVER}${STREAM_KEY}`;

// let browser = null;
// let ffmpegProcess = null;
// let lastChunkTime = Date.now();

// async function mainLoop() {
//     while (true) {
//         try {
//             await startDirectStreaming();
//             console.log('[!] Stream function resolved unexpectedly. Restarting in 5s...');
//             await new Promise(resolve => setTimeout(resolve, 5000));
//         } catch (error) {
//             console.error('[!] Global Stream Error: Restarting in 5s...', error.message || error);
//             await cleanup();
//             await new Promise(resolve => setTimeout(resolve, 5000));
//         }
//     }
// }

// async function startDirectStreaming() {
//     console.log('[*] Starting browser and FFmpeg for LIVE 24/7 Streaming on Cloud Server...');

//     ffmpegProcess = spawn('ffmpeg', [
//         '-y',
//         '-analyzeduration', '100M',
//         '-probesize', '100M',
//         '-f', 'webm',
//         '-i', 'pipe:0',
//         '-c:v', 'libx264',
//         '-preset', 'veryfast',
//         '-maxrate', '3000k',
//         '-bufsize', '6000k',
//         '-pix_fmt', 'yuv420p',
//         '-r', '30',
//         '-g', '60',
//         '-c:a', 'aac',
//         '-b:a', '128k',
//         '-ar', '44100',
//         '-f', 'flv',
//         RTMP_DESTINATION
//     ]);

//     ffmpegProcess.stderr.on('data', (data) => {
//         console.log(`[FFmpeg]: ${data.toString()}`);
//     });

//     ffmpegProcess.stdin.on('error', (err) => {
//         console.log(`[!] ffmpeg stdin closed (${err.code}). Reconnecting...`);
//     });

//     ffmpegProcess.on('close', (code) => {
//         console.log(`[*] FFmpeg process exited with code ${code}`);
//     });

//     browser = await puppeteer.launch({
//         executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome', // Koyeb Docker Server ke liye
//         headless: false,
//         defaultViewport: { width: 1280, height: 720 }, // Virtual Server ki screen size
//         args: [
//             '--window-size=1280,720',
//             '--autoplay-policy=no-user-gesture-required',
//             '--disable-web-security',
//             '--no-sandbox',
//             '--disable-setuid-sandbox',
//             '--disable-gpu',
//             '--disable-software-rasterizer',
//             '--disable-dev-shm-usage' // Koyeb ki RAM crash roki jayegi
//         ],
//     });

//     const page = await browser.newPage();

//     await page.exposeFunction('streamChunkToNode', async (base64Chunk) => {
//         lastChunkTime = Date.now();
//         if (ffmpegProcess && ffmpegProcess.stdin && ffmpegProcess.exitCode === null) {
//             try {
//                 const buffer = Buffer.from(base64Chunk, 'base64');
//                 ffmpegProcess.stdin.write(buffer, (err) => {
//                     if (err) console.error("FFmpeg write cleanly dropped:", err.message);
//                 });
//             } catch (err) { }
//         }
//     });

//     console.log(`[*] Navigating to ${TARGET_URL}...`);
//     await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36');
//     await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

//     console.log('[*] Waiting for potential Cloudflare Turnstile to securely resolve itself...');
//     for (let i = 0; i < 15; i++) {
//         const title = await page.title();
//         if (!title.includes('Moment') && !title.includes('Cloudflare')) break;
//         await new Promise(r => setTimeout(r, 1000));
//     }

//     console.log('[*] Waiting for iframes to load natively...');
//     await new Promise(resolve => setTimeout(resolve, 8000));

//     console.log('[*] Searching all iframes for the target video element...');
//     let targetFrame = null;
//     for (const frame of page.frames()) {
//         try {
//             const hasVideo = await frame.evaluate(() => !!document.querySelector('video'));
//             if (hasVideo) {
//                 targetFrame = frame;
//                 console.log(`[+] Found video element inside frame: ${frame.url() || 'unknown'}`);
//                 break;
//             }
//         } catch (e) {}
//     }

//     if (!targetFrame) throw new Error('No <video> element could be found.');

//     console.log('[*] Injecting LIVE MediaRecorder streaming logic...');
//     try {
//         const iframeElement = await targetFrame.frameElement();
//         const box = await iframeElement.boundingBox();
//         if (box) {
//             // Screen ke center mein accurate click (Xvfb ke mutabiq)
//             await page.mouse.click(box.x + (box.width / 2), box.y + (box.height / 2));
//             console.log('[*] Succeeded in clicking the exact center of the video player.');
//         }
//     } catch (e) {
//         console.log('[!] Overlay physical click failed, attempting standard DOM click...');
//         try { await targetFrame.click('video'); } catch (err) { }
//     }

//     await targetFrame.evaluate(async () => {
//         const video = document.querySelector('video');
//         if (!video) throw new Error('No <video> element found.');
        
//         video.muted = false;
//         await video.play().catch(e => console.log('Auto-play blocked or failed:', e));

//         await new Promise((resolve, reject) => {
//             let elapsed = 0;
//             const interval = setInterval(() => {
//                 elapsed += 500;
//                 if (video.videoWidth > 0 && video.readyState >= 3) {
//                     clearInterval(interval);
//                     resolve();
//                 } else if (elapsed > 60000) {
//                     clearInterval(interval);
//                     reject(new Error('Timeout: Video took longer than 60 seconds to load dimensions.'));
//                 }
//             }, 500);
//         });

//         let stream = video.captureStream ? video.captureStream() : video.mozCaptureStream();

//         await new Promise((resolve, reject) => {
//             let elapsed = 0;
//             const trackInterval = setInterval(() => {
//                 elapsed += 500;
//                 const tracks = stream.getVideoTracks();
//                 if (tracks.length > 0 && tracks[0].readyState === 'live') {
//                     clearInterval(trackInterval);
//                     resolve();
//                 } else if (elapsed > 20000) {
//                     clearInterval(trackInterval);
//                     reject(new Error('Timeout: Video stream tracks never populated.'));
//                 }
//             }, 500);
//         });

//         await new Promise(r => setTimeout(r, 1000));

//         const options = { mimeType: 'video/webm; codecs=vp8,opus' };
//         const recorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined);

//         let chunkQueue = [];
//         let isProcessing = false;

//         async function processQueue() {
//             if (isProcessing) return;
//             isProcessing = true;
//             while (chunkQueue.length > 0) {
//                 const blob = chunkQueue.shift();
//                 try {
//                     const base64Data = await new Promise((resolve) => {
//                         const reader = new FileReader();
//                         reader.onloadend = () => resolve(reader.result.split('base64,')[1]);
//                         reader.readAsDataURL(blob);
//                     });
//                     if (window.streamChunkToNode) await window.streamChunkToNode(base64Data);
//                 } catch (e) {
//                     console.log('Chunk processing error:', e);
//                 }
//             }
//             isProcessing = false;
//         }

//         recorder.ondataavailable = (event) => {
//             if (event.data && event.data.size > 0) {
//                 chunkQueue.push(event.data);
//                 processQueue();
//             }
//         };

//         recorder.start(3000);
//         console.log('LIVE Streaming started successfully with active tracks!');
//         return true;
//     });

//     lastChunkTime = Date.now();
//     console.log('[*] Engine successfully connected! Monitoring stream health...');
//     while (true) {
//         if (Date.now() - lastChunkTime > 20000) {
//             throw new Error("Stream dropped: No video chunks received from browser for 20 seconds.");
//         }
//         await new Promise(r => setTimeout(r, 2000)); 
//     }
// }

// async function cleanup() {
//     if (ffmpegProcess) {
//         try {
//             ffmpegProcess.stdin.end();
//             ffmpegProcess.kill('SIGINT');
//         } catch (e) { }
//         ffmpegProcess = null;
//     }
//     if (browser) {
//         try {
//             await browser.close();
//         } catch (e) { }
//         browser = null;
//     }
// }

// process.on('SIGINT', async () => {
//     console.log('\n[*] Stopping live script cleanly...');
//     await cleanup();
//     process.exit(0);
// });

// mainLoop();
