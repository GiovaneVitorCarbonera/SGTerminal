CREATE TYPE account_permission AS ENUM (
  'CREATE_USER',
  'GET_ALL_USER',
  'GET_USER',
  'DELETE_USER',
  'EDIT_USER',
  'CREATE_VEHICLE_MOVEMENT',
  'GET_ALL_VEHICLE_MOVEMENT',
  'GET_VEHICLE_MOVEMENT',
  'DELETE_VEHICLE_MOVEMENT',
  'EDIT_VEHICLE_MOVEMENT'
);

CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    permissions account_permission[] NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS veiculos (
    id SERIAL PRIMARY KEY,
    placa VARCHAR(10) NOT NULL,
    datahora TIMESTAMP NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    idaccount int not null
);

-- Criar usuário administrador com todas as permissões
INSERT INTO accounts (username, password_hash, permissions)
VALUES (
  'admin',
  'admin',
  ARRAY[
    'CREATE_USER',
    'GET_ALL_USER',
    'GET_USER',
    'DELETE_USER',
    'EDIT_USER',
    'CREATE_VEHICLE_MOVEMENT',
    'GET_ALL_VEHICLE_MOVEMENT',
    'GET_VEHICLE_MOVEMENT',
    'DELETE_VEHICLE_MOVEMENT',
    'EDIT_VEHICLE_MOVEMENT'
  ]::account_permission[]
)
ON CONFLICT (username) DO NOTHING;