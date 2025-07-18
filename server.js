const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const { PythonShell } = require('python-shell');

const path = require("path");
const app = express();
const port = 5000;

const BEARER_TOKEN = 'process.env.BEARER_TOKEN';  // Replace with your actual Bearer Token

app.use(express.static(path.join(__dirname)));
app.use(cors());
app.use(bodyParser.json());

// ▶️ Analyze custom text
app.post('/api/sentiment', (req, res) => {
  const text = req.body.text;
  console.log('📝 Received text:', text);

  let options = {
    mode: 'text',
    pythonPath: 'C:\\Python313\\python.exe',
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
    // Step 1: Get user ID from username
    const userRes = await axios.get(`https://api.twitter.com/2/users/by/username/${username}`, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`
      }
    });

    const userId = userRes.data.data.id;

    // Step 2: Fetch tweets from the user
    const tweetsRes = await axios.get(`https://api.twitter.com/2/users/${userId}/tweets?max_results=5`, {
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`
      }
    });

    const tweets = tweetsRes.data.data.map(tweet => tweet.text);

    // Step 3: Run sentiment analysis on each tweet
    const promises = tweets.map(text => {
      return new Promise((resolve, reject) => {
        let options = {
          mode: 'text',
          pythonPath: 'C:\\Python313\\python.exe',
          scriptPath: __dirname,
          args: [text]
        };

        PythonShell.run('predict.py', options).then(results => {
          try {
            const prediction = JSON.parse(results[0]);
            resolve({ tweet: text, sentiment: prediction.prediction });
          } catch (e) {
            resolve({ tweet: text, sentiment: 'Error parsing prediction' });
          }
        }).catch(err => {
          resolve({ tweet: text, sentiment: 'Error during prediction' });
        });
      });
    });

    const predictions = await Promise.all(promises);
    res.json({ tweets: predictions });

  } catch (err) {
    console.error('❌ Error occurred:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch tweets or run sentiment analysis' });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});


app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});
