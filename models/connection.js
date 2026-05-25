const mongoose = require('mongoose');mongoose.connect(process.env.CONNECTION_STRING, {
  connectTimeoutMS: 2000})
  .then(() => console.log('✅ Connecté à MongoDB'))
  .catch(error => console.error('❌ Erreur MongoDB:', error));