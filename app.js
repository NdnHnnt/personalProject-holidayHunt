const express = require('express');
const { config } = require('dotenv');
config();

const app = express();
const port = 3000;

async function fetchHolidays(selectedCountry, selectedYear) {
  const apiKey = process.env.ApiKey;
  const apiUrl = `https://calendarific.com/api/v2/holidays?api_key=${apiKey}&country=${selectedCountry}&year=${selectedYear}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data.response.holidays;
  } catch (error) {
    console.error('Error fetching holidays:', error);
    throw error;
  }
}

app.use(express.static('public'));
app.use(express.json());

app.get('/holidays', async (req, res) => {
  const selectedCountry = req.query.country;
  const selectedYear = req.query.year;

  try {
    const holidays = await fetchHolidays(selectedCountry, selectedYear);
    res.json(holidays);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    res.status(500).json({ error: 'Error fetching holidays' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
