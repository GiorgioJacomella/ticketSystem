USE MASTER;
DROP LOGIN databaseuser;
DROP DATABASE IF EXISTS ticketSystem;
CREATE DATABASE ticketSystem;
USE ticketSystem;

CREATE TABLE [userInfo] (
	ID INT IDENTITY(1,1) PRIMARY KEY,
	fullName VARCHAR(255) NOT NULL,
	phoneNr VARCHAR(255) NOT NULL,
	email VARCHAR(255) NOT NULL,
	pwdHash VARCHAR(255) NOT NULL,
	adminState VARCHAR(2) NOT NULL
);

CREATE TABLE userSessions (
    ID INT IDENTITY(1,1) PRIMARY KEY,
	session_key VARCHAR(255),
	expiration_date DATETIME,
	ip_address VARCHAR(45),
    userID INT,
    FOREIGN KEY (userID) REFERENCES userInfo(ID)
);



-- aditional data for SaaS in example todo list or similar
CREATE TABLE ticketElements (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    title VARCHAR(255),
    textElement VARCHAR(255),
	statusElement VARCHAR(255),
    userID INT,
    FOREIGN KEY (userID) REFERENCES userInfo(ID)
);

--Create Serviceuser with administrator possibilities, password and username are both "admin"
INSERT INTO userInfo (fullName, phoneNr, email, pwdHash, adminState) VALUES ('admin', '000', 'admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'A')



-----Create new user to read, write, update and delete user information from the database
USE master;
CREATE LOGIN databaseuser WITH PASSWORD = '12345'; ----Replace with acctual login

USE ticketSystem;
CREATE USER databaseuser FOR LOGIN databaseuser;
GRANT SELECT, INSERT, UPDATE, DELETE TO databaseuser;


select * FROM userInfo;
select * FROM userSessions;
select * FROM ticketElements;