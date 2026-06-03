const express = require('express');

const router = express.Router();

router.post('/', async (req, res) => {
    const {id, placa, datahora, tipo} = req.body;

    const sql = 'INSERT INTO veiculos (id, placa, datahora, tipo) VALUES ($1, $2, $3, $4) RETURNING id;';

    try{
        const resultado = await pool.query(sql, [id, placa, datahora, tipo]);

        res.status(201).json({
            mensagem: 'Veiculo cadastrado', 
            idIserido: resultado.rows[0].id
        }); 
    }catch(erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro no cadastro'
        });
    }
});

router.get('/', async (req, res) => {
    const sql = 'select * from veiculos';

    try{
        const resultado = await pool.query(sql);

        res.json(resultado.rows);
    }catch(erro){
        res.status(500).json({
            erro: 'Falha ao buscar'
        });
    }
});

router.get('/:id', async (req, res) => {
    const {id} = req.params;

    const sql = 'select * from veiculos where id = $1';

    try{
        const resultado = await pool.query(sql, [id]);

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

router.delete('/:id', async (req, res) => {
    const {id} = req.params;

    const sql = 'delete from veiculos where id = $1';

    try{
        const resultado = await pool.query(sql, [id]);

        if(resultado.rowCout === 0){
            return res.status(404).json({
                erro: 'Veiculo não encontrado'
            });
        }

        res.json({
            mansagem: 'Veiculos deletado do sistema'
        });


    }catch(erro){
        res.status(500).json({
            erro: 'Falha ao remover'
        });
    }
});

router.put('/:id', async (req, res) => {
    const {id} = req.params;
    const {id, placa, datahora, tipo} = req.body;

    const sql = 'update veiculos set id = $1 placa = $2 datahora = $3 tipo = $4';

    try{
        const resultado = await pool.query(sql, [id, placa, datahora, tipo]);

        if(resultado.rowCout === 0){
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