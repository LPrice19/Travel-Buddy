const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs').promises; 
const axios = require('axios');
const session = require('express-session');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({ secret: 'your-secret-key', resave: false, saveUninitialized: true }));

const LOGIN_FILE_PATH = './loginDetails.json';
const TRIP_FILE_PATH = './tripDetails.json';

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/static/index.html');
});

app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/static/register.html');
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/static/login.html');
});

app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/static/dashboard.html');
});

app.get('/propose', (req, res) => {
  res.sendFile(__dirname + '/static/propose.html');
});

app.get('/find', (req, res) => {
  res.sendFile(__dirname + '/static/find.html');
});

app.post('/login', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  try {
    const fileContent = await fs.readFile(LOGIN_FILE_PATH, 'utf8');
    const existingData = JSON.parse(fileContent);

    const user = existingData.find((user) => user.username === username && user.password === password);

    if (!user) {
      return res.status(401).send('Invalid username or password');
    }

    req.session.user = user;

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/register', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const loginDetails = {
    username: username,
    password: password,
  };

  try {
    const fileContent = await fs.readFile(LOGIN_FILE_PATH, 'utf8');
    const existingData = JSON.parse(fileContent);

    const usernameExists = existingData.some((user) => user.username === username);
    if (usernameExists) {
      return res.status(400).send('Username already exists. Please choose a different one.');
    }

    const randomNumberResponse = await axios.get('http://www.randomnumberapi.com/api/v1.0/random?min=1&max=100&count=1&format=json');
    const randomNumber = randomNumberResponse.data;

    const userWithRandomNumber = {
      ...loginDetails,
      randomNumber: randomNumber,
    };

    existingData.push(userWithRandomNumber);

    await fs.writeFile(LOGIN_FILE_PATH, JSON.stringify(existingData, null, 2));

    console.log('Login details saved successfully.');
    
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Internal Server Error');
  }
});


app.post('/propose', async (req, res) => {
  const cityName = req.body.city;
  const proposedDate = req.body.date;
  const duration = req.body.duration;

  try {
    // Simulate weather API response for testing
    // Replace this with your actual weather API call
    const temperature = await fetchWeather(cityName, proposedDate);

    const tripDetails = {
      city: cityName,
      proposedDate: proposedDate,
      duration: duration,
      temperature: temperature !== undefined ? `${temperature} °C` : 'N/A',
    };

    // Read existing trip data from file
    let existingData = [];
    try {
      const fileContent = await fs.readFile(TRIP_FILE_PATH, 'utf8');
      existingData = JSON.parse(fileContent);
    } catch (error) {
      console.error('Error reading trip data file:', error.message);
    }

    // Append new trip details to existing data
    existingData.push(tripDetails);

    // Write updated trip data back to file
    await fs.writeFile(TRIP_FILE_PATH, JSON.stringify(existingData, null, 2));

    console.log('Trip details saved successfully.');

    res.redirect('/dashboard'); // Redirect to dashboard after successful save
  } catch (error) {
    console.error('Error saving trip details:', error.message);
    res.status(500).send('Error saving trip details. Please try again later.');
  }
});

// Function to fetch weather (replace with actual weather API call)
async function fetchWeather(cityName, proposedDate) {
  // Replace with actual weather API integration
  // Simulate weather response
  return Math.floor(Math.random() * 30); // Simulated temperature
}



app.post('/expressInterest', async (req, res) => {
  const tripDetails = req.body;

  try {
      const existingData = await fs.readFile('./tripInterest.json', 'utf8').then(JSON.parse).catch(() => [])
      existingData.push(tripDetails);

      await fs.writeFile('./tripInterest.json', JSON.stringify(existingData, null, 2));

      console.log('Trip details saved to tripInterest.json successfully.');

    
      res.status(200).json({ message: 'Trip details saved successfully' });
  } catch (error) {
      console.error('Error:', error.message);
    
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/getTrips', async (req, res) => {
  const city = req.query.city;
  const date = req.query.date;

  try {
  
    const fileContent = await fs.readFile(TRIP_FILE_PATH, 'utf8');
    const existingData = JSON.parse(fileContent);

  
    const matchingTrips = existingData.filter(trip => trip.city === city && trip.proposedDate === date);

    
    if (matchingTrips.length > 0) {
      res.json(matchingTrips[0]);
    } else {
   
      res.status(404).json({ error: 'Trips not found' });
    }
  } catch (error) {
    console.error('Error retrieving trips:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



const port = 4000;

app.listen(port, () => console.log(`This app is listening on port ${port}`));