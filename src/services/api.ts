const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // Use relative URLs in production
  : 'http://localhost:3001';

export interface Order {
  orderId: string;
  fullName: string;
  phoneNumber: string;
  printType: string;
  bindingColorType?: string;
  copies?: number;
  paperSize?: string;
  printSide?: string;
  selectedPages?: string;
  colorPages?: string;
  bwPages?: string;
  specialInstructions?: string;
  files: Array<{
    name: string;
    size: number;
    type: string;
    path: string;
  }>;
  orderDate: string;
  status: string;
  totalCost: number;
}

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  path: string;
  serverPath?: string;
}

class ApiService {
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}/api${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Upload files
  async uploadFiles(files: File[]): Promise<UploadedFile[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    const result = await response.json();
    return result.files;
  }

  // Create order
  async createOrder(orderData: Omit<Order, 'orderId' | 'orderDate' | 'status'>): Promise<{ orderId: string; order: Order }> {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  // Get all orders
  async getAllOrders(): Promise<Order[]> {
    return this.request('/orders');
  }

  // Get order by ID
  async getOrderById(orderId: string): Promise<Order> {
    return this.request(`/orders/${orderId}`);
  }

  // Update order status
  async updateOrderStatus(orderId: string, status: string): Promise<{ success: boolean; order: Order }> {
    return this.request(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Admin login
  async adminLogin(username: string, password: string): Promise<{ success: boolean; token: string }> {
    return this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  // Download file
  getFileDownloadUrl(filename: string): string {
    return `${API_BASE_URL}/api/files/${filename}`;
  }

  // Clear all orders
  async clearAllOrders(): Promise<{ success: boolean }> {
    return this.request('/orders', {
      method: 'DELETE',
    });
  }

  // Clear all files
  async clearAllFiles(): Promise<{ success: boolean }> {
    return this.request('/files', {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();