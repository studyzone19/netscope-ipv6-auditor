const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch system health');
  return res.json();
}

export async function createAudit(url, options = {}) {
  const res = await fetch(`${API_BASE}/audits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, options }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to start audit');
  return data;
}

export async function listAudits(page = 1, limit = 20, status = '') {
  const params = new URLSearchParams({ page, limit });
  if (status) params.append('status', status);
  const res = await fetch(`${API_BASE}/audits?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch audits');
  return res.json();
}

export async function getAudit(id) {
  const res = await fetch(`${API_BASE}/audits/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch audit ${id}`);
  return res.json();
}

export async function getAuditResources(id, filters = {}) {
  const params = new URLSearchParams();
  if (filters.type) params.append('type', filters.type);
  if (filters.classification) params.append('classification', filters.classification);
  if (filters.isThirdParty !== undefined) params.append('isThirdParty', filters.isThirdParty);

  const res = await fetch(`${API_BASE}/audits/${id}/resources?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch audit resources');
  return res.json();
}

export async function getAuditGraph(id) {
  const res = await fetch(`${API_BASE}/audits/${id}/graph`);
  if (!res.ok) throw new Error('Failed to fetch audit graph');
  return res.json();
}

export async function getBenchmark() {
  const res = await fetch(`${API_BASE}/benchmark`);
  if (!res.ok) throw new Error('Failed to fetch benchmark');
  return res.json();
}

export async function runBenchmark(options = { concurrency: 2, maxSites: 30 }) {
  const res = await fetch(`${API_BASE}/benchmark/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to start benchmark');
  return data;
}

export async function cancelBenchmark() {
  const res = await fetch(`${API_BASE}/benchmark/cancel`, { method: 'POST' });
  return res.json();
}

export async function getLabManifest() {
  const res = await fetch(`${API_BASE}/lab/manifest`);
  if (!res.ok) throw new Error('Failed to fetch lab manifest');
  return res.json();
}

export async function validateLab() {
  const res = await fetch(`${API_BASE}/lab/validate`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to validate lab');
  return data;
}

export function getReportJsonUrl(id) {
  return `${API_BASE}/reports/${id}/json`;
}

export function getReportCsvUrl(id) {
  return `${API_BASE}/reports/${id}/csv`;
}

export async function analyzeUrl(url, referenceDomains = []) {
  const res = await fetch(`${API_BASE}/audits/analyze-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, referenceDomains }),
  });
  return res.json();
}

export async function getAuditFindings(id, filters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.severity) params.append('severity', filters.severity);
  if (filters.category) params.append('category', filters.category);
  if (filters.query) params.append('query', filters.query);

  const res = await fetch(`${API_BASE}/audits/${id}/findings?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch audit findings');
  return res.json();
}

export async function getAuditReport(id) {
  const res = await fetch(`${API_BASE}/audits/${id}/report`);
  if (!res.ok) throw new Error('Failed to fetch full audit report');
  return res.json();
}

export async function getAuditNotes(id) {
  const res = await fetch(`${API_BASE}/audits/${id}/notes`);
  if (!res.ok) throw new Error('Failed to fetch easy notes');
  return res.json();
}

