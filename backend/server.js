const express = require('express')
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const app = express()

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

const port = 5001






app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.listen(port, () => {
  console.log(`http://localhost:${port}`)
})