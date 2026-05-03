/**
 * CollectioClient
 * Cliente para conectar tu React app con la API de Collectio
 * 
 * Uso:
 * const client = new CollectioClient('user-id', 'user@email.com');
 * const items = await client.getItems();
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export class CollectioClient {
  constructor(userId, userEmail) {
    this.userId = userId;
    this.userEmail = userEmail;
  }

  // Helper para headers
  headers() {
    return {
      'Content-Type': 'application/json',
      'x-user-id': this.userId,
      'x-user-email': this.userEmail
    };
  }

  // Helper para manejo de errores
  async handleResponse(res) {
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  // ========================
  // ITEMS (COLECCIÓN)
  // ========================

  /**
   * Obtener todos los items del usuario
   */
  async getItems() {
    const res = await fetch(`${API_URL}/items`, { 
      method: 'GET',
      headers: this.headers() 
    });
    return this.handleResponse(res);
  }

  /**
   * Obtener items filtrados por categoría
   * @param {string} category - 'pines', 'tazas', 'libros', etc.
   */
  async getItemsByCategory(category) {
    const res = await fetch(`${API_URL}/items/category/${category}`, { 
      method: 'GET',
      headers: this.headers() 
    });
    return this.handleResponse(res);
  }

  /**
   * Agregar nuevo item a la colección
   * @param {object} item - { name, category, price_usd, artist_name, image_url, ... }
   */
  async addItem(item) {
    const res = await fetch(`${API_URL}/items`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(item)
    });
    return this.handleResponse(res);
  }

  /**
   * Actualizar item existente
   * @param {string} id - ID del item
   * @param {object} updates - campos a actualizar
   */
  async updateItem(id, updates) {
    const res = await fetch(`${API_URL}/items/${id}`, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify(updates)
    });
    return this.handleResponse(res);
  }

  /**
   * Eliminar item
   * @param {string} id - ID del item
   */
  async deleteItem(id) {
    const res = await fetch(`${API_URL}/items/${id}`, {
      method: 'DELETE',
      headers: this.headers()
    });
    return this.handleResponse(res);
  }

  // ========================
  // WISHLIST
  // ========================

  /**
   * Obtener wishlist completa
   */
  async getWishlist() {
    const res = await fetch(`${API_URL}/wishlist`, { 
      method: 'GET',
      headers: this.headers() 
    });
    return this.handleResponse(res);
  }

  /**
   * Obtener wishlist con alertas de deadline
   * Retorna { urgent, soon, ok }
   */
  async getWishlistAlerts() {
    const res = await fetch(`${API_URL}/wishlist/alerts`, { 
      method: 'GET',
      headers: this.headers() 
    });
    return this.handleResponse(res);
  }

  /**
   * Agregar item a wishlist
   * @param {object} item - { name, category, price_usd, deadline_date, ... }
   */
  async addToWishlist(item) {
    const res = await fetch(`${API_URL}/wishlist`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(item)
    });
    return this.handleResponse(res);
  }

  /**
   * Marcar item como comprado
   * @param {string} wishlistId - ID del item en wishlist
   */
  async markAsPurchased(wishlistId) {
    const res = await fetch(`${API_URL}/wishlist/${wishlistId}/purchase`, {
      method: 'PUT',
      headers: this.headers()
    });
    return this.handleResponse(res);
  }

  /**
   * Eliminar de wishlist
   * @param {string} wishlistId - ID del item en wishlist
   */
  async removeFromWishlist(wishlistId) {
    const res = await fetch(`${API_URL}/wishlist/${wishlistId}`, {
      method: 'DELETE',
      headers: this.headers()
    });
    return this.handleResponse(res);
  }

  // ========================
  // GASTOS
  // ========================

  /**
   * Obtener resumen de gastos este mes
   * Retorna { total, byCategory }
   */
  async getExpensesSummary() {
    const res = await fetch(`${API_URL}/expenses/summary`, { 
      method: 'GET',
      headers: this.headers() 
    });
    return this.handleResponse(res);
  }

  /**
   * Obtener gastos en rango de fechas
   * @param {string} startDate - '2024-01-01'
   * @param {string} endDate - '2024-01-31'
   */
  async getExpenses(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const res = await fetch(`${API_URL}/expenses?${params}`, { 
      method: 'GET',
      headers: this.headers() 
    });
    return this.handleResponse(res);
  }

  /**
   * Registrar nuevo gasto
   * @param {object} expense - { amount_usd, category, purchase_date, item_id }
   */
  async addExpense(expense) {
    const res = await fetch(`${API_URL}/expenses`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(expense)
    });
    return this.handleResponse(res);
  }

  // ========================
  // USUARIOS
  // ========================

  /**
   * Obtener perfil del usuario
   */
  async getProfile() {
    const res = await fetch(`${API_URL}/users/profile`, { 
      method: 'GET',
      headers: this.headers() 
    });
    return this.handleResponse(res);
  }

  /**
   * Actualizar perfil del usuario
   * @param {object} profile - { dragon_name, budget_monthly, theme_bg, currency_primary }
   */
  async updateProfile(profile) {
    const res = await fetch(`${API_URL}/users/profile`, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify(profile)
    });
    return this.handleResponse(res);
  }

  // ========================
  // ARTISTAS FAVORITOS
  // ========================

  /**
   * Obtener artistas favoritos
   */
  async getArtists() {
    const res = await fetch(`${API_URL}/artists`, { 
      method: 'GET',
      headers: this.headers() 
    });
    return this.handleResponse(res);
  }

  /**
   * Agregar artista a favoritos
   * @param {object} artist - { artist_name, instagram_handle, website_url, country }
   */
  async addArtist(artist) {
    const res = await fetch(`${API_URL}/artists`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(artist)
    });
    return this.handleResponse(res);
  }

  // ========================
  // ESTADÍSTICAS
  // ========================

  /**
   * Obtener estadísticas generales
   * Retorna { total_items, categories, total_spent, wishlist_count, ... }
   */
  async getStats() {
    const res = await fetch(`${API_URL}/stats`, { 
      method: 'GET',
      headers: this.headers() 
    });
    return this.handleResponse(res);
  }

  // ========================
  // UTILIDADES
  // ========================

  /**
   * Convertir precio entre monedas (aproximado)
   * En producción, esto vendría del backend con tasas reales
   */
  convertCurrency(amountUSD, targetCurrency) {
    const rates = {
      'USD': 1,
      'PEN': 3.70,    // Soles peruanos (aproximado)
      'EUR': 0.92,    // Euros
      'CHF': 0.88,    // Francos suizos
      'JPY': 149,     // Yenes japoneses
      'KRW': 1300,    // Wones coreanos
      'GBP': 0.79,    // Libras
      'CAD': 1.36     // Dólares canadienses
    };

    const rate = rates[targetCurrency] || rates['USD'];
    return Math.round((amountUSD * rate) * 100) / 100;
  }

  /**
   * Formatear precio con símbolo de moneda
   */
  formatPrice(amount, currency = 'USD') {
    const symbols = {
      'USD': '$',
      'PEN': 'S/',
      'EUR': '€',
      'CHF': 'CHF',
      'JPY': '¥',
      'KRW': '₩',
      'GBP': '£',
      'CAD': 'C$'
    };

    const symbol = symbols[currency] || currency;
    return `${symbol} ${amount.toFixed(2)}`;
  }
}

// Exportar también como default para compatibilidad
export default CollectioClient;
