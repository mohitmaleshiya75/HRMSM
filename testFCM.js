// testFCM.js — update to test chat format
const EXPO_TOKEN = 'ExponentPushToken[dmWfcPDlyq6YmPWjAv5kzQ]';

async function sendTestNotification() {
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: EXPO_TOKEN,
      title: '💬 John Doe',
      body: 'Hey this is a chat message!',
      sound: 'default',
      data: {
        room_id: '1',   // ← use a real room_id from your app
        msg_id: '99',
        type: 'new_message',
        title: 'John Doe',
        body: 'Hey this is a chat message!',
      },
    }),
  });

  const result = await response.json();
  if (result.data?.status === 'ok') {
    console.log('✅ Chat notification sent!');
  } else {
    console.error('❌ Failed:', JSON.stringify(result, null, 2));
  }
}

sendTestNotification();