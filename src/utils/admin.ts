import * as admin from 'firebase-admin';

// Initialize Firebase Admin
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function makeUserAdmin(uid: string) {
  try {
    // Set custom claims for admin role
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log(`Successfully made user ${uid} an admin`);
    return true;
  } catch (error) {
    console.error('Error making user admin:', error);
    return false;
  }
}

// Make the specified user an admin
makeUserAdmin('j8h11QxELpdbVOeF7loIZipbncf1')
  .then(success => {
    if (success) {
      console.log('User info@thinkbots.ai has been made an admin successfully');
    } else {
      console.error('Failed to make user an admin');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Error in admin assignment:', error);
    process.exit(1);
  }); 