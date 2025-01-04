export default () => ({
  app: {
    environment: process.env.NODE_ENV || 'local',
    port: parseInt(process.env.PORT, 10) || 3004,
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    name: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT, 10),
    synchronize: process.env.DB_SYNC === 'true',
    type: process.env.DB_TYPE,
    username: process.env.DB_USERNAME,
  },
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY,
    appId: process.env.FIREBASE_APP_ID,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  },
  googleAuth: {
    clientId: process.env.GOOGLE_CLIENT_ID,
  },
  jwt: {
    secretKey: process.env.SECRET_KEY_JWT,
    secretKeyRefreshToken: process.env.SECRET_KEY_REFRESH_JWT,
  },
  sendEmail: {
    host: process.env.MAIL_HOST,
    passAuth: process.env.MAIL_PASS,
    port: process.env.MAIL_PORT || 587,
    userAuth: process.env.MAIL_USER,
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
  },
  whatsapp: {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    graphApiUrl: process.env.WHATSAPP_GRAPH_API_URL,
    phoneId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  },
})
