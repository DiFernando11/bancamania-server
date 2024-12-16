export default () => ({
  app: {
    port: parseInt(process.env.PORT, 10) || 3004,
    environment: process.env.NODE_ENV || 'local',
  },
  database: {
    type: process.env.DB_TYPE,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
    synchronize: process.env.DB_SYNC === 'true',
  },
  jwt: {
    secretKey: process.env.SECRET_KEY_JWT,
    expire: process.env.EXPIRES_IN_JWT,
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
  },
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
  },
  googleAuth: {
    clientId: process.env.GOOGLE_CLIENT_ID,
  },
  whatsapp: {
    graphApiUrl: process.env.WHATSAPP_GRAPH_API_URL,
    phoneId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  },
  sendEmail: {
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT || 587,
    secure: process.env.MAIL_SECURE || false,
    userAuth: process.env.MAIL_USER,
    passAuth: process.env.MAIL_PASS,
  },
});
