const express = require('express');
const router = express.Router();
const db = require('../services/DBService.js');
const jwt = require('jsonwebtoken');
const { segredo } = require('../middleware/auth');

router.post('/login', async (req, res) => {
  const { usuario, senha } = req.body;

  if (!usuario || !senha) {
    return res.status(400).json({ erro: 'usuario e senha são obrigatórios' });
  }

  try {
    const query = `
      SELECT id, usuario
      FROM accounts
      WHERE username = $1 AND password_hash = $2
      LIMIT 1
    `;

    const result = await db.query(query, [usuario, senha]);

    if (result.rowCount === 0) {
      return res.status(401).json({ erro: 'credenciais inválidas' });
    }

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, permissions: user.permissions },
      segredo,
      { expiresIn: '1h' }
    );

    return res.json({ token });
  } catch (err) {
    return res.status(500).json({ erro: 'erro interno', detalhe: err.message });
  }
});

module.exports = router;