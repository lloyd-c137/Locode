const express = require('express');
const router = express.Router();
const db = require('../db/init');

router.get('/list', (req, res) => {
  try {
    const configs = db.prepare('SELECT id, name, api_url, model, is_default, created_at FROM api_configs ORDER BY is_default DESC, created_at DESC').all();
    res.json({ configs });
  } catch (error) {
    console.error('Error fetching configs:', error);
    res.status(500).json({ error: 'Failed to fetch configs' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const config = db.prepare('SELECT id, name, api_url, model, is_default FROM api_configs WHERE id = ?').get(req.params.id);
    if (!config) {
      return res.status(404).json({ error: 'Config not found' });
    }
    res.json({ config });
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, apiUrl, apiKey, model, isDefault } = req.body;

    if (!name || !apiUrl || !apiKey || !model) {
      return res.status(400).json({ error: 'Name, API URL, API Key, and Model are required' });
    }

    const existing = db.prepare('SELECT id FROM api_configs WHERE name = ?').get(name);
    if (existing) {
      return res.status(400).json({ error: 'Config with this name already exists' });
    }

    if (isDefault) {
      db.prepare('UPDATE api_configs SET is_default = 0').run();
    }

    const result = db.prepare(`
      INSERT INTO api_configs (name, api_url, api_key, model, is_default)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, apiUrl, apiKey, model, isDefault ? 1 : 0);

    const config = db.prepare('SELECT id, name, api_url, model, is_default FROM api_configs WHERE id = ?').get(result.lastInsertRowid);
    res.json({ config });
  } catch (error) {
    console.error('Error creating config:', error);
    res.status(500).json({ error: 'Failed to create config' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { name, apiUrl, apiKey, model, isDefault } = req.body;

    if (!name || !apiUrl || !apiKey || !model) {
      return res.status(400).json({ error: 'Name, API URL, API Key, and Model are required' });
    }

    const existing = db.prepare('SELECT id FROM api_configs WHERE name = ? AND id != ?').get(name, req.params.id);
    if (existing) {
      return res.status(400).json({ error: 'Config with this name already exists' });
    }

    if (isDefault) {
      db.prepare('UPDATE api_configs SET is_default = 0').run();
    }

    db.prepare(`
      UPDATE api_configs
      SET name = ?, api_url = ?, api_key = ?, model = ?, is_default = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, apiUrl, apiKey, model, isDefault ? 1 : 0, req.params.id);

    const config = db.prepare('SELECT id, name, api_url, model, is_default FROM api_configs WHERE id = ?').get(req.params.id);
    res.json({ config });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ error: 'Failed to update config' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM api_configs WHERE id = ?').run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Config not found' });
    }

    const remaining = db.prepare('SELECT COUNT(*) as count FROM api_configs').get();
    if (remaining.count === 0) {
      return res.json({ message: 'Config deleted successfully' });
    }

    const hasDefault = db.prepare('SELECT COUNT(*) as count FROM api_configs WHERE is_default = 1').get();
    if (hasDefault.count === 0) {
      db.prepare('UPDATE api_configs SET is_default = 1 WHERE id = (SELECT id FROM api_configs ORDER BY created_at DESC LIMIT 1)').run();
    }

    res.json({ message: 'Config deleted successfully' });
  } catch (error) {
    console.error('Error deleting config:', error);
    res.status(500).json({ error: 'Failed to delete config' });
  }
});

router.post('/:id/set-default', (req, res) => {
  try {
    db.prepare('UPDATE api_configs SET is_default = 0').run();
    db.prepare('UPDATE api_configs SET is_default = 1 WHERE id = ?').run(req.params.id);
    
    const config = db.prepare('SELECT id, name, api_url, model, is_default FROM api_configs WHERE id = ?').get(req.params.id);
    res.json({ config });
  } catch (error) {
    console.error('Error setting default config:', error);
    res.status(500).json({ error: 'Failed to set default config' });
  }
});

router.get('/default/full', (req, res) => {
  try {
    const config = db.prepare('SELECT * FROM api_configs WHERE is_default = 1').get();
    if (!config) {
      return res.status(404).json({ error: 'No default config found' });
    }
    res.json({ config });
  } catch (error) {
    console.error('Error fetching default config:', error);
    res.status(500).json({ error: 'Failed to fetch default config' });
  }
});

module.exports = router;