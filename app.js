const express = require('express');
const app = express();

app.use(express.json());
app.use('/auth', require('./routes/auth.js'));
app.use('/accounts', require('./routes/accounts.js'));
app.use('/vehicle-movements', require('./routes/vehiclemovements.js'));

app.listen(8080, () => {
  console.log('Servidor executando na porta 8080');
});