const express = require('express');
const cors = require('cors');
const sql = require('msnodesqlv8');
const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

app.use(
  cors({
    origin: 'http://127.0.0.1:5500', // Replace with the origin of your frontend
    credentials: true,
    origin: true
  })
);
app.use(express.json());

// Database connection
// Database config and connection
//{
//  "db1": "Driver={SQL Server};Server=your servername;Database=ticketProject;UserId=databaseuser;Password=12345;Encrypt=no;TrustServerCertificate=no;"
//}
const configFilePathDb = path.join(__dirname, './sqlDatabaseConfig.json');
const dbConfigFile = fs.readFileSync(configFilePathDb, 'utf8');
const dbConfig = JSON.parse(dbConfigFile); 
const connectionString = dbConfig.db1; 

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

//Secret JWR config:
// {
//  "Secret_JWT": "myJWTSecretKey_2024$!_VeryStrong&Random#1234567890"
// }
const configFilePathJWT = path.join(__dirname, './JWTConfig.json');
const configFileJWT = fs.readFileSync(configFilePathJWT, 'utf8');
const config = JSON.parse(configFileJWT); 
const JWT_SECRET = config.Secret_JWT; 

// Functions
function generateRandomString() {
  const length = 10; // Fixed length of 10
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

function generateToken(user, ipaddress) {
  return jwt.sign({ id: user.ID, ip: ipaddress, randomString: generateRandomString}, JWT_SECRET, { expiresIn: '2h' });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
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
  const ipAddress = req.ip;
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
    const user = results[0];
    if (
      hashedPassword == user.pwdHash &&
      clientInput.emailInput == user.email
    ) {
      //jwt token generator
      const newKey = generateToken(user, ipAddress);
      // write new session query
      const sql = `INSERT INTO userSessions (session_key, ip_address, userID) VALUES ('${newKey}', '${ipAddress}', ${user.ID});`;
      conn.query(sql, (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Database error' });
        }
        console.log(results);
        res.json({ message: 'User logged in successfully', JWT: newKey});
      });
    } else {
      return res.status(401).json({ error: 'Wrong username or password' });
    }
  });
});

//Check user Adminstate via API
app.get('/checkAdmin', (req, res) => {
  // Extract JWT from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  // Verify JWT
  try {
    const decoded = verifyToken(token);
    const userId = decoded.id;

    // Check if userId is undefined
    if (userId === undefined) {
      return res.status(400).json({ error: 'Invalid token data' });
    }

    // User is authenticated, proceed to check admin status
    const sql = `SELECT * FROM userInfo WHERE ID = ${userId}`;
    conn.query(sql, (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get the user information
      const user = results[0];

      // Check adminState
      if (user.adminState === 'T') {
        return res.json({ isAdmin: "Admin" });
      } else if (user.adminState === 'C') {
        return res.json({ isAdmin: 'Coworker' });
      } else if (user.adminState === 'F' || user.adminState === 'f') {
        return res.json({ isAdmin: 'User' });
      } else {
        return res.json({ isAdmin: false });
      }
    });
  } catch (err) {
    // Handle invalid token
    return res.status(401).json({ error: 'Invalid token' });
  }
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
        const sql2 = `INSERT INTO ticketElements (title, textElement, statusElement, userID) VALUES ('${ticketTitle}', '${ticketText}', 'unfinished', '${userID}')`;
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
