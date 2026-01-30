const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const iconv = require('iconv-lite');
const router = express.Router();

const ALLOWED_BASE_PATH = process.env.WORKSPACE_PATH || path.join(__dirname, '..');

function validatePath(requestedPath) {
  const resolvedPath = path.resolve(requestedPath);
  const resolvedBase = path.resolve(ALLOWED_BASE_PATH);
  
  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new Error('Access denied: Path outside workspace');
  }
  
  return resolvedPath;
}

router.get('/list', async (req, res) => {
  try {
    const { dir = '.' } = req.query;
    const targetPath = validatePath(path.join(ALLOWED_BASE_PATH, dir));
    
    const items = await fs.readdir(targetPath, { withFileTypes: true });
    const result = items.map(item => ({
      name: item.name,
      path: path.join(dir, item.name),
      type: item.isDirectory() ? 'directory' : 'file'
    }));
    
    res.json({ items: result });
  } catch (error) {
    console.error('List directory error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/read', async (req, res) => {
  try {
    const { path: filePath } = req.query;
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    const targetPath = validatePath(path.join(ALLOWED_BASE_PATH, filePath));
    const content = await fs.readFile(targetPath, 'utf-8');
    
    res.json({ content, path: filePath });
  } catch (error) {
    console.error('Read file error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/write', async (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    if (!filePath || content === undefined) {
      return res.status(400).json({ error: 'File path and content are required' });
    }
    
    const targetPath = validatePath(path.join(ALLOWED_BASE_PATH, filePath));
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, content, 'utf-8');
    
    res.json({ success: true, path: filePath });
  } catch (error) {
    console.error('Write file error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/create', async (req, res) => {
  try {
    const { path: filePath, type = 'file' } = req.body;
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    const targetPath = validatePath(path.join(ALLOWED_BASE_PATH, filePath));
    
    if (type === 'directory') {
      await fs.mkdir(targetPath, { recursive: true });
    } else {
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, '', 'utf-8');
    }
    
    res.json({ success: true, path: filePath });
  } catch (error) {
    console.error('Create file error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/delete', async (req, res) => {
  try {
    const { path: filePath } = req.body;
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    const targetPath = validatePath(path.join(ALLOWED_BASE_PATH, filePath));
    const stats = await fs.stat(targetPath);
    
    if (stats.isDirectory()) {
      await fs.rm(targetPath, { recursive: true, force: true });
    } else {
      await fs.unlink(targetPath);
    }
    
    res.json({ success: true, path: filePath });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/exists', async (req, res) => {
  try {
    const { path: filePath } = req.query;
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    const targetPath = validatePath(path.join(ALLOWED_BASE_PATH, filePath));
    await fs.access(targetPath);
    
    const stats = await fs.stat(targetPath);
    res.json({ 
      exists: true, 
      type: stats.isDirectory() ? 'directory' : 'file' 
    });
  } catch (error) {
    res.json({ exists: false });
  }
});

router.post('/execute', async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }
    
    const { spawn } = require('child_process');
    const { exec } = require('child_process');
    
    const isWindows = process.platform === 'win32';
    const allowedCommands = ['ls', 'dir', 'pwd', 'echo', 'cat', 'node', 'npm'];
    const commandName = command.split(' ')[0].toLowerCase();
    
    if (!allowedCommands.includes(commandName)) {
      return res.status(403).json({ 
        error: `Command '${commandName}' is not allowed. Allowed commands: ${allowedCommands.join(', ')}` 
      });
    }
    
    let actualCommand = command;
    if (isWindows) {
      if (commandName === 'ls') {
        actualCommand = 'dir /B';
      } else if (commandName === 'pwd') {
        actualCommand = 'cd';
      } else if (commandName === 'cat') {
        const fileName = command.replace(/^cat\s+/, '');
        actualCommand = `type "${fileName}"`;
      } else if (commandName === 'echo') {
        const text = command.replace(/^echo\s+/, '');
        actualCommand = `echo ${text}`;
      }
    }
    
    const options = { cwd: ALLOWED_BASE_PATH, timeout: 10000 };
    
    if (isWindows) {
      options.encoding = 'binary';
    } else {
      options.encoding = 'utf8';
    }
    
    exec(actualCommand, options, (error, stdout, stderr) => {
      if (error) {
        console.error('Execute command error:', error);
        return res.status(500).json({ 
          error: error.message,
          stderr: stderr 
        });
      }
      
      let finalOutput = stdout;
      let finalStderr = stderr;
      
      if (isWindows) {
        try {
          finalOutput = iconv.decode(Buffer.from(stdout, 'binary'), 'cp936');
          finalStderr = iconv.decode(Buffer.from(stderr, 'binary'), 'cp936');
        } catch (e) {
          console.error('Encoding conversion error:', e);
          finalOutput = stdout;
          finalStderr = stderr;
        }
      }
      
      res.json({ 
        success: true, 
        command: actualCommand,
        output: finalOutput,
        stderr: finalStderr 
      });
    });
  } catch (error) {
    console.error('Execute command error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
