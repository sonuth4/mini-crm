const STATUSES = ['New', 'Contacted', 'Converted'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const $ = (selector) => document.querySelector(selector);
const el = {
  statTotal: $('#statTotal'), statNew: $('#statNew'), statConverted: $('#statConverted'),
  banner: $('#banner'), toast: $('#toast'),
  search: $('#search'), statusFilter: $('#statusFilter'),
  message: $('#message'), messageAction: $('#messageAction'),
  table: $('#table'), rows: $('#rows'),
  dialog: $('#dialog'), dialogTitle: $('#dialogTitle'), form: $('#form'),
  formError: $('#formError'), saveBtn: $('#saveBtn'),
};
const FIELDS = ['name', 'email', 'phone', 'business', 'status'];

let editingId = null;   
let requestCount = 0;   
let searchTimer;

async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error('Can’t reach the server. Check your connection and try again.');
  }
  if (response.status === 204) return null;

  let data = null;
  try { data = await response.json(); } catch { /* not JSON */ }

  if (!response.ok) {
    const error = new Error(data?.error || 'Something went wrong. Please try again.');
    error.fields = data?.fields;
    throw error;
  }
  return data;
}


function showBanner(text) { el.banner.textContent = text; el.banner.hidden = false; }
function hideBanner() { el.banner.hidden = true; }

let toastTimer;
function showToast(text) {
  el.toast.textContent = text;
  el.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.toast.hidden = true; }, 2800);
}

function setMessage(text, actionLabel, onAction) {
  el.message.textContent = text;
  el.message.hidden = !text;
  el.messageAction.replaceChildren();
  el.messageAction.hidden = !actionLabel;
  if (actionLabel) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn';
    button.textContent = actionLabel;
    button.addEventListener('click', onAction);
    el.messageAction.append(button);
  }
}

function makeButton(label, className, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `btn small ${className}`.trim();
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}

function filtersActive() {
  return el.search.value.trim() !== '' || el.statusFilter.value !== '';
}

async function loadData({ quiet = false } = {}) {
  const thisRequest = ++requestCount;
  if (!quiet) {
    el.table.hidden = true;
    setMessage('Loading leads…');
  }
  hideBanner();

  const params = new URLSearchParams({
    search: el.search.value.trim(),
    status: el.statusFilter.value,
  });

  try {
    const [leads, stats] = await Promise.all([api(`/api/leads?${params}`), api('/api/stats')]);
    if (thisRequest !== requestCount) return; // a newer request replaced this one
    drawStats(stats);
    drawLeads(leads);
  } catch (error) {
    if (thisRequest !== requestCount) return;
    el.table.hidden = true;
    setMessage('We couldn’t load your leads.', 'Try again', () => loadData());
    showBanner(error.message);
  }
}

function drawStats(stats) {
  el.statTotal.textContent = stats.total;
  el.statNew.textContent = stats.new;
  el.statConverted.textContent = stats.converted;
}

function drawLeads(leads) {
  el.rows.replaceChildren();

  if (leads.length === 0) {
    el.table.hidden = true;
    if (filtersActive()) {
      setMessage('No leads match your search.', 'Clear search and filter', () => {
        el.search.value = '';
        el.statusFilter.value = '';
        loadData();
      });
    } else {
      setMessage('No leads yet. Add your first lead to start tracking enquiries.', 'Add lead', () => openDialog());
    }
    return;
  }

  setMessage('');
  el.table.hidden = false;
  leads.forEach((lead) => el.rows.append(buildRow(lead)));
}

function cell(label, ...children) {
  const td = document.createElement('td');
  td.dataset.label = label;
  td.append(...children);
  return td;
}

function textNode(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.textContent = text; 
  return node;
}


function initials(name) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function leadCell(name) {
  let hue = 0;
  for (const char of name) hue = (hue * 31 + char.charCodeAt(0)) % 360;
  const avatar = textNode('span', 'avatar', initials(name));
  avatar.style.background = `hsl(${hue} 55% 90%)`;
  avatar.style.color = `hsl(${hue} 50% 24%)`;
  avatar.setAttribute('aria-hidden', 'true');
  const wrap = document.createElement('div');
  wrap.className = 'lead-cell';
  wrap.append(avatar, textNode('span', 'lead-name', name));
  return wrap;
}

