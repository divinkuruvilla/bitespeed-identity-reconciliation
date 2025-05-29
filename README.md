# Bitespeed Identity Reconciliation

A Node.js web service for linking customer contacts based on email or phone number.

## Endpoint
- **POST /identify**: Accepts JSON body with `email` and/or `phoneNumber`.
- URL: `https://your-app.onrender.com/identify`

## Setup
- Install dependencies: `npm install express pg`
- Create a PostgreSQL database named `mycontacts` with the `contacts` table.
- Run: `node index.js`

## Database Schema
```sql
CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  phonenumber VARCHAR(50),
  email VARCHAR(255),
  linkedid INTEGER,
  linkprecedence VARCHAR(20),
  createdat TIMESTAMP DEFAULT NOW(),
  updatedat TIMESTAMP DEFAULT NOW()
);
