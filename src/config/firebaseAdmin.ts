import admin from 'firebase-admin';

const serviceAccount = require('../firebase/trazer-e4cb2-firebase-adminsdk-fbsvc-559b9a1c97.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;

export function messaging() {
  throw new Error('Function not implemented.');
}
