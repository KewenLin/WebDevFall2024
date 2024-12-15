import express from "express";
import bodyParser from "body-parser";
import bcrypt from 'bcryptjs';
import session from "express-session";
import pg from "pg";
import axios from "axios";
import pkg from 'pg';  
const { Pool } = pkg;


const port = 3000;
const app = express();

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', './views'); // Set directory for EJS templates

app.use(bodyParser.json()); // For parsing application/json
app.use(bodyParser.urlencoded({ extended: true }));

// Use session middleware
app.use(
    session({
      secret: "secret-key", 
      resave: false, 
      saveUninitialized: false, 
    })
  );

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "web_dev",
  password: "1234",
  port: 5432,
});

db.connect();

app.get('/', (req, res) => {
    res.render('index');
});

// Route for Register page
app.get('/register', (req, res) => {
    res.render('register');  // Render the register.ejs template
});
  
// Route for Login page
app.get('/login', (req, res) => {
    res.render('login');  // Render the login.ejs template
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Failed to log out');
        }
        res.redirect('/login'); // Redirect to login 
    });
});

app.get('/historyTable', async (req, res) =>{
    const userId = req.session.userId;  // Retrieve the userId from the session

    if (!userId) {
        return res.redirect('/login'); // Redirect to login if user is not logged in
    }
    try {
        // Fetch exchange history for this user
        const historyResult = await db.query("SELECT * FROM exchange_history WHERE user_id = $1 ORDER BY timestamp DESC", [userId]);

        res.render('historyTable', { history: historyResult.rows });
    } catch (error) {
        console.error('Error fetching exchange history:', error.message);
        res.status(500).send('Failed to fetch exchange history');
    }
});

app.get('/exchange', (req, res) => {
    res.render('exchange')
});

app.get('/convertHighLow', (req, res) => {
  res.render('convertHighLow')
});

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      res.send("Email already exists. Try logging in.");
    } else {
      const result = await db.query(
        "INSERT INTO users (email, password) VALUES ($1, $2)",
        [email, password]
      );
      // Store the userId in the session
      req.session.userId = result.rows[0].id;

      console.log(result);
      res.redirect('/exchange');
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/login", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const storedPassword = user.password;

      if (password === storedPassword) {
        // Store the userId in the session
        req.session.userId = result.rows[0].id;
        res.redirect('/exchange');
      } else {
        res.send("Incorrect Password");
      }
    } else {
      res.send("User not found");
    }
  } catch (err) {
    console.log(err);
  }
});

app.get('/convert', async (req, res) => {
    const { base, target, amount } = req.query;
    const userId = req.session.userId;

    if (!userId) {
        return res.redirect('/login'); // Redirect if user is not logged in
    }

    let conversionResult = {
        base: base || 'USD',
        target: target || 'EUR',
        amount: amount || 0,
        conversionRate: 0,
        convertedAmount: 0,
    };

    const currencyNames = {
        USD: "US Dollar",
        EUR: "Euro",
        GBP: "British Pound",
        INR: "Indian Rupee",
        AUD: "Australian Dollar",
        CAD: "Canadian Dollar",
        JPY: "Japanese Yen",
        CHF: "Swiss Franc",
        CNY: "Chinese Yuan",
        MXN: "Mexican Peso",
        BRL: "Brazilian Real",
        ZAR: "South African Rand",
        HKD: "Hong Kong Dollar",
    };

    try {
        if (base === target) {
            conversionResult = {
                base: currencyNames[base],
                target: currencyNames[target],
                amount,
                conversionRate: 1,
                convertedAmount: amount,
            };
        } else if (base && target && amount) {
            const response = await axios.get('https://api.frankfurter.app/latest', {
                params: {
                    from: base,
                    to: target,
                },
            });

            const conversionRate = response.data.rates[target];
            conversionResult = {
                base: currencyNames[base],
                target: currencyNames[target],
                amount,
                conversionRate,
                convertedAmount: conversionRate * amount,
            };

            // Save conversion history to the database
            await db.query(
                "INSERT INTO exchange_history (user_id, base_currency, target_currency, amount, conversion_rate, converted_amount) VALUES ($1, $2, $3, $4, $5, $6)",
                [userId, base, target, amount, conversionRate, conversionResult.convertedAmount]
            );
        }
        res.render('exchangeResult', { conversionResult });
    } catch (error) {
        console.error('Error fetching conversion rate:', error.message);
        res.status(500).send('Failed to fetch conversion rate');
    }
});

app.get('/convertHighLowResult', async (req, res) => {
  const { base, amount } = req.query;
  const userId = req.session.userId;

  // Default base currency if not provided
  const baseCurrency = base || 'Eur';
  const conversionAmount = amount || 1;

  const currencyNames = {
    USD: "US Dollar",
    EUR: "Euro",
    GBP: "British Pound",
    INR: "Indian Rupee",
    AUD: "Australian Dollar",
    CAD: "Canadian Dollar",
    JPY: "Japanese Yen",
    CHF: "Swiss Franc",
    CNY: "Chinese Yuan",
    MXN: "Mexican Peso",
    BRL: "Brazilian Real",
    ZAR: "South African Rand",
    HKD: "Hong Kong Dollar",
  };

  // Fetch exchange rates for the base currency
  try {
    // Request to get rates for all currencies relative to the base currency
    const response = await axios.get('https://api.frankfurter.app/latest', {
      params: {
        from: baseCurrency,
        to: Object.keys(currencyNames).join(','),  // Fetch exchange rates for all currencies in the list
      },
    });

    const rates = response.data.rates;
    console.log(rates);
    // Find the highest and lowest value currencies
    let highestCurrency = null;
    let lowestCurrency = null;
    let highestValue = -Infinity;
    let lowestValue = Infinity;

    for (const currency in rates) {
      const rate = rates[currency];
      if (rate > highestValue) {
        highestValue = rate;
        highestCurrency = currency;
      }
      if (rate < lowestValue) {
        lowestValue = rate;
        lowestCurrency = currency;
      }
    }
    
    // Fetch conversion rates for the highest and lowest currencies
    const highestConvertedAmount = highestValue * conversionAmount;
    const lowestConvertedAmount = lowestValue * conversionAmount;

    if (userId) {
      await db.query(
        "INSERT INTO exchange_history (user_id, base_currency, target_currency, amount, conversion_rate, converted_amount, timestamp) VALUES ($1, $2, $3, $4, $5, $6, NOW())",
        [userId, baseCurrency, highestCurrency, conversionAmount, highestValue, highestConvertedAmount]
      );
      await db.query(
        "INSERT INTO exchange_history (user_id, base_currency, target_currency, amount, conversion_rate, converted_amount, timestamp) VALUES ($1, $2, $3, $4, $5, $6, NOW())",
        [userId, baseCurrency, lowestCurrency, conversionAmount, lowestValue, lowestConvertedAmount]
      );
    }
    // Render the page with the results
    res.render('convertHighLowResult', {
      baseCurrency,
      conversionAmount,
      highestCurrency,
      lowestCurrency,
      highestConvertedAmount,
      lowestConvertedAmount,
      highestValue,
      lowestValue,
    });
  } catch (error) {
    console.error('Error fetching conversion rates:', error.message);
    res.status(500).send('Failed to fetch conversion rates');
  }
});


app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});