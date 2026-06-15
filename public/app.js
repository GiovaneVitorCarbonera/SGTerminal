const tokenKey = 'sgterminal_token';
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const logoutButton = document.getElementById('logout-button');
const navAccounts = document.getElementById('nav-accounts');
const navMovements = document.getElementById('nav-movements');
const content = document.getElementById('content');
let token = localStorage.getItem(tokenKey);

const permissionOptions = [
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
];

function showLogin() {
  loginSection.hidden = false;
  dashboardSection.hidden = true;
  loginMessage.textContent = '';
}

function showDashboard() {
  loginSection.hidden = true;
  dashboardSection.hidden = false;
  renderAccounts();
}

function setToken(newToken) {
  token = newToken;
  if (token) {
    localStorage.setItem(tokenKey, token);
  } else {
    localStorage.removeItem(tokenKey);
  }
}

async function api(path, options = {}) {
  const headers = options.headers || {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = { status: response.status, data };
    throw error;
  }
  return data;
}

function handleAuthError(error) {
  if (error?.status === 401 || error?.status === 403) {
    setToken(null);
    showLogin();
    loginMessage.textContent = 'Sessão expirada ou credenciais inválidas. Faça login novamente.';
  }
}

function createMessage(text, type = 'error') {
  return `<div class="message ${type === 'success' ? 'success' : ''}">${text}</div>`;
}

function buildPermissionInputs() {
  return permissionOptions
    .map(
      permission => `
        <label class="checkbox-label">
          <input type="checkbox" value="${permission}" />
          ${permission}
        </label>
      `
    )
    .join('');
}

function getSelectedPermissions(form) {
  const inputs = Array.from(form.querySelectorAll('input[type=checkbox]'));
  return inputs.filter(input => input.checked).map(input => input.value);
}

function formatDate(dateString) {
  try {
    return new Date(dateString).toLocaleString('pt-BR');
  } catch {
    return dateString;
  }
}

function renderAccounts() {
  content.innerHTML = `
    <article class="card">
      <h2>Contas</h2>
      <div id="accounts-message"></div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr><th>ID</th><th>Usuário</th><th>Permissões</th><th>Criado em</th><th>Ações</th></tr>
          </thead>
          <tbody id="accounts-list"><tr><td colspan="5">Carregando...</td></tr></tbody>
        </table>
      </div>
    </article>
    <article class="card">
      <h3>Criar nova conta</h3>
      <form id="create-account-form">
        <label>
          Nome de usuário
          <input name="username" required />
        </label>
        <label>
          Senha
          <input name="password" type="password" required />
        </label>
        <div>
          <strong>Permissões</strong>
          <div class="permissions-grid">${buildPermissionInputs()}</div>
        </div>
        <button type="submit">Criar conta</button>
      </form>
    </article>
  `;

  const accountsList = document.getElementById('accounts-list');
  const createForm = document.getElementById('create-account-form');
  const accountsMessage = document.getElementById('accounts-message');

  async function loadAccounts() {
    try {
      const accounts = await api('/accounts', { method: 'GET' });
      if (!Array.isArray(accounts) || accounts.length === 0) {
        accountsList.innerHTML = '<tr><td colspan="5">Nenhuma conta encontrada.</td></tr>';
        return;
      }

      accountsList.innerHTML = accounts
        .map(
          account => `
            <tr>
              <td>${account.id}</td>
              <td>${account.username}</td>
              <td>${Array.isArray(account.permissions) ? account.permissions.join(', ') : account.permissions}</td>
              <td>${formatDate(account.created_at)}</td>
              <td><button type="button" data-id="${account.id}" class="danger">Excluir</button></td>
            </tr>
          `
        )
        .join('');

      Array.from(accountsList.querySelectorAll('button[data-id]')).forEach(button => {
        button.addEventListener('click', async () => {
          const accountId = button.dataset.id;
          if (!confirm('Deseja realmente excluir esta conta?')) {
            return;
          }

          try {
            await api(`/accounts/${accountId}`, { method: 'DELETE' });
            accountsMessage.innerHTML = createMessage('Conta removida com sucesso.', 'success');
            loadAccounts();
          } catch (error) {
            accountsMessage.innerHTML = createMessage(error.data?.error || 'Não foi possível remover a conta.');
            handleAuthError(error);
          }
        });
      });
    } catch (error) {
      accountsList.innerHTML = '<tr><td colspan="5">Falha ao carregar contas.</td></tr>';
      accountsMessage.innerHTML = createMessage(error.data?.error || 'Erro ao carregar contas.');
      handleAuthError(error);
    }
  }

  createForm.addEventListener('submit', async event => {
    event.preventDefault();
    const formData = new FormData(createForm);
    const username = formData.get('username').trim();
    const password = formData.get('password').trim();
    const permissions = getSelectedPermissions(createForm);

    if (!username || !password) {
      accountsMessage.innerHTML = createMessage('Usuário e senha são obrigatórios.');
      return;
    }

    if (permissions.length === 0) {
      accountsMessage.innerHTML = createMessage('Selecione pelo menos uma permissão.');
      return;
    }

    try {
      await api('/accounts', {
        method: 'POST',
        body: JSON.stringify({ username, password_hash: password, permissions }),
      });
      accountsMessage.innerHTML = createMessage('Conta criada com sucesso.', 'success');
      createForm.reset();
      loadAccounts();
    } catch (error) {
      accountsMessage.innerHTML = createMessage(error.data?.error || 'Falha ao criar conta.');
      handleAuthError(error);
    }
  });

  loadAccounts();
}

