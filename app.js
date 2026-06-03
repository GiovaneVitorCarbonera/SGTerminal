const express = require('express');
const app = express();

const authRoutes = require('./routes/auth.js');
const accountsRoutes = require('./routes/accounts.js');
const vehiclemovementsRoutes = require('./routes/vehiclemovements.js');

app.use(express.json());
app.use('/auth', authRoutes);
app.use('/accounts', accountsRoutes);
app.use('/vehicle-movements', vehiclemovementsRoutes);

app.listen(8080, () => {
  console.log('Servidor executando na porta 8080');
});