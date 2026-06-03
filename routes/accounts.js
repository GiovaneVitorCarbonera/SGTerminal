const express = require('express');
const router = express.Router();
const db = require('../services/DBService.js');
const { secureRoute } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../middleware/permissions');

router.post(
  '/',
  secureRoute,
  requirePermission([PERMISSIONS.CREATE_USER]),
  async (req, res) => {
    const { username, password_hash, permissions } = req.body;

    if (!username || !password_hash || !Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    try {
      const result = await db.query(
        `
        INSERT INTO accounts
        (username, password_hash, permissions)
        VALUES ($1, $2, $3)
        RETURNING id, username, permissions, created_at
        `,
        [username, password_hash, permissions]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao criar conta' });
    }
  }
);

router.get(
  '/',
  secureRoute,
  requirePermission([PERMISSIONS.GET_USERS]),
  async (req, res) => {
    try {
      const result = await db.query(`
        SELECT id, username, permissions, created_at
        FROM accounts
        ORDER BY id
      `);

      res.status(200).json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao listar contas' });
    }
  }
);

router.get(
  '/:Id',
  secureRoute,
  requirePermission([PERMISSIONS.GET_USER]),
  async (req, res) => {
    const id = Number(req.params.Id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    try {
      const result = await db.query(
        `
        SELECT id, username, permissions, created_at
        FROM accounts
        WHERE id = $1
        `,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Conta não encontrada' });
      }

      res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao buscar conta' });
    }
  }
);

router.delete(
  '/:Id',
  secureRoute,
  requirePermission([PERMISSIONS.DELETE_USER]),
  async (req, res) => {
    const id = Number(req.params.Id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    try {
      const result = await db.query(
        `
        DELETE FROM accounts
        WHERE id = $1
        RETURNING id
        `,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Conta não encontrada' });
      }

      res.status(200).json({ message: 'Conta removida com sucesso' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao remover conta' });
    }
  }
);

router.put(
  '/:Id',
  secureRoute,
  requirePermission([PERMISSIONS.EDIT_USER]),
  async (req, res) => {
    const id = Number(req.params.Id);
    const { username, password_hash, permissions } = req.body;

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    if (!username || !Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    try {
      const result = await db.query(
        `
        UPDATE accounts
        SET
          username = $1,
          password_hash = COALESCE($2, password_hash),
          permissions = $3
        WHERE id = $4
        RETURNING id, username, permissions, created_at
        `,
        [username, password_hash ?? null, permissions, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Conta não encontrada' });
      }

      res.status(200).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao atualizar conta' });
    }
  }
);

module.exports = router;