function renderMovements() {
  content.innerHTML = `
    <article class="card">
      <h2>Movimentações</h2>
      <div id="movements-message"></div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr><th>ID</th><th>ID Conta</th><th>Placa</th><th>Data/Hora</th><th>Tipo</th><th>Ações</th></tr>
          </thead>
          <tbody id="movements-list"><tr><td colspan="6">Carregando...</td></tr></tbody>
        </table>
      </div>
    </article>
    <article class="card">
      <h3>Registrar movimentação</h3>
      <form id="create-movement-form">
        <label>
          ID da conta
          <input name="idAccount" type="number" min="1" required />
        </label>
        <label>
          Placa
          <input name="placa" required />
        </label>
        <label>
          Data e hora
          <input name="datahora" type="datetime-local" required />
        </label>
        <label>
          Tipo
          <input name="tipo" required />
        </label>
        <button type="submit">Registrar movimentação</button>
      </form>
    </article>
  `;

  const movementsList = document.getElementById('movements-list');
  const createForm = document.getElementById('create-movement-form');
  const movementsMessage = document.getElementById('movements-message');

  async function loadMovements() {
    try {
      const movements = await api('/vehicle-movements', { method: 'GET' });
      if (!Array.isArray(movements) || movements.length === 0) {
        movementsList.innerHTML = '<tr><td colspan="6">Nenhuma movimentação encontrada.</td></tr>';
        return;
      }

      movementsList.innerHTML = movements
        .map(
          movement => `
            <tr>
              <td>${movement.id}</td>
              <td>${movement.idaccount ?? movement.idAccount ?? ''}</td>
              <td>${movement.placa}</td>
              <td>${formatDate(movement.datahora)}</td>
              <td>${movement.tipo}</td>
              <td><button type="button" data-id="${movement.id}" class="danger">Excluir</button></td>
            </tr>
          `
        )
        .join('');

      Array.from(movementsList.querySelectorAll('button[data-id]')).forEach(button => {
        button.addEventListener('click', async () => {
          const id = button.dataset.id;
          if (!confirm('Deseja realmente excluir esta movimentação?')) {
            return;
          }

          try {
            await api(`/vehicle-movements/${id}`, { method: 'DELETE' });
            movementsMessage.innerHTML = createMessage('Movimentação removida com sucesso.', 'success');
            loadMovements();
          } catch (error) {
            movementsMessage.innerHTML = createMessage(error.data?.erro || 'Não foi possível remover a movimentação.');
            handleAuthError(error);
          }
        });
      });
    } catch (error) {
      movementsList.innerHTML = '<tr><td colspan="6">Falha ao carregar movimentações.</td></tr>';
      movementsMessage.innerHTML = createMessage(error.data?.erro || 'Erro ao carregar movimentações.');
      handleAuthError(error);
    }
  }

  createForm.addEventListener('submit', async event => {
    event.preventDefault();
    const formData = new FormData(createForm);
    const idAccount = Number(formData.get('idAccount'));
    const placa = formData.get('placa').trim();
    const datahoraRaw = formData.get('datahora');
    const tipo = formData.get('tipo').trim();

    if (!idAccount || !placa || !datahoraRaw || !tipo) {
      movementsMessage.innerHTML = createMessage('Todos os campos são obrigatórios.');
      return;
    }

    const datahora = new Date(datahoraRaw).toISOString();

    try {
      await api('/vehicle-movements', {
        method: 'POST',
        body: JSON.stringify({ idAccount, placa, datahora, tipo }),
      });
      movementsMessage.innerHTML = createMessage('Movimentação criada com sucesso.', 'success');
      createForm.reset();
      loadMovements();
    } catch (error) {
      movementsMessage.innerHTML = createMessage(error.data?.erro || 'Falha ao criar movimentação.');
      handleAuthError(error);
    }
  });

  loadMovements();
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  loginMessage.textContent = '';
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    loginMessage.textContent = 'Informe usuário e senha.';
    return;
  }

  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usuario: username, senha: password }),
    });
    setToken(data.token);
    showDashboard();
  } catch (error) {
    loginMessage.textContent = error.data?.erro || 'Falha ao fazer login.';
  }
});

logoutButton.addEventListener('click', () => {
  setToken(null);
  showLogin();
});

navAccounts.addEventListener('click', renderAccounts);
navMovements.addEventListener('click', renderMovements);

if (token) {
  showDashboard();
} else {
  showLogin();
}
