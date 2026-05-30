/**
 * GoogleSheetsService - Capa Desacoplada de Integración para Registro de Solicitudes
 * Centraliza la comunicación con la hoja de cálculo de Google Sheets a través de Google Apps Script.
 * 
 * Permite cambiar fácilmente de backend en el futuro (ej. Supabase, PostgreSQL)
 * sin afectar la lógica de presentación del frontend.
 */

const GoogleSheetsService = {
  config: {
    // URL del Google Apps Script Web App (Reemplazar después de desplegar el Apps Script)
    // Documento: solicitudventassucursalvirtual2026 (ID: 186Yapa-_WEcEOjOyj5jlj-xF8k9-TskUJzThldQYINk)
    WEB_APP_URL: "https://script.google.com/macros/s/AKfycbwa-lJwrw4ZllzU55EFqz7ffCDQRFSM_9miwLfPOLDm6PQnPW4KkaEcTwsa7Ntz4F4J0A/exec",
    ENABLED: true
  },

  /**
   * Obtiene o genera un identificador único de sesión para trazabilidad y auditoría.
   * Se almacena en sessionStorage para persistir mientras la pestaña esté abierta.
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('capelli_session_id');
    if (!sessionId) {
      sessionId = 'sess-' + Date.now() + '-' + Math.floor(100000 + Math.random() * 900000);
      sessionStorage.setItem('capelli_session_id', sessionId);
    }
    return sessionId;
  },

  /**
   * Obtiene la dirección IP pública del cliente de forma asíncrona.
   * Utiliza api.ipify.org con un límite de tiempo de 2 segundos para evitar bloquear el checkout.
   */
  async getIPAddress() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 segundos máximo
      
      const response = await fetch('https://api.ipify.org?format=json', { 
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) return 'Desconocida';
      
      const data = await response.json();
      return data.ip || 'Desconocida';
    } catch (e) {
      console.warn("GoogleSheetsService: No se pudo obtener la IP pública del cliente (bloqueador de anuncios o timeout):", e);
      return 'Desconocida (Error o Bloqueado)';
    }
  },

  /**
   * Registra los datos de la orden/solicitud en Google Sheets.
   * Envía un POST al Web App del Apps Script.
   * 
   * @param {Object} orderData Estructura completa de datos de la solicitud comercial
   * @returns {Promise<Object>} Resultado devuelto por el servidor
   */
  async registerOrder(orderData) {
    if (!this.config.ENABLED) {
      console.info("GoogleSheetsService: La integración con Google Sheets se encuentra desactivada.");
      return { status: "disabled", message: "Servicio desactivado." };
    }

    // Si la URL aún no ha sido reemplazada por el usuario (sigue en estado por defecto)
    if (this.config.WEB_APP_URL.includes("XXXXXXXX")) {
      console.warn("GoogleSheetsService: La URL 'WEB_APP_URL' no ha sido configurada. Por favor, despliegue su Google Apps Script y reemplace la URL.");
      return { status: "unconfigured", message: "URL no configurada." };
    }

    try {
      // Nota: Enviamos como 'text/plain' para evitar preflight requests de CORS complejas.
      // Google Apps Script procesa igualmente la carga de postData.contents sin problemas.
      const response = await fetch(this.config.WEB_APP_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error(`Error en respuesta HTTP: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("GoogleSheetsService: Error crítico al intentar registrar en la planilla:", error);
      throw error; // Propagar error para que la UI tome la decisión de continuar o informar
    }
  },

  /**
   * Recupera todas las solicitudes registradas desde Google Sheets.
   * Realiza una petición GET al Web App.
   * 
   * @returns {Promise<Array>} Lista de solicitudes normalizadas
   */
  async getOrders() {
    if (!this.config.ENABLED) return [];
    if (this.config.WEB_APP_URL.includes("XXXXXXXX")) return [];

    try {
      const payload = {
        action: 'getOrders'
      };

      const response = await fetch(this.config.WEB_APP_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      if (result && result.status === 'success') {
        return result.data || [];
      }
      return [];
    } catch (error) {
      console.error("GoogleSheetsService: Error al recuperar datos de Google Sheets:", error);
      throw error;
    }
  },

  /**
   * Actualiza el estado de una orden en Google Sheets.
   * Realiza un POST con la acción 'updateState'.
   * 
   * @param {string} orderId ID único del pedido (ej. CC-XXXX-XXXX)
   * @param {string} newState Nuevo estado a guardar (ej. "Enviado", "Cancelado")
   * @returns {Promise<Object>} Resultado devuelto por el servidor
   */
  async updateOrderStatus(orderId, newState) {
    if (!this.config.ENABLED) return { status: 'disabled' };
    if (this.config.WEB_APP_URL.includes("XXXXXXXX")) return { status: 'unconfigured' };

    try {
      const payload = {
        action: 'updateState',
        orderId: orderId,
        newState: newState
      };

      const response = await fetch(this.config.WEB_APP_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("GoogleSheetsService: Error al intentar actualizar estado:", error);
      throw error;
    }
  }
};
