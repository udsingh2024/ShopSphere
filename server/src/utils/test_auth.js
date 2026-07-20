const assert = require('assert');
const { signupSchema, loginSchema, changePasswordSchema } = require('../validators/auth.validator');
const { generateAccessToken, generateRefreshToken, hashToken } = require('./tokens');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

console.log('\n======================================================');
console.log('            SHOPSPHERE AUTH & SECURITY UNIT TESTS       ');
console.log('======================================================\n');

let passCount = 0;
let failCount = 0;

const test = (name, fn) => {
  try {
    fn();
    console.log(`[\x1b[32mPASS\x1b[0m] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`[\x1b[31mFAIL\x1b[0m] ${name}`);
    console.error(err);
    failCount++;
  }
};

// 1. Password validation tests
test('Password Validation - Weak password should be rejected', () => {
  const weakPassword = 'weak';
  const result = signupSchema.safeParse({
    body: {
      name: 'Test User',
      email: 'test@example.com',
      password: weakPassword
    }
  });
  assert.strictEqual(result.success, false, 'Should fail validation');
  const errorMsg = result.error.errors[0].message;
  assert.ok(errorMsg.includes('uppercase') || errorMsg.includes('8 characters'), 'Error should mention complexity constraints');
});

test('Password Validation - Password missing special character should be rejected', () => {
  const result = signupSchema.safeParse({
    body: {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123'
    }
  });
  assert.strictEqual(result.success, false, 'Should fail validation due to missing special char');
});

test('Password Validation - Strong password should pass validation', () => {
  const result = signupSchema.safeParse({
    body: {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!'
    }
  });
  assert.strictEqual(result.success, true, 'Strong password must pass validation rules');
});

// 2. JWT token tests
test('JWT Tokens - Access Token signature and payloads', () => {
  const userId = '507f1f77bcf86cd799439011';
  const sessionId = '507f1f77bcf86cd799439012';
  
  process.env.JWT_SECRET = 'test_secret_key_12345';
  const token = generateAccessToken(userId, sessionId);
  
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  assert.strictEqual(decoded.id, userId);
  assert.strictEqual(decoded.sessionId, sessionId);
});

test('JWT Tokens - Refresh Token rotation signatures', () => {
  const userId = '507f1f77bcf86cd799439011';
  const sessionId = '507f1f77bcf86cd799439012';
  
  process.env.JWT_REFRESH_SECRET = 'test_refresh_key_12345';
  const token = generateRefreshToken(userId, sessionId);
  
  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  assert.strictEqual(decoded.id, userId);
  assert.strictEqual(decoded.sessionId, sessionId);
});

// 3. Token hashing tests
test('Cryptography - Hash Token verification', () => {
  const rawToken = 'super_secret_refresh_token_signature';
  const hash1 = hashToken(rawToken);
  const hash2 = crypto.createHash('sha256').update(rawToken).digest('hex');
  
  assert.strictEqual(hash1, hash2, 'Hash utility must match SHA-256 hex digests');
});

// 4. Google credential decodes
test('Google Auth - JWT payload parsing simulation', () => {
  const googleId = '1234567890';
  const email = 'google.user@gmail.com';
  const name = 'Google User';
  const picture = 'https://images.unsplash.com/photo.jpg';

  const mockPayload = { sub: googleId, email, name, picture };
  const base64Payload = Buffer.from(JSON.stringify(mockPayload)).toString('base64');
  const mockToken = `header.${base64Payload}.signature`;

  const parts = mockToken.split('.');
  assert.strictEqual(parts.length, 3);
  
  const decodedPayload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
  assert.strictEqual(decodedPayload.sub, googleId);
  assert.strictEqual(decodedPayload.email, email);
  assert.strictEqual(decodedPayload.name, name);
  assert.strictEqual(decodedPayload.picture, picture);
});

console.log('\n======================================================');
console.log(`TEST SUMMARY: ${passCount} Passed, ${failCount} Failed.`);
console.log('======================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
