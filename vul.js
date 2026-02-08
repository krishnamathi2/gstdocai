// File: database.js
// Vulnerable code from krishnamathi2/gstdocai repo
// Uses lodash < 4.17.20 with Prototype Pollution vulnerability

const lodash = require('lodash');  // Version: 4.17.15 (VULNERABLE)
const express = require('express');
const app = express();

// Configuration object that could be polluted
const config = {
  database: {
    host: 'localhost',
    port: 5432,
    debug: false,
    credentials: {
      user: 'admin',
      password: process.env.DB_PASSWORD
    }
  }
};

// VULNERABLE CODE: Merging untrusted user input
app.post('/api/config', (req, res) => {
  const userInput = req.body;  // Attacker sends: { "__proto__": { isAdmin: true } }
  
  // This is vulnerable to Prototype Pollution!
  lodash.merge(config, userInput);
  
  // Attacker can now pollute the prototype
  // and gain admin access to the entire application
  const newUser = {};
  console.log('User is admin:', newUser.isAdmin);  // Could be true after pollution!
  
  res.json({ status: 'config updated' });
});

// Authorization check (can be bypassed)
function checkAuthorization(user) {
  if (user.isAdmin) {
    return true;  // BYPASSED if prototype was polluted!
  }
  return false;
}

// Delete user endpoint (should be admin only)
app.delete('/api/user/:id', (req, res) => {
  const currentUser = { role: 'user' };  // Regular user
  
  if (checkAuthorization(currentUser)) {
    // VULNERABLE: Regular user can delete if prototype was polluted
    const userId = req.params.id;
    // DELETE FROM users WHERE id = userId;
    res.json({ status: 'user deleted' });
  } else {
    res.status(403).json({ error: 'Unauthorized' });
  }
});

module.exports = app;
