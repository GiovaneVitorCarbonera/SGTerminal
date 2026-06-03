const express = require('express');

const router = express.Router();
const db = require('../services/DBService.js');
const { secureRoute } = require('../middleware/auth');
const { requirePermission, PERMISSIONS } = require('../middleware/permissions');

router.post('/', secureRoute, requirePermission([PERMISSIONS.CREATE_VEHICLE_MOVEMENT]), async (req, res) => {
    const {idAccount, placa, datahora, tipo} = req.body;

    const sql = 'INSERT INTO veiculos (idAccount, placa, datahora, tipo) VALUES ($1, $2, $3, $4) RETURNING id;';

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

router.put('/:id', secureRoute, requirePermission([PERMISSIONS.EDIT_VEHICLE_MOVEMENT]), async (req, res) => {
    const {id} = req.params;
    const {idAccount, placa, datahora, tipo} = req.body;

    const sql = 'update veiculos set idAccount = $1, placa = $2, datahora = $3, tipo = $4 where id = $5';

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