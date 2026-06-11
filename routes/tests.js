var express = require('express');
var router = express.Router();

router.put('/commented/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;
    const result = await db.query('UPDATE tests SET comments = $1 WHERE id = $2 RETURNING *', [comments, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }
    res.json({ message: 'Test commented successfully', test: result.rows[0] });
  } catch (error) {
    console.error('Error commenting test:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/removed/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('UPDATE tests SET status = \'removed\' WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }
    res.json({ message: 'Test removed successfully', test: result.rows[0] });
  } catch (error) {
    console.error('Error removing test:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;