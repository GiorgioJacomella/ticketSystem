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

    // Extract IP address from the request
    const ip = req.ip;

    // First, check if there is a session for this user with the given IP address
    const sessionSql = `SELECT * FROM userSessions WHERE userID = ${userId} AND ip_address = '${ip}'`;
    conn.query(sessionSql, (err, sessionResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (sessionResults.length === 0) {
        return res.status(401).json({ error: 'No valid session for this IP address' });
      }

      // User has a valid session, proceed to check admin status
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
    });
  } catch (err) {
    // Handle invalid token
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// Get ticket info
app.get('/requestTickets', (req, res) => {
  // Extract the token from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized access' });
  }
  const token = authHeader.split(' ')[1];

  try {
      // Verify the token and extract the user ID
      const decoded = verifyToken(token);
      const userId = decoded.id;

      // Query the database for tickets associated with the user ID
      const sqlQuery = `SELECT * FROM ticketElements WHERE userID = ${userId}`;
      conn.query(sqlQuery, (err, results) => {
          if (err) {
              console.error(err);
              return res.status(500).json({ error: 'Database error' });
          }
          res.json({ tickets: results });
      });
  } catch (error) {
      // Handle token verification errors
      console.error(error);
      return res.status(403).json({ error: 'Invalid or expired token' });
  }
});


// Write new ticket
app.post('/newTicket', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    const userId = decoded.id;
    if (userId === undefined) {
      return res.status(400).json({ error: 'Invalid token data' });
    }
    const clientIp = req.ip;

    const sessionSql = `SELECT * FROM userSessions WHERE userID = ${userId} AND ip_address = '${clientIp}'`;
    conn.query(sessionSql, (err, sessionResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (sessionResults.length === 0) {
        return res.status(401).json({ error: 'No valid session for this IP address' });
      }

      const ticketTitle = req.body.ticketTitle;
      const ticketText = req.body.ticketText;

      const sql = `INSERT INTO ticketElements (title, textElement, statusElement, userID) VALUES ('${ticketTitle}', '${ticketText}', 'unfinished', ${userId})`;
      conn.query(sql, (err, results) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({ message: 'Ticket added successfully' });
      });
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// Update Ticket
app.put('/updateTicket/:ticketId', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    const userId = decoded.id;

    const ticketId = req.params.ticketId;
    if (!ticketId) {
      return res.status(400).json({ error: 'Ticket ID is required' });
    }

    // Query to check if the user is the owner of the ticket or an admin
    const checkSql = 'SELECT userID FROM ticketElements WHERE ID = ?';
    conn.query(checkSql, [ticketId], (err, ticketResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (ticketResults.length === 0) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      const ticketOwner = ticketResults[0].userID;

      // Check if the user is an admin
      const adminCheckSql = 'SELECT adminState FROM userInfo WHERE ID = ?';
      conn.query(adminCheckSql, [userId], (adminErr, userResults) => {
        if (adminErr) {
          console.error(adminErr);
          return res.status(500).json({ error: 'Database error' });
        }

        const isAdmin = userResults[0].adminState === 'T';
        if (userId === ticketOwner || isAdmin) {
          const { updatedTitle, updatedText, updatedStatus } = req.body;

          if (!updatedTitle && !updatedText && !updatedStatus) {
            return res.status(400).json({ error: 'Nothing to update' });
          }

          const successMessages = [];

          const updates = [];
          if (updatedTitle) updates.push(`title = '${updatedTitle}'`);
          if (updatedText) updates.push(`textElement = '${updatedText}'`);
          if (updatedStatus) updates.push(`statusElement = '${updatedStatus}'`);

          const updateSql = `UPDATE ticketElements SET ${updates.join(', ')} WHERE ID = ?`;
          conn.query(updateSql, [ticketId], (updateErr, updateResult) => {
            if (updateErr) {
              console.error(updateErr);
              return res.status(500).json({ error: 'Database error' });
            }

            if (updateResult.affectedRows === 0) {
              return res.status(400).json({ error: 'No updates were applied' });
            }

            successMessages.push('Ticket updated successfully');
            res.status(200).json({ message: successMessages });
          });
        } else {
          return res.status(403).json({ error: 'Unauthorized to update this ticket' });
        }
      });
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});


//Delete Ticket
app.delete('/deleteTicket', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    const userId = decoded.id;

    const ticketId = req.body.ticketId;
    if (!ticketId) {
      return res.status(400).json({ error: 'Ticket ID is required' });
    }

    // Query to check if the user is the owner of the ticket or an admin
    const checkSql = `SELECT * FROM ticketElements WHERE ID = ${ticketId}`;
    conn.query(checkSql, (err, ticketResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (ticketResults.length === 0) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      const ticketOwner = ticketResults[0].userID;

      // Check if the user is an admin
      const adminCheckSql = `SELECT * FROM userInfo WHERE ID = ${userId}`;
      conn.query(adminCheckSql, (adminErr, userResults) => {
        if (adminErr) {
          console.error(adminErr);
          return res.status(500).json({ error: 'Database error' });
        }

        const isAdmin = userResults[0].adminState === 'T';
        if (userId === ticketOwner || isAdmin) {
          // Delete the ticket
          const deleteSql = `DELETE FROM ticketElements WHERE ID = ${ticketId}`;
          conn.query(deleteSql, (deleteErr, deleteResults) => {
            if (deleteErr) {
              console.error(deleteErr);
              return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Ticket deleted successfully' });
          });
        } else {
          return res.status(403).json({ error: 'Unauthorized to delete this ticket' });
        }
      });
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});


// Handle server shutdown
process.on('SIGINT', () => {
  console.log('Closing the server and the database connection.');
  if (conn) {
    conn.close();
  }
  process.exit();
});
