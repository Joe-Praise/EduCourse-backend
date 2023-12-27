const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! ❌ Shutting down...');
  console.log(err.name, err.message);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose.connect(DB);

mongoose.connection.on('open', () => {
  console.log('Mongodb Connected');
});

const port = process.env.NODE_ENV === 'production' ? process.env.PORT : 3050;

app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// handling all unhandled rejection
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! ❌ Shutting down...');
  console.log(err.name, err.message);
});
