import express from 'express';
import bodyParser from 'body-parser';
import pg from 'pg';

const app = express();
const port = 3000;

const db = new pg.Client({
  user: 'postgres',
  host: 'localhost',
  database: 'world',
  password: 'ran@PG123',
  port: '5432',
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

async function checkCisitedCountries() {
  const result = await db.query('SELECT country_code from visited_countries');
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });

  return countries;
}

app.get('/', async (req, res) => {
  const countries = await checkCisitedCountries();

  res.render('index.ejs', { countries: countries, total: countries.length });
});

app.post('/add', async (req, res) => {
  const inputValue = req.body['country'];
  // console.log(`input country :`, inputValue);
  // console.log(`input country result :`, result.rows[0].country_code);

  try {
    const result = await db.query(
      "SELECT country_code from countries WHERE LOWER(country_name) LIKE '%' || $1 || '%'; ",
      [inputValue.toLowerCase()]
    );
    const countryCode = result.rows[0].country_code;

    console.log(`countryCode :: `, countryCode);

    try {
      await db.query(
        'INSERT INTO visited_countries (country_code) VALUES ($1)',
        [countryCode]
      );
      res.redirect('/');
    } catch (error) {
      console.log(error);
      const countries = await checkCisitedCountries();
      res.render('index.ejs', {
        countries: countries,
        total: countries.length,
        error: 'Country has already been added, try again.',
      });
    }
  } catch (error) {
    console.log(error);
    const countries = await checkCisitedCountries();
    res.render('index.ejs', {
      countries: countries,
      total: countries.length,
      error: 'Country name does not exist, try again.',
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
