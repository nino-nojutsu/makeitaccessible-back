var express = require('express');
var router = express.Router();

router.put('/reviewed/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewed } = req.body;
    const result = await db.query('UPDATE tests SET reviewed = $1 WHERE id = $2 RETURNING *', [reviewed, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }
    res.json({ message: 'Test reviewed successfully', test: result.rows[0] });
  } catch (error) {
    console.error('Error reviewing test:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/ignore/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('UPDATE tests SET status = \'ignore\' WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }
    res.json({ message: 'Test ignored successfully', test: result.rows[0] });
  } catch (error) {
    console.error('Error ignoring test:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;