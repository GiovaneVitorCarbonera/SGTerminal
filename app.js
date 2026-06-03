const express = require('express');
const app = express();

const carrosRoutes = require('./routes/carros');

app.use(express.json());
app.use('/carros', carrosRoutes);

app.listen(8080, () => {
  console.log('Servidor executando na porta 8080');
});