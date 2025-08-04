require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const { PythonShell } = require('python-shell');
const path = require("path");

const app = express();
const port = 5000;

const BEARER_TOKEN = process.env.BEARER_TOKEN;

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(bodyParser.json());

// ▶️ Analyze custom text
app.post('/api/sentiment', (req, res) => {
  const text = req.body.text;
  console.log('📝 Received text:', text);

  let options = {
    mode: 'text',
    pythonPath: process.env.PYTHON_PATH || 'python3', // Default to python3 for Docker
    scriptPath: __dirname,
    args: [text]
  };

  PythonShell.run('predict.py', options).then(results => {
    const prediction = JSON.parse(results[0]);
    res.json(prediction);
  }).catch(err => {
    console.error('❌ PythonShell Error:', err);
    res.status(500).json({ error: 'Prediction failed.' });
  });
});

// ▶️ Analyze tweets from username
app.post('/api/username', async (req, res) => {
  const username = req.body.username;
  console.log('🔍 Received username:', username);

  try {
    // Get user ID
    const userRes = await axios.get(`https://api.twitter.com/2/users/by/username/${username}`, {
      headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` }
    });
    const userId = userRes.data.data.id;

    // Get tweets
    const tweetsRes = await axios.get(`https://api.twitter.com/2/users/${userId}/tweets?max_results=5`, {
      headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` }
    });
    const tweets = tweetsRes.data.data.map(tweet => tweet.text);

    // Analyze each tweet
    const predictions = await Promise.all(
      tweets.map(text =>
        new Promise(resolve => {
          let options = {
            mode: 'text',
            pythonPath: process.env.PYTHON_PATH || 'python3',
            scriptPath: __dirname,
            args: [text]
          };

          PythonShell.run('predict.py', options)
            .then(results => {
              const prediction = JSON.parse(results[0]);
              resolve({ tweet: text, sentiment: prediction.prediction });
            })
            .catch(err => {
              console.error('⚠️ Error analyzing tweet:', err);
              resolve({ tweet: text, sentiment: 'Error during prediction' });
            });
        })
      )
    );

    res.json({ tweets: predictions });

  } catch (err) {
    console.error('❌ Error fetching tweets:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch tweets or run sentiment analysis' });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"), {
    headers: { 'Content-Type': 'text/html; charset=UTF-8' }
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
