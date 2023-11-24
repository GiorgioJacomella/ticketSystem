const express = require('express');
const cors = require('cors');
const sql = require('msnodesqlv8');
const CryptoJS = require('crypto-js');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

app.use(
  cors({
    origin: 'http://127.0.0.1:5500', // Replace with the origin of your frontend
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

// Database connection
// Database config and connection
//{
//  "db1": "Driver={SQL Server};Server=your servername;Database=ticketProject;UserId=databaseuser;Password=12345;Encrypt=no;TrustServerCertificate=no;"
//}
const configFilePath = path.join(__dirname, './sqlDatabaseConfig.json');
const configFile = fs.readFileSync(configFilePath, 'utf8');
const config = JSON.parse(configFile); 
const connectionString = config.db1; 

let conn;
sql.open(connectionString, (err, connection) => {
  if (err) {
    console.error(err);
    return;
  }
  conn = connection;
  console.log('Database connected.');

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});

// Functions
function generateRandomString(length) {
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    randomString += charset.charAt(randomIndex);
  }
  return randomString;
}

// APIs
// Signup API
app.post('/signup', (req, res) => {
  const clientInput = req.body;
  if (!clientInput) {
    return res.status(400).json({ error: 'Invalid input data' });
  }
  // password hashing
  const fullNameInput = clientInput.fullNameInput;
  const phoneNumberInput = clientInput.phoneNumberInput;
  const emailInput = clientInput.emailInput;
  const hashedPwd = CryptoJS.SHA256(clientInput.pwd);

  // database interaction
  const sql = `INSERT INTO userInfo (fullName, phoneNr, email, pwdHash, adminState) VALUES ('${fullNameInput}', '${phoneNumberInput}', '${emailInput}', '${hashedPwd}', 'f')`;
  conn.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    console.log(results);
    res.json({ message: 'User signed up successfully' });
  });
});

// Login API
app.post('/login', (req, res) => {
  const clientInput = req.body;
  if (!clientInput) {
    return res.status(400).json({ error: 'Invalid input data' });
  }
  // hashing password
  const hashedPassword = CryptoJS.SHA256(clientInput.pwd);
  // database query to get hash
  const emailInput = clientInput.emailInput;
  const sql = `SELECT * FROM userInfo WHERE email = '${emailInput}'`;
  conn.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    // get correct user
    user = results[0];
    if (
      hashedPassword == user.pwdHash &&
      clientInput.emailInput == user.email
    ) {
      const newKey = generateRandomString(32);
      const ipAddress = req.ip;
      const email = clientInput.emailInput;
      res.cookie(
        'myCookie',
        JSON.stringify({ key: newKey, ipAddress, email }),
        {
          httpOnly: true
        }
      );
      // write new session query
      const sql = `INSERT INTO userSessions (session_key, ip_address, userID) VALUES ('${newKey}', '${ipAddress}', ${user.ID});`;
      conn.query(sql, (err, results) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log(results);
        res.json({ message: 'User logged in successfully' });
      });
    } else {
      return res.status(401).json({ error: 'Wrong username or password' });
    }
  });
});

// Get ticket info
app.get('/requestTickets', (req, res) => {
  const clientCookie = req.cookies.myCookie;

  if (!clientCookie) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  const clientInfo = JSON.parse(clientCookie);

  const sql1 = `SELECT s.ID AS session_id, s.session_key, s.ip_address FROM userSessions AS s INNER JOIN userInfo AS u ON s.userID = u.ID WHERE u.email = '${clientInfo.email}';`;
  conn.query(sql1, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sessionData = results[0];

    // Check session validity
    if (
      clientInfo.key == sessionData.session_key &&
      clientInfo.ipAddress == sessionData.ip_address
    ) {
      // Code if session is valid
      const sql2 = `SELECT te.ID AS TicketID, te.title AS TicketTitle, te.textElement AS TicketText FROM userInfo AS ui INNER JOIN ticketElements AS te ON ui.ID = te.userID WHERE ui.email = '${clientInfo.email}';`;
      conn.query(sql2, (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: 'No tickets found' });
        }

        // Return ticket info
        const tickets = results;
        return res.status(200).json({ tickets });
      });
    } else {
      return res.status(401).json({ error: 'Invalid session' });
    }
  });
});

// Write new ticket
app.post('/newTicket', (req, res) => {
  const clientCookie = req.cookies.myCookie;
  if (!clientCookie) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  const clientInfo = JSON.parse(clientCookie);

  const sql1 = `SELECT s.ID AS session_id, s.session_key, s.ip_address FROM userSessions AS s INNER JOIN userInfo AS u ON s.userID = u.ID WHERE u.email = '${clientInfo.email}';`;
  conn.query(sql1, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sessionData = results[0];

    // Check session validity
    if (
      clientInfo.key == sessionData.session_key &&
      clientInfo.ipAddress == sessionData.ip_address
    ) {
      const userEmail = clientInfo.email;
      const ticketTitle = req.body.ticketTitle;
      const ticketText = req.body.ticketText;

      // retrieve the userID based on the user's email
      const sqlSelectUserID = `SELECT ID FROM userInfo WHERE email = '${userEmail}'`;
      conn.query(sqlSelectUserID, (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        const userID = results[0].ID;

        // insert the new ticket for the user
        const sql2 = `INSERT INTO ticketElements (title, textElement, userID) VALUES ('${ticketTitle}', '${ticketText}', '${userID}')`;
        conn.query(sql2, (err, ticketResults) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
          }

          console.log(ticketResults);
          res.json({ message: 'Ticket added successfully' });
        });
      });
    } else {
      return res.status(401).json({ error: 'Invalid session' });
    }
  });
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('Closing the server and the database connection.');
  if (conn) {
    conn.close();
  }
  process.exit();
});
