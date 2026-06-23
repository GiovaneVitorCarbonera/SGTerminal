const express = require('express');
const router = express.Router();
const db = require('../services/DBService.js');
const { secureRoute } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../middleware/permissions');

/**
 * @openapi
 * /accounts:
 *   post:
 *     tags:
 *       - Accounts
 *     security:
 *       - bearerAuth: []
 *     description: Cria conta
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password_hash, permissions]
 *             properties:
 *               username:
 *                 type: string
 *               password_hash:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Criado
 */
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

/**
 * @openapi
 * /accounts:
 *   get:
 *     tags:
 *       - Accounts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista contas
 */
router.get(
  '/',
  secureRoute,
  requirePermission([PERMISSIONS.GET_ALL_USER]),
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

/**
 * @openapi
 * /accounts/{Id}:
 *   get:
 *     tags:
 *       - Accounts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: Id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista contas
 */
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

/**
 * @openapi
 * /accounts/{Id}:
 *   delete:
 *     tags:
 *       - Accounts
 *     summary: Remove uma conta
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: Id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Conta removida com sucesso
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Conta não encontrada
 *       500:
 *         description: Erro interno
 */
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

/**
 * @openapi
 * /accounts/{id}:
 *   put:
 *     tags:
 *       - Accounts
 *     summary: Atualiza uma conta
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID da conta
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - permissions
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password_hash:
 *                 type: string
 *                 nullable: true
 *                 example: novaSenhaHash
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - EDIT_USER
 *                   - VIEW_USER
 *     responses:
 *       200:
 *         description: Conta atualizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 username:
 *                   type: string
 *                   example: admin
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Dados inválidos ou ID inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Dados inválidos
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão para executar a ação
 *       404:
 *         description: Conta não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Conta não encontrada
 *       500:
 *         description: Erro interno ao atualizar conta
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Erro ao atualizar conta
 */
router.put(
  '/:id',
  secureRoute,
  requirePermission([PERMISSIONS.EDIT_USER]),
  async (req, res) => {
    const id = Number(req.params.id);
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