// scripts/testFCM.js
// Usage: node scripts/testFCM.js
// Paste your FCM token from Metro logs below

const TOKEN = 'PASTE_YOUR_FCM_TOKEN_HERE'; // ← paste here

const SERVICE_ACCOUNT = require('../serviceAccountKey.json'); // adjust path

const { GoogleAuth } = require('google-auth-library');

async function getAccessToken() {
  const auth = new GoogleAuth({
    credentials: SERVICE_ACCOUNT,
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  });
  const client = await auth.getClient();
  const token  = await client.getAccessToken();
  return token.token;
}

async function sendTestNotification() {
  try {
    console.log('🚀 Getting Firebase access token...');
    const accessToken = await getAccessToken();

    const projectId = SERVICE_ACCOUNT.project_id;
    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    console.log('📤 Sending test notification to token:', TOKEN.slice(0, 30) + '...');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        message: {
          token: TOKEN,
          notification: {
            title: '💬 John Doe',
            body:  'Hey! This is a test notification from Django chat 🎉',
          },
          data: {
            room_id:  '1',
            msg_id:   '99',
            type:     'new_message',
            sender:   'John Doe',
          },
          android: {
            priority: 'high',
            notification: {
              sound:      'notification',
              channel_id: 'chat_messages',
            },
          },
          apns: {
            payload: {
              aps: {
                sound: 'notification.wav',
                badge: 1,
              },
            },
          },
        },
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Notification sent successfully!');
      console.log('   Message ID:', result.name);
    } else {
      console.error('❌ Failed to send notification:');
      console.error(JSON.stringify(result, null, 2));
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

sendTestNotification();