const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const winston = require('winston');
const expressWinston = require('express-winston');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const xss = require('xss-clean');
const sqlInject = require('sqlstring'); 
const axios = require('axios');

dotenv.config();
const app = express();

const systemInfoRoute = require('./routes/systemInfoRoute');
const teamMemberRoutes = require("./routes/teamMemberRoutes");
const aircraftRoutes = require("./routes/aircraftRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const dealRoutes = require("./routes/dealRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const errorHandler = require("./middlewares/errorHandler");

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(xss()); 

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ip, method, url, userAgent, stack }) => {
    if (stack) {
      return `${timestamp} [${level}] ${stack}`;
    }
    return `${timestamp} [${level}] IP: ${ip} Method: ${method} URL: ${url} User-Agent: ${userAgent} - ${message}`;
  })
);

const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/app.log', level: 'info' })
  ]
});

app.use(expressWinston.logger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/requests.log' })
  ],
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorize: true,
}));

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after an hour.'
});
app.use(limiter);

app.use("/api", systemInfoRoute);
app.use("/api/team-members", teamMemberRoutes);
app.use("/api/aircrafts", aircraftRoutes);
app.use("/api/our-services", serviceRoutes);
app.use("/api/deal-of-the-day", dealRoutes);
app.use("/api/customer-reviews", reviewRoutes);

app.use(errorHandler);

const databaseDir = path.join(__dirname, 'database');
if (!fs.existsSync(databaseDir)) {
  fs.mkdirSync(databaseDir);
}

const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9.]/g, '_');
};

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const sanitizedBaseName = sanitizeFilename(path.basename(file.originalname, ext));
    const uniqueFilename = `${sanitizedBaseName}_${uuidv4()}${ext}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

app.post('/api/image/upload', upload.single('image'), (req, res) => {
  try {
    const { description, name } = req.body;

    if (!description || !name || !req.file) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const uniqueId = uuidv4();
    const sanitizedFilename = sanitizeFilename(req.file.originalname);
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    res.status(201).json({
      message: 'Image uploaded successfully',
      id: uniqueId,
      originalFilename: req.file.originalname,
      sanitizedFilename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      description,
      name,
      imageUrl,
    });
  } catch (error) {
    logger.error('Failed to upload image.', { stack: error.stack });
    res.status(500).json({ error: 'Failed to upload image.' });
  }
});

app.delete('/api/image/upload/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, 'uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    fs.unlinkSync(filePath);
    res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete image.', { stack: error.stack });
    res.status(500).json({ error: 'Failed to delete image.' });
  }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const sendTelegramNotification = (message) => {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;
  
  const telegramUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
  const formattedMessage = `
    🚨 *Critical System Error!*

    📅 *Date & Time:* ${new Date().toLocaleString()}
    💥 *Error Details:*
    ${message}

    ⚠️ *Immediate action required!*

  `;

  axios.post(telegramUrl, {
    chat_id: telegramChatId,
    text: formattedMessage,
    parse_mode: 'Markdown',
  }).catch(err => console.error('Error sending notification to Telegram:', err));
};

process.on('uncaughtException', (err) => {
  const errorMessage = `Uncaught Exception: ${err.message}\nStack: ${err.stack}`;
  sendTelegramNotification(errorMessage);
  logger.error('Uncaught Exception:', { stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  const errorMessage = `Unhandled Rejection: ${reason}`;
  sendTelegramNotification(errorMessage);
  logger.error('Unhandled Rejection:', { reason });
  process.exit(1);
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});