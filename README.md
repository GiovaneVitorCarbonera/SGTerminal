# SG Terminal

SQL Init

CREATE TYPE account_permission AS ENUM (
  'CREATE_USER',
  'GET_USERS',
  'GET_USER',
  'DELETE_USER',
  'EDIT_USER'
);

CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    permissions account_permission[] NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);