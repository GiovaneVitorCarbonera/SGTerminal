const { Client } = require('pg');

const connection = new Client({
  host: 'localhost',
  user: 'postgres',
  password: 'sua_senha',
  database: 'api_carros',
  port: 5432
});

connection.connect((erro) => {
  if (erro) {
    console.error('Erro ao conectar no banco:', erro);
    return;
  }

  console.log('Conectado ao PostgreSQL');
});

module.exports = connection;