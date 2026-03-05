const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const keys = webpush.generateVAPIDKeys();
const envPath = path.join(__dirname, '..', '.env');

let envContent = fs.readFileSync(envPath, 'utf8');

// Remove existing VAPID keys if any
envContent = envContent.replace(/^VAPID_PUBLIC_KEY=.*$/m, '');
envContent = envContent.replace(/^VAPID_PRIVATE_KEY=.*$/m, '');
envContent = envContent.replace(/^VAPID_EMAIL=.*$/m, '');
envContent = envContent.trimEnd();

envContent += `\nVAPID_PUBLIC_KEY=${keys.publicKey}\nVAPID_PRIVATE_KEY=${keys.privateKey}\nVAPID_EMAIL=mailto:admin@inoovaweb.com.br\n`;

fs.writeFileSync(envPath, envContent);
console.log('VAPID keys saved to .env');
console.log('PUBLIC KEY:', keys.publicKey);
