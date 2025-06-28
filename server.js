const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('dist'));
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Create data directory for JSON storage if it doesn't exist
if (!fs.existsSync('data')) {
  fs.mkdirSync('data');
}

// Initialize data files
const ordersFile = 'data/orders.json';
const adminFile = 'data/admin.json';

if (!fs.existsSync(ordersFile)) {
  fs.writeFileSync(ordersFile, JSON.stringify([]));
}

if (!fs.existsSync(adminFile)) {
  fs.writeFileSync(adminFile, JSON.stringify({
    username: 'admin',
    password: 'xerox123'
  }));
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Helper functions
function readOrders() {
  try {
    const data = fs.readFileSync(ordersFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading orders:', error);
    return [];
  }
}

function writeOrders(orders) {
  try {
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing orders:', error);
    return false;
  }
}

function readAdmin() {
  try {
    const data = fs.readFileSync(adminFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading admin data:', error);
    return { username: 'admin', password: 'xerox123' };
  }
}

// API Routes

// Upload files
app.post('/api/upload', upload.array('files'), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = req.files.map(file => ({
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
      path: `/uploads/${file.filename}`,
      serverPath: file.path
    }));

    res.json({ files: uploadedFiles });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Create order
app.post('/api/orders', (req, res) => {
  try {
    const orderData = req.body;
    const orderId = `ORD-${Date.now()}`;
    
    const order = {
      ...orderData,
      orderId,
      orderDate: new Date().toISOString(),
      status: 'pending'
    };

    const orders = readOrders();
    orders.push(order);
    
    if (writeOrders(orders)) {
      res.json({ orderId, order });
    } else {
      res.status(500).json({ error: 'Failed to save order' });
    }
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get all orders
app.get('/api/orders', (req, res) => {
  try {
    const orders = readOrders();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order by ID
app.get('/api/orders/:orderId', (req, res) => {
  try {
    const orders = readOrders();
    const order = orders.find(o => o.orderId === req.params.orderId);
    
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status
app.put('/api/orders/:orderId/status', (req, res) => {
  try {
    const { status } = req.body;
    const orders = readOrders();
    const orderIndex = orders.findIndex(o => o.orderId === req.params.orderId);
    
    if (orderIndex !== -1) {
      orders[orderIndex].status = status;
      if (writeOrders(orders)) {
        res.json({ success: true, order: orders[orderIndex] });
      } else {
        res.status(500).json({ error: 'Failed to update order' });
      }
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Admin login
app.post('/api/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = readAdmin();
    
    if (username === admin.username && password === admin.password) {
      res.json({ success: true, token: 'admin-token' });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Download file
app.get('/api/files/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);
    
    if (fs.existsSync(filePath)) {
      res.download(filePath);
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Clear all orders (admin only)
app.delete('/api/orders', (req, res) => {
  try {
    if (writeOrders([])) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to clear orders' });
    }
  } catch (error) {
    console.error('Error clearing orders:', error);
    res.status(500).json({ error: 'Failed to clear orders' });
  }
});

// Clear all files (admin only)
app.delete('/api/files', (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, 'uploads');
    const files = fs.readdirSync(uploadsDir);
    
    files.forEach(file => {
      if (file !== '.gitkeep') {
        fs.unlinkSync(path.join(uploadsDir, file));
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing files:', error);
    res.status(500).json({ error: 'Failed to clear files' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});