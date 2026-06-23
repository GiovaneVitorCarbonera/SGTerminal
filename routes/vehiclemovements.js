const express = require('express');

const router = express.Router();
const db = require('../services/DBService.js');
const { secureRoute } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../middleware/permissions');

/**
 * @openapi
 * /vehicle-movements:
 *   post:
 *     summary: Cria um novo registro de movimentação de veículo
 *     tags:
 *       - Vehicle-Movements
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idAccount
 *               - placa
 *               - datahora
 *               - tipo
 *             properties:
 *               idAccount:
 *                 type: integer
 *                 example: 1
 *               placa:
 *                 type: string
 *                 example: ABC1D23
 *               datahora:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-06-03T12:30:00Z
 *               tipo:
 *                 type: string
 *                 example: ENTRADA
 *     responses:
 *       201:
 *         description: Veículo cadastrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensagem:
 *                   type: string
 *                   example: Veiculo cadastrado
 *                 id:
 *                   type: integer
 *                   example: 10
 *       500:
 *         description: Erro no cadastro
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 erro:
 *                   type: string
 *                   example: Erro no cadastro
 */
router.post('/', secureRoute, requirePermission([PERMISSIONS.CREATE_VEHICLE_MOVEMENT]), async (req, res) => {
    const {idAccount, placa, datahora, tipo} = req.body;

    const sql = 'INSERT INTO veiculos (idaccount, placa, datahora, tipo) VALUES ($1, $2, $3, $4) RETURNING id;';

    try{
        const resultado = await db.query(sql, [idAccount, placa, datahora, tipo]);

        res.status(201).json({
            mensagem: 'Veiculo cadastrado', 
            id: resultado.rows[0].id
        }); 
    }catch(erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro no cadastro'
        });
    }
});

/**
 * @openapi
 * /vehicle-movements:
 *   get:
 *     tags:
 *       - Vehicle-Movements
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista movimentação de veículos
 *       500:
 *         description: Falha ao buscar
 */
router.get('/', secureRoute, requirePermission([PERMISSIONS.GET_ALL_VEHICLE_MOVEMENT]), async (req, res) => {
    const sql = 'select * from veiculos';

    try{
        const resultado = await db.query(sql);

        res.json(resultado.rows);
    }catch(erro){
        res.status(500).json({
            erro: 'Falha ao buscar'
        });
    }
});

/**
 * @openapi
 * /vehicle-movements/{id}:
 *   get:
 *     tags:
 *       - Vehicle-Movements
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Movimentação de veículo
 *       404:
 *         description: Veículo não encontrado
 *       500:
 *         description: Falha na busca do veículo
 */
router.get('/:id', secureRoute, requirePermission([PERMISSIONS.GET_VEHICLE_MOVEMENT]), async (req, res) => {
    const {id} = req.params;

    const sql = 'select * from veiculos where id = $1';

    try{
        const resultado = await db.query(sql, [id]);

        if(resultado.rows.length === 0){
            return res.status(404).json({
                erro: 'Carro não encontrado'
            });
        }

        res.json(resultado.rows[0]);

    }catch(erro){
        res.status(500).json({
            erro: 'Falha na busca do veiculo'
        });
    }
});

/**
 * @openapi
 * /vehicle-movements/{id}:
 *   delete:
 *     tags:
 *       - Vehicle-Movements
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Veículo deletado do sistema
 *       404:
 *         description: Veículo não encontrado
 *       500:
 *         description: Falha ao remover
 */
router.delete('/:id', secureRoute, requirePermission([PERMISSIONS.DELETE_VEHICLE_MOVEMENT]), async (req, res) => {
    const {id} = req.params;

    const sql = 'delete from veiculos where id = $1';

    try{
        const resultado = await db.query(sql, [id]);

        if(resultado.rowCount === 0){
            return res.status(404).json({
                erro: 'Veiculo não encontrado'
            });
        }

        res.json({
            mansagem: 'Veiculo deletado do sistema'
        });


    }catch(erro){
        res.status(500).json({
            erro: 'Falha ao remover'
        });
    }
});

/**
 * @openapi
 * /vehicle-movements/{id}:
 *   put:
 *     tags:
 *       - Vehicle-Movements
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idAccount:
 *                 type: integer
 *               placa:
 *                 type: string
 *               datahora:
 *                 type: string
 *               tipo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Veículo atualizado
 *       404:
 *         description: Veículo não encontrado
 *       500:
 *         description: Falha na atualização
 */
router.put('/:id', secureRoute, requirePermission([PERMISSIONS.EDIT_VEHICLE_MOVEMENT]), async (req, res) => {
    const {id} = req.params;
    const {idAccount, placa, datahora, tipo} = req.body;

    const sql = 'update veiculos set idaccount = $1, placa = $2, datahora = $3, tipo = $4 where id = $5';

    try{
        const resultado = await db.query(sql, [idAccount, placa, datahora, tipo, id]);

        if(resultado.rowCount === 0){
            return res.status(404).json({
                erro: 'Veiculo não encontrado'
            });
        }

        res.json({
            mensagem: 'Veiculo atualizado'
        });

    }catch(erro){
        res.status(500).json({
            erro: 'Falha na atualização'
        });
    }
});

module.exports = router;