// Set NODE_ENV to test if not already set
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

// Ensure JWT_SECRET is set for tests BEFORE any other imports
// This must be set before server.js loads dotenv
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_only_min_32_chars_long_abcdefghijklmnopqrstuvwxyz';
}

// Load dotenv but don't override JWT_SECRET if already set
require('dotenv').config();
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_only_min_32_chars_long_abcdefghijklmnopqrstuvwxyz';
}

const { sequelize } = require('../models');

let dbConnected = false;

// Setup before all tests with faster failure
beforeAll(async () => {
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL && !process.env.DB_NAME) {
    console.warn('⚠️  WARNING: No database configuration found. Tests will fail.');
    console.warn('Please set DATABASE_URL or DB_NAME, DB_USER, DB_PASSWORD in .env file');
    return;
  }

  // Try to connect - allow more time for cold start (Neon databases may need to wake up)
  try {
    // Set a timeout promise that rejects after 25 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database connection timeout after 25 seconds')), 25000);
    });

    // Race between connection and timeout
    await Promise.race([
      sequelize.authenticate(),
      timeoutPromise
    ]);
    
    dbConnected = true;
    console.log('✅ Database connection established in test setup');
  } catch (error) {
    const errorMsg = error.message || 'Unknown error';
    console.error('❌ Database connection failed:', errorMsg);
    
    if (errorMsg.includes('ENOTFOUND') || errorMsg.includes('getaddrinfo')) {
      console.error('');
      console.error('🔍 DIAGNOSIS: Cannot resolve database hostname');
      console.error('   This usually means:');
      console.error('   1. The DATABASE_URL is incorrect or expired');
      console.error('   2. The database instance is paused or deleted');
      console.error('   3. There is a network connectivity issue');
      console.error('');
    } else if (errorMsg.includes('timeout')) {
      console.error('');
      console.error('🔍 DIAGNOSIS: Database connection timeout');
      console.error('   This usually means:');
      console.error('   1. The database is paused (Neon free tier pauses after inactivity)');
      console.error('   2. Network firewall is blocking the connection');
      console.error('   3. The database server is overloaded or unreachable');
      console.error('');
      console.error('💡 SOLUTION:');
      console.error('   1. Go to Neon dashboard and wake up/resume your database');
      console.error('   2. Check your internet connection and firewall settings');
      console.error('   3. Try the connection string in a database client (pgAdmin, DBeaver)');
      console.error('   4. Verify the DATABASE_URL is correct in your .env file');
      console.error('');
    }
    
    // Don't throw - let tests run but they'll fail when they try to use DB
    // This allows us to see which tests fail vs hanging
    console.warn('⚠️  Continuing tests without database connection (tests will fail)');
    dbConnected = false;
  }
}, 30000); // 30 second timeout for this hook

// Cleanup after all tests
afterAll(async () => {
  // Only close if we successfully connected
  if (dbConnected) {
    try {
      await sequelize.close();
    } catch (error) {
      // Ignore close errors
    }
  }
}, 5000);


