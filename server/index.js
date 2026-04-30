const path = require("path");
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Only use dotenv in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.join(__dirname, './.env') });
}

const memberRoutes = require('./routes/members');
const sessionRoutes = require('./routes/sessions');
const statsRoutes = require('./routes/stats');
const authRoutes = require('./routes/auth');
const contributionRoutes = require('./routes/contributions');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1', authRoutes);
app.use('/api/v1', memberRoutes);
app.use('/api/v1', sessionRoutes);
app.use('/api/v1', statsRoutes);
app.use('/api/v1', contributionRoutes);

// Serve React frontend
app.use(express.static(path.join(__dirname, '../client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('DB Connected...');

    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error('Connection failed...', err);
    process.exit(1);
  }
}

startServer();




