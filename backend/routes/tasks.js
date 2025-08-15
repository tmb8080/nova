const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const taskService = require('../services/taskService');

// Start earning session
router.post('/start-earning', authenticateToken, async (req, res) => {
  try {
    const result = await taskService.startEarningSession(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error starting earning session:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to start earning session'
    });
  }
});

// Get earning session status
router.get('/earning-status', authenticateToken, async (req, res) => {
  try {
    const result = await taskService.getEarningSessionStatus(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error getting earning session status:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get earning session status'
    });
  }
});

// Stop earning session manually
router.post('/stop-earning', authenticateToken, async (req, res) => {
  try {
    const result = await taskService.stopEarningSession(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error stopping earning session:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to stop earning session'
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
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get earning history'
    });
  }
});

// Get available tasks
router.get('/available', authenticateToken, async (req, res) => {
  try {
    const result = await taskService.getAvailableTasks(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error getting available tasks:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get available tasks'
    });
  }
});

// Start a task
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

// Complete a task
router.post('/complete/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await taskService.completeTask(req.user.id, taskId);
    res.json(result);
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to complete task'
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
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get task history'
    });
  }
});

module.exports = router;
