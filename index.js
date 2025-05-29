const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'mycontacts',
  password: 'password', // Replace with your actual PostgreSQL password
  port: 5432,
});

// Test endpoint to check if server is running
app.get('/test', (req, res) => {
  res.status(200).send('Server is running!');
});

app.post('/identify', async (req, res) => {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    return res.status(400).send('Please send an email or phone number!');
  }

  try {
    // Test database connection
    await pool.query('SELECT 1');
    console.log('Database connection successful');

    // Look for matching contacts
    console.log('Querying contacts with email:', email, 'phoneNumber:', phoneNumber);
    const result = await pool.query(
      'SELECT * FROM contacts WHERE email = $1 OR phonenumber = $2',
      [email || null, phoneNumber || null]
    );
    let contacts = result.rows;
    console.log('Found contacts:', contacts);

    if (contacts.length === 0) {
      console.log('No matching contacts, creating new primary contact');
      // No match? Make a new primary contact
      const newContact = await pool.query(
        'INSERT INTO contacts (phonenumber, email, linkprecedence) VALUES ($1, $2, $3) RETURNING *',
        [phoneNumber, email, 'primary']
      );
      contacts = [newContact.rows[0]];
      console.log('Created new contact:', contacts[0]);
    } else {
      // Check if we have new info
      const hasNewEmail = email && !contacts.some(c => c.email === email);
      const hasNewPhone = phoneNumber && !contacts.some(c => c.phonenumber === phoneNumber);
      console.log('New email:', hasNewEmail, 'New phone:', hasNewPhone);

      if (hasNewEmail || hasNewPhone) {
        console.log('Creating secondary contact');
        // Add new info as a secondary contact
        const newContact = await pool.query(
          'INSERT INTO contacts (phonenumber, email, linkprecedence, linkedid) VALUES ($1, $2, $3, $4) RETURNING *',
          [phoneNumber, email, 'secondary', contacts[0].id]
        );
        contacts.push(newContact.rows[0]);
        console.log('Created secondary contact:', newContact.rows[0]);
      }
    }

    // Build the response
    const primaryContact = contacts.find(c => c.linkprecedence === 'primary');
    if (!primaryContact) {
      throw new Error('No primary contact found');
    }
    const emails = [...new Set(contacts.map(c => c.email).filter(e => e))];
    const phoneNumbers = [...new Set(contacts.map(c => c.phonenumber).filter(p => p))];
    const secondaryIds = contacts
      .filter(c => c.linkprecedence === 'secondary')
      .map(c => c.id);
    console.log('Response:', { primaryContactId: primaryContact.id, emails, phoneNumbers, secondaryIds });

    res.status(200).json({
      contact: {
        primaryContactId: primaryContact.id,
        emails: emails,
        phoneNumbers: phoneNumbers,
        secondaryContactIds: secondaryIds,
      },
    });
  } catch (error) {
    console.error('Detailed error:', error.message, error.stack);
    res.status(500).send('Something went wrong!');
  }
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});