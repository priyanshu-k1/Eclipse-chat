const express = require('express')
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const http = require('http');
require('dotenv').config();

const app = express()
const server = http.createServer(app);
const { Server } = require('socket.io');

app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, 
});


app.use(limiter);
const port = process.env.port


const io = new Server(server, {
    cors: {
        origin: '*', // later add front end url
        methods: ['GET', 'POST']
    }
});


const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');



app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.use('api/auth/user',authRoutes);


// Connect to DB before starting server
connectDB();
app.listen(port, () => {
  console.log(`http://localhost:${port}`)
})