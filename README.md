# ticketSystem
A new open-source ticketing system offers user-friendly navigation, easy ticket submission, and effective tools for managing and resolving issues. It's built for collaboration, making it great for teams that need a flexible and straightforward solution for handling customer support.

###
Technologies used in this Project:
- HTML
- JavaScript
- NodeJS
- BootsTrap
- JWT
- Express API
- SHA256
- MS SQL

### Installation

A step-by-step series of examples that tell you how to get a development environment running.

1. **Clone the Repository**

   ```bash
   git clone https://github.com/GiorgioJacomella/ticketSystem.git
   ```

2. **Install Node Modules**
   ```bash
   cd ticketSystem/back-end
   npm install
   ```
   If needed Install all Modules(SQL Library, Express...)
3. **Setup DB(In my case i used MS SQL)**
   
   Execute the querry at ticketSystem/database/setup.sql, The default Admin user for the Ticketsystem is "admin", with the password "admin".
4. **Configure Connectionstring**
   
    Create sqlDatabaseConfig.json in ticketSystem/back-end/src/ as it's ignored by git for security reasons. 
    ```json
    {
    "db1": "Driver={SQL Server};Server=your servername;Database=ticketProject;UserId=databaseuser;Password=12345;Encrypt=no;TrustServerCertificate=no;"
    }
    ```
5. **Setup JWT Secret key**
   
   Create JWTConfig.json in ticketSystem/back-end/src/ as it's ignored by git for security reasons.
    ```json
    {
    "Secret_JWT": "your_secret_key"
    }
    ```
6. **Execute API**
    ```bash
    node ticketSystem/back-end/src/index.js
    ```
