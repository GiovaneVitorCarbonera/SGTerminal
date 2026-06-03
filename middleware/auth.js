const { expressjwt } = require('express-jwt');

const secret = process.env.JWTSecret;

if (!secret) {
  throw new Error('JWTSecret não definido no ambiente');
}

const secureRoute = expressjwt({
  secret,
  algorithms: ['HS256'],
  requestProperty: 'auth'
});

module.exports = {
  secret,
  secureRoute
};