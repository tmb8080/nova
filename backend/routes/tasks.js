const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const taskService = require('../services/taskService');

// Start daily earning task
router.post('/start-earning', authenticateToken, async (req, res) => {
  try {
    const result = await taskService.startEarningSession(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error starting daily earning task:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to start daily earning task'
    });
  }
});

// Get daily earning task status
router.get('/earning-status', authenticateToken, async (req, res) => {
  try {
    const result = await taskService.getEarningSessionStatus(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error getting earning status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get earning status'
    });
  }
});

// Get available daily earning task
router.get('/available', authenticateToken, async (req, res) => {
  try {
    const result = await taskService.getAvailableTasks(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error getting available tasks:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get available tasks'
    });
  }
});

// Start daily earning task
router.post('/start/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await taskService.startTask(req.user.id, taskId);
    res.json(result);
  } catch (error) {
    console.error('Error starting task:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to start task'
    });
  }
});

// Get task history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const result = await taskService.getTaskHistory(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error getting task history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get task history'
    });
  }
});

// Get earning history
router.get('/earning-history', authenticateToken, async (req, res) => {
  try {
    const result = await taskService.getEarningHistory(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error getting earning history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get earning history'
    });
  }
});

module.exports = router;
