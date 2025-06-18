const admin = require('firebase-admin');

// Initialize Firebase Admin with the new service account
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: "thinkbots-31319",
    clientEmail: "firebase-adminsdk-fbsvc@thinkbots-31319.iam.gserviceaccount.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDCDG+01RhxgKlA\nuX7atxJZGBmRPdfX7glF9/U1OzvKWg+gogj+2BmCvCoaTFSGgw7/x8meQk8onyPh\n4nK28g+BaqhW1Es0AQk7xu2CPWsOGWTJyght9kxQ/7WdGRUxnrWLfBHXgElNAKkl\ntIyl3DNrgFxm3/b2OmBpRt4Y9rszn/CnBKCMNcdplQMvjpuLw5uaFNzhDfoZ8312\nisNo0vAuMo3UqWe/e1Z9GPMUBDaq6ug6kCNFJHchkDp4UXHqmAWcGGDKAvtld0Y/\nUVGkx+SxTRcZT30skLUo+4i3PIbyTsN3q0p5+ABWKhT7FHlOeKTc/8btwUxnBcYd\nqvdi7SNzAgMBAAECggEABZM6QmKxUdGBOeoabRtW3Fb7doXlbmJkw0Ro2sJOAF6u\nxEJX5C7hQR4ifVqSm9lJjnzUEEc441zMOPB0+dPh0/sjCwRSyp9XLgcIYbB09SCP\n1AUU3UhIczbxMZMB0lSX5w2oxB1cLFIwiehsmVRpi5r1OzaynhklFicN/tyGa6MN\nv3Qu/d+QC7HWZJ7KOJjJfO2fDqlrgifrNIqoJZX6TZDcJbUyhW1hW0N3FH0u4RTU\nXmbkKMMcKdFddmr3N7aAQwyQfp4BERGc4VrJI1XjFHw7KJpY9wYSFHRDYLmlsAnk\n0u/lVc5FRX/SP8tfEHXF4JOiK78eLmUd67VrlKZ9gQKBgQDkFNylssmoD/Raky9q\n5k5k11bNK6DWHcEYUlKtP97Z9Bo1VuAi7nGaLoqb0DAXF0pSke7qPj9muXymfM0F\nnMjC0tAzIpLQcPhi5pfAxU6C6XrbWSNYewhi8QVMh6s/7oprF1akuegpDf1OOyWS\nRbketMUL+yAJdC5kXrkGZuuyiQKBgQDZzR9kExFvl90WR9Eohc2G3g40mhIS4xwc\nQPy259lONJ9IEwLJKBDSkPDm8ZL/epnP2ulzzwczPAP0ON0LVYkokfH3ujtPXrlO\n64INUk6u+taInYIN9mKYxa8pzt82eGc7PfiNo7AA5Gek4t1br5fNeeWEjJvCP548\nWx3XfQ8XGwKBgBSzQANZ4qt6JzdBPIB7PoowcRRV7VcBhFDsx8wpi9REL0zAAb+p\n3G2d476YeoTd/ETaMdDYrXBpTULe+MyVmjL0Zyj87k40spZnT0aTobiH8DqQMIEL\nSYuRTGXRul0nDTEDAT4aEVQIjQDYpWRNJ6v9xBR+Sj4RaVR6tFg8Zw/hAoGBAIyA\n/S0r9+WLjH6hGdcQakQE4BkjA2HXzPyVF/JOoysGW3K9gOCPzjpocmApm3DggHVM\nfanN9pEguFRGkqKLLY5UiEoNg9FyBA1bdGxvmn7bJqa/JXUoavavII7R+8FB7yaS\nldOZsyMANbRy/eX14vIVHvFhW+H19HhvN1MaRC/dAoGBAIRxSdRL0EsHyXr+klrZ\n8ub/NRyY8MoLd8qDJskWlnzf7LlNZZ1HrHc5dfUy8UJzHRtyaEJFz/+9jpptdeN/\nadGP7YMZ0YS7eDJzCXFdYNztncjtPE9qb4JGXBEzMzsPBSKG1MP/V1sgNPqehgjh\n+5Hf6gz2vIHSNQrnUMjtLY+r\n-----END PRIVATE KEY-----\n"
  })
});

async function makeUserAdmin(uid) {
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