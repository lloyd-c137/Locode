const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');
require('dotenv').config();

require('./db/init');

const siliconflowRoutes = require('./routes/siliconflow');
const fileSystemRoutes = require('./routes/fileSystem');
const configRoutes = require('./routes/config');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));
app.use('/media', express.static('media'));

app.use('/api/chat', siliconflowRoutes);
app.use('/api/files', fileSystemRoutes);
app.use('/api/config', configRoutes);

app.get('/remote', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'remote.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let server;

if (process.env.HTTPS === 'true') {
  const privateKey  = fs.readFileSync(process.env.SSL_KEY || 'server.key', 'utf8');
  const certificate = fs.readFileSync(process.env.SSL_CERT || 'server.cert', 'utf8');
  const credentials = {key: privateKey, cert: certificate};

  server = https.createServer(credentials, app);
  console.log('HTTPS mode enabled');
} else {
  server = http.createServer(app);
  console.log('HTTP mode enabled');
}

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('New remote client connected');
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'file-operation') {
        const result = await handleFileOperation(data);
        ws.send(JSON.stringify({ type: 'file-result', id: data.id, result }));
      } else if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', error: error.message }));
    }
  });

  ws.on('close', () => {
    console.log('Remote client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

async function handleFileOperation(data) {
  const { operation, path: filePath, content } = data;
  const ALLOWED_BASE_PATH = process.env.WORKSPACE_PATH || __dirname;
  
  function validatePath(requestedPath) {
    const resolvedPath = path.resolve(requestedPath);
    const resolvedBase = path.resolve(ALLOWED_BASE_PATH);
    
    if (!resolvedPath.startsWith(resolvedBase)) {
      throw new Error('Access denied: Path outside workspace');
    }
    
    return resolvedPath;
  }
  
  switch (operation) {
    case 'read':
      return await readFile(filePath, validatePath);
    case 'write':
      return await writeFile(filePath, content, validatePath);
    case 'list':
      return await listDirectory(filePath, validatePath);
    case 'delete':
      return await deletePath(filePath, validatePath);
    case 'create':
      return await createPath(filePath, data.fileType, validatePath);
    default:
      throw new Error('Unknown operation');
  }
}

async function readFile(filePath, validatePath) {
  const targetPath = validatePath(path.join(ALLOWED_BASE_PATH, filePath));
  const content = await fs.promises.readFile(targetPath, 'utf8');
  return { success: true, content };
}

async function writeFile(filePath, content, validatePath) {
  const targetPath = validatePath(path.join(ALLOWED_BASE_PATH, filePath));
  await fs.promises.writeFile(targetPath, content, 'utf8');
  return { success: true };
}

async function listDirectory(dir, validatePath) {
  const targetPath = validatePath(path.join(ALLOWED_BASE_PATH, dir || '.'));
  const items = await fs.promises.readdir(targetPath, { withFileTypes: true });
  const result = items.map(item => ({
    name: item.name,
    path: path.join(dir || '.', item.name),
    type: item.isDirectory() ? 'directory' : 'file'
  }));
  return { success: true, items: result };
}

async function deletePath(filePath, validatePath) {
  const targetPath = validatePath(path.join(ALLOWED_BASE_PATH, filePath));
  const stats = await fs.promises.stat(targetPath);
  
  if (stats.isDirectory()) {
    await fs.promises.rm(targetPath, { recursive: true, force: true });
  } else {
    await fs.promises.unlink(targetPath);
  }
  
  return { success: true };
}

async function createPath(filePath, fileType, validatePath) {
  const targetPath = validatePath(path.join(ALLOWED_BASE_PATH, filePath));
  
  if (fileType === 'directory') {
    await fs.promises.mkdir(targetPath, { recursive: true });
  } else {
    await fs.promises.writeFile(targetPath, '', 'utf8');
  }
  
  return { success: true };
}

server.listen(PORT, HOST, () => {
  console.log(`Locode server running at http${process.env.HTTPS === 'true' ? 's' : ''}://${HOST}:${PORT}`);
  console.log(`Local access: http${process.env.HTTPS === 'true' ? 's' : ''}://localhost:${PORT}`);
  console.log(`Network access: http${process.env.HTTPS === 'true' ? 's' : ''}://<your-ip-address>:${PORT}`);
  console.log(`WebSocket server ready for remote connections`);
});
