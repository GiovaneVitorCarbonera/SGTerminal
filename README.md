# SG Terminal

SQL Init

```
CREATE TYPE account_permission AS ENUM (
  'CREATE_USER',
  'GET_USERS',
  'GET_USER',
  'DELETE_USER',
  'EDIT_USER',
  'CREATE_VEHICLE_MOVEMENT',
  'GET_ALL_VEHICLE_MOVEMENT',
  'GET_VEHICLE_MOVEMENT',
  'DELETE_VEHICLE_MOVEMENT',
  'EDIT_VEHICLE_MOVEMENT'
);

CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    permissions account_permission[] NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE veiculos (
    id SERIAL PRIMARY KEY,
    placa VARCHAR(10) NOT NULL,
    datahora TIMESTAMP NOT NULL,
    tipo VARCHAR(50) NOT NULL,
	  idaccount int not null
);
```

DER IMAGE
<img width="1202" height="181" alt="SG Terminal DER" src="https://github.com/user-attachments/assets/b5a5c4de-206b-400b-8a31-015958789620" />