function buildRow(lead) {
  const tr = document.createElement('tr');

  const select = document.createElement('select');
  select.className = `status-select ${lead.status}`;
  select.setAttribute('aria-label', `Status for ${lead.name}`);
  STATUSES.forEach((status) => {
    const option = new Option(status, status, false, status === lead.status);
    select.append(option);
  });
  select.addEventListener('change', () => changeStatus(lead, select));

  const actions = document.createElement('td');
  actions.className = 'row-actions';
  actions.append(
    makeButton('Edit', '', () => openDialog(lead)),
    makeButton('Delete', 'danger', () => removeLead(lead)),
  );

  tr.append(
    cell('Lead', leadCell(lead.name)),
    cell('Business', document.createTextNode(lead.business)),
    cell('Contact', textNode('div', '', lead.email), textNode('div', 'muted', lead.phone)),
    cell('Status', select),
    actions,
  );
  return tr;
}

async function changeStatus(lead, select) {
  select.disabled = true;
  try {
    await api(`/api/leads/${lead.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: select.value }) });
    showToast(`${lead.name} is now ${select.value}.`);
  } catch (error) {
    showBanner(error.message);
  }
  loadData({ quiet: true }); 
}

async function removeLead(lead) {
  if (!confirm(`Delete ${lead.name}? This can’t be undone.`)) return;
  try {
    await api(`/api/leads/${lead.id}`, { method: 'DELETE' });
    showToast('Lead deleted.');
  } catch (error) {
    showBanner(error.message);
  }
  loadData({ quiet: true });
}

function clearErrors() {
  FIELDS.forEach((field) => {
    $(`#error-${field}`).textContent = '';
    el.form.elements[field].removeAttribute('aria-invalid');
  });
  el.formError.textContent = '';
}

function showFieldErrors(errors) {
  let firstInvalid = null;
  FIELDS.forEach((field) => {
    if (!errors[field]) return;
    $(`#error-${field}`).textContent = errors[field];
    el.form.elements[field].setAttribute('aria-invalid', 'true');
    firstInvalid ??= el.form.elements[field];
  });
  firstInvalid?.focus();
}

function validate(values) {
  const errors = {};
  if (!values.name) errors.name = 'Enter the lead’s name.';
  if (!EMAIL_RE.test(values.email)) errors.email = 'Enter a valid email, like name@example.com.';
  const digits = values.phone.replace(/\D/g, '');
  if (!/^[+\d\s\-()]+$/.test(values.phone) || digits.length < 7 || digits.length > 15) {
    errors.phone = 'Enter a phone number with 7 to 15 digits.';
  }
  if (!values.business) errors.business = 'Enter the business name.';
  if (!STATUSES.includes(values.status)) errors.status = 'Choose New, Contacted or Converted.';
  return errors;
}

function openDialog(lead = null) {
  editingId = lead ? lead.id : null;
  el.dialogTitle.textContent = lead ? 'Edit lead' : 'Add lead';
  clearErrors();
  FIELDS.forEach((field) => { el.form.elements[field].value = lead ? lead[field] : (field === 'status' ? 'New' : ''); });
  el.dialog.showModal();
  el.form.elements.name.focus();
}

el.form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearErrors();

  const values = Object.fromEntries(FIELDS.map((field) => [field, el.form.elements[field].value.trim()]));
  const errors = validate(values);
  if (Object.keys(errors).length) return showFieldErrors(errors);

  el.saveBtn.disabled = true;
  el.saveBtn.textContent = 'Saving…';
  try {
    const wasEditing = editingId !== null;
    await api(wasEditing ? `/api/leads/${editingId}` : '/api/leads', {
      method: wasEditing ? 'PUT' : 'POST',
      body: JSON.stringify(values),
    });
    el.dialog.close();
    showToast(wasEditing ? 'Changes saved.' : 'Lead added.');
    loadData({ quiet: true });
  } catch (error) {
    if (error.fields) showFieldErrors(error.fields);
    else el.formError.textContent = error.message;
  } finally {
    el.saveBtn.disabled = false;
    el.saveBtn.textContent = 'Save lead';
  }
});

$('#cancelBtn').addEventListener('click', () => el.dialog.close());
$('#addBtn').addEventListener('click', () => openDialog());

// ---------- Search and filter ----------
el.search.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadData({ quiet: true }), 250); // wait until typing pauses
});
el.statusFilter.addEventListener('change', () => loadData({ quiet: true }));

loadData();