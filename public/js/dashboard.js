document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificação de Segurança de Sessão JWT
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Exibe o nome do usuário logado na sidebar
    const loggedUser = localStorage.getItem('logged_username');
    if (loggedUser) {
        document.getElementById('user-display').textContent = loggedUser;
    }

    // Instanciação do modal do Bootstrap de forma programática
    const bootstrapCrudModal = new bootstrap.Modal(document.getElementById('crudModal'));

    // Estado operacional da Aplicação (SPA local)
    let currentTargetSection = 'dashboard-home';
    let currentEditingId = null; 

    // Configurações de Mapeamento Base Dinâmico para as seções
    const schemaMap = {
        'accounts-section': {
            title: 'Contas de Usuários',
            endpoint: '/accounts',
            headers: ['ID', 'Usuário', 'Permissões', 'Criado Em', 'Ações'],
            fields: [
                { name: 'username', label: 'Nome de Usuário', type: 'text', required: true },
                { name: 'password_hash', label: 'Senha (Hash / Texto Plano)', type: 'password', required: true },
                { name: 'permissions', label: 'Permissões (Separadas por vírgula)', type: 'text', placeholder: 'CREATE_USER, GET_USER', required: true }
            ]
        },
        'movements-section': {
            title: 'Movimentações de Veículos',
            endpoint: '/vehicle-movements',
            headers: ['ID', 'ID Conta', 'Placa', 'Data/Hora', 'Tipo', 'Ações'],
            fields: [
                { name: 'idAccount', label: 'ID da Conta Associada', type: 'number', required: true },
                { name: 'placa', label: 'Placa do Veículo', type: 'text', placeholder: 'ABC1D23', required: true },
                { name: 'datahora', label: 'Data e Horário', type: 'datetime-local', required: true },
                { name: 'tipo', label: 'Tipo de Movimento', type: 'select', options: ['ENTRADA', 'SAIDA'], required: true }
            ]
        }
    };

    // 2. Sistema de Roteamento Interno da Sidebar
    const menuLinks = document.querySelectorAll('#sidebar-menu .nav-link');
    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            menuLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const target = link.getAttribute('data-target');
            currentTargetSection = target;
            switchSection(target);
        });
    });

    function switchSection(target) {
        // Esconde todas as seções principais
        document.querySelectorAll('.content-view').forEach(s => s.classList.add('d-none'));

        if (target === 'dashboard-home') {
            document.getElementById('dashboard-home').classList.remove('d-none');
            loadDashboardHomeStats();
        } else {
            // Configura o painel dinâmico baseado no schemaMap (Accounts ou Movements)
            const config = schemaMap[target];
            document.getElementById('section-title').textContent = config.title;
            document.getElementById('btn-add-label').textContent = `Novo(a) ${target === 'accounts-section' ? 'Conta' : 'Movimentação'}`;
            
            // Renderiza cabeçalhos da tabela
            const thr = document.getElementById('table-headers');
            thr.innerHTML = config.headers.map(h => `<th>${h}</th>`).join('');

            document.getElementById('crud-section').classList.remove('d-none');
            fetchTableData(target);
        }
    }

    // Helper central para requisições fetch autenticadas com tratamento automático de expiração do JWT
    async function authorizedFetch(url, options = {}) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
        const response = await fetch(url, options);
        if (response.status === 401) {
            localStorage.clear();
            window.location.href = 'index.html';
            throw new Error('Sessão expirada. Faça login novamente.');
        }
        return response;
    }

    function showSystemAlert(message, type = 'success') {
        const ab = document.getElementById('dashboard-alert');
        ab.className = `alert alert-${type} alert-dismissible`;
        document.getElementById('alert-message').textContent = message;
        ab.classList.remove('d-none');
    }

    // 3. Inicialização de Contadores na Home
    async function loadDashboardHomeStats() {
        try {
            const resAcc = await authorizedFetch('/accounts');
            if (resAcc.ok) {
                const data = await resAcc.json();
                document.getElementById('count-accounts').textContent = data.length;
            }
            const resMov = await authorizedFetch('/vehicle-movements');
            if (resMov.ok) {
                const data = await resMov.json();
                document.getElementById('count-movements').textContent = data.length;
            }
        } catch (err) {
            console.error('Erro ao carregar contadores da home: ', err);
        }
    }

    // 4. Carregar e Renderizar Dados na Tabela Base Dinâmica
    async function fetchTableData(sectionKey) {
        const config = schemaMap[sectionKey];
        const tbody = document.getElementById('table-body');
        tbody.innerHTML = `<tr><td colspan="${config.headers.length}" class="text-center text-muted">Carregando dados...</td></tr>`;

        try {
            const response = await authorizedFetch(config.endpoint);
            if (!response.ok) throw new Error('Não foi possível obter os dados da API.');
            const list = await response.json();

            if (list.length === 0) {
                tbody.innerHTML = `<tr><td colspan="${config.headers.length}" class="text-center text-secondary">Nenhum registro encontrado.</td></tr>`;
                return;
            }

            tbody.innerHTML = '';
            list.forEach(row => {
                const tr = document.createElement('tr');
                let innerCells = '';

                if (sectionKey === 'accounts-section') {
                    const perms = Array.isArray(row.permissions) ? row.permissions.join(', ') : row.permissions;
                    const dateFormatted = new Date(row.created_at).toLocaleDateString('pt-BR');
                    innerCells = `
                        <td>${row.id}</td>
                        <td class="fw-medium">${row.username}</td>
                        <td><span class="badge bg-secondary-subtle text-secondary border border-secondary">${perms}</span></td>
                        <td>${dateFormatted}</td>
                    `;
                } else {
                    // Movimentações de Veículos
                    const badgeColor = row.tipo === 'ENTRADA' ? 'bg-success-subtle text-success border border-success' : 'bg-warning-subtle text-warning border border-warning';
                    const dateFormatted = new Date(row.datahora).toLocaleString('pt-BR');
                    innerCells = `
                        <td>${row.id}</td>
                        <td>${row.idaccount || row.idAccount || '-'}</td>
                        <td class="fw-bold text-info">${row.placa}</td>
                        <td>${dateFormatted}</td>
                        <td><span class="badge ${badgeColor}">${row.tipo}</span></td>
                    `;
                }

                // Injeção do menu de 3 Pontinhos (Dropdown de Ações) solicitado contendo Edit e Delete
                innerCells += `
                    <td class="text-end position-relative">
                        <div class="dropdown">
                            <button class="action-dropdown-btn" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end border-secondary-subtle shadow">
                                <li><a class="dropdown-item btn-action-edit" href="#" data-id="${row.id}"><i class="bi bi-pencil me-2 text-warning"></i>Edit</a></li>
                                <li><a class="dropdown-item btn-action-delete text-danger" href="#" data-id="${row.id}"><i class="bi bi-trash3 me-2"></i>Delete</a></li>
                            </ul>
                        </div>
                    </td>
                `;
                tr.innerHTML = innerCells;
                tbody.appendChild(tr);
            });

            // Adiciona escuta aos botões de ação injetados
            bindActionButtons(sectionKey);

        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="${config.headers.length}" class="text-center text-danger">${error.message}</td></tr>`;
        }
    }

    // 5. Vinculação Dinâmica de Ações (Editar / Deletar)
    function bindActionButtons(sectionKey) {
        const config = schemaMap[sectionKey];

        // Ação: Edit
        document.querySelectorAll('.btn-action-edit').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const id = btn.getAttribute('data-id');
                currentEditingId = id;
                
                try {
                    const response = await authorizedFetch(`${config.endpoint}/${id}`);
                    if (!response.ok) throw new Error('Não foi possível obter dados para edição.');
                    const itemData = await response.json();

                    openModalWithForm(sectionKey, 'Editar Registro', itemData);
                } catch (error) {
                    showSystemAlert(error.message, 'danger');
                }
            });
        });

        // Ação: Delete
        document.querySelectorAll('.btn-action-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const id = btn.getAttribute('data-id');
                if (confirm(`Deseja realmente remover o registro de ID #${id}?`)) {
                    try {
                        const response = await authorizedFetch(`${config.endpoint}/${id}`, { method: 'DELETE' });
                        const resData = await response.json();

                        if (!response.ok) throw new Error(resData.erro || 'Falha ao deletar o registro.');

                        showSystemAlert(resData.message || resData.mensagem || 'Registro excluído com sucesso!');
                        fetchTableData(sectionKey);
                    } catch (error) {
                        showSystemAlert(error.message, 'danger');
                    }
                }
            });
        });
    }

    // 6. Manipulação Dinâmica do Modal de Cadastro / Edição (Popup)
    document.getElementById('btn-trigger-add').addEventListener('click', () => {
        currentEditingId = null; // Modo Criação
        openModalWithForm(currentTargetSection, 'Adicionar Registro');
    });

    function openModalWithForm(sectionKey, title, existingData = null) {
        const config = schemaMap[sectionKey];
        document.getElementById('crudModalLabel').textContent = title;
        
        const formBody = document.getElementById('modal-form-body');
        formBody.innerHTML = '';

        config.fields.forEach(field => {
            const div = document.createElement('div');
            div.className = 'mb-3';

            const label = document.createElement('label');
            label.className = 'form-label small text-secondary';
            label.textContent = field.label;
            div.appendChild(label);

            let value = '';
            if (existingData) {
                // Mapeamentos de campos específicos do banco para exibição de valores nos campos de edição
                if (field.name === 'permissions' && Array.isArray(existingData.permissions)) {
                    value = existingData.permissions.join(', ');
                } else if (field.name === 'idAccount') {
                    value = existingData.idaccount || existingData.idAccount || '';
                } else if (field.name === 'datahora' && existingData.datahora) {
                    // Formata ISO para string aceita pelo input datetime-local (YYYY-MM-DDTHH:MM)
                    value = new Date(existingData.datahora).toISOString().substring(0, 16);
                } else {
                    value = existingData[field.name] || '';
                }
            }

            // Tratamento caso o tipo de campo mapeado seja um Select box
            if (field.type === 'select') {
                const select = document.createElement('select');
                select.className = 'form-select';
                select.id = `field-${field.name}`;
                select.required = field.required;
                
                field.options.forEach(opt => {
                    const o = document.createElement('option');
                    o.value = opt;
                    o.textContent = opt;
                    if (value === opt) o.selected = true;
                    select.appendChild(o);
                });
                div.appendChild(select);
            } else {
                // Inputs padrão de texto, número, senhas, datas
                const input = document.createElement('input');
                input.className = 'form-control';
                input.type = field.type;
                input.id = `field-${field.name}`;
                input.value = value;
                input.required = currentEditingId && field.type === 'password' ? false : field.required;
                if (field.placeholder) input.placeholder = field.placeholder;
                
                div.appendChild(input);
            }

            formBody.appendChild(div);
        });

        bootstrapCrudModal.show();
    }

    // 7. Envio do Formulário do Modal (POST / PUT Unificado)
    document.getElementById('modal-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const config = schemaMap[currentTargetSection];
        const payload = {};

        // Coleta os valores do formulário com base nos metadados do schema mapeado
        config.fields.forEach(field => {
            const el = document.getElementById(`field-${field.name}`);
            if (el) {
                if (field.name === 'permissions') {
                    payload[field.name] = el.value
                        .replace(/[{}]/g, '')
                        .split(',')
                        .map(p => p.trim())
                        .filter(Boolean);
                } else if (field.type === 'number') {
                    payload[field.name] = Number(el.value);
                } else {
                    payload[field.name] = el.value;
                }
            }
        });

        // Caso especial de rota para edição (Accounts usa Id capitalizado em seu parâmetro: /accounts/{Id})
        let url = config.endpoint;
        let method = 'POST';

        if (currentEditingId) {
            method = 'PUT';
            url = currentTargetSection === 'accounts-section' ? `${config.endpoint}/${currentEditingId}` : `${config.endpoint}/${currentEditingId}`;
        }

        try {
            const response = await authorizedFetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const resData = await response.json();
            if (!response.ok) throw new Error(resData.error || resData.erro || 'Falha ao processar requisição no servidor.');

            bootstrapCrudModal.hide();
            showSystemAlert(`Registro ${currentEditingId ? 'atualizado' : 'cadastrado'} com sucesso!`);
            fetchTableData(currentTargetSection);

        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    });

    // 8. Logout
    document.getElementById('btn-logout').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'index.html';
    });

    // Inicialização padrão da tela Home
    loadDashboardHomeStats();
});