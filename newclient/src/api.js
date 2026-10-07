import { fetchAuthSession } from 'aws-amplify/auth';

const BASE_URL = import.meta.env.VITE_API_URL;

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const { tokens } = await fetchAuthSession();
    if (!tokens) throw new Error('Not signed in');
    headers.Authorization = `Bearer ${tokens.idToken.toString()}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// Auth
export const registerUser = (data) =>
  request('/auth/register', { method: 'POST', body: data, auth: false });
export const getMe = () => request('/me');

// Products
export const getProducts = () => request('/products');
export const getMyProducts = () => request('/products/mine');
export const createProduct = (p) => request('/products', { method: 'POST', body: p });
export const updateProduct = (id, p) => request(`/products/${id}`, { method: 'PUT', body: p });
export const deleteProduct = (id) => request(`/products/${id}`, { method: 'DELETE' });

// Orders
export const createOrder = (o) => request('/orders', { method: 'POST', body: o });
export const getMyOrders = () => request('/orders/mine');
export const getAvailableOrders = () => request('/orders/available');
export const updateOrder = (id, fields) =>
  request(`/orders/${id}`, { method: 'PATCH', body: fields });
export const acceptOrder = (id) => request(`/orders/${id}/accept`, { method: 'POST' });

// Admin
export const adminGetUsers = () => request('/admin/users');
export const adminGetOrders = () => request('/admin/orders');
export const adminGetProducts = () => request('/admin/products');
export const adminSetBan = (id, is_banned) =>
  request(`/admin/users/${id}`, { method: 'PATCH', body: { is_banned } });
export const adminDeleteUser = (id) => request(`/admin/users/${id}`, { method: 'DELETE' });