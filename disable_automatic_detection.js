const fs = require('fs');
const path = require('path');

console.log('🛑 Disabling Automatic Detection System...');

// Update the status file to show it's disabled
const statusFilePath = path.join(__dirname, 'backend/automatic_detection_status.json');

const disabledStatus = {
  "isRunning": false,
  "message": "Automatic detection has been completely disabled - use manual deposits with transaction hash",
  "lastUpdated": new Date().toISOString()
};

try {
  fs.writeFileSync(statusFilePath, JSON.stringify(disabledStatus, null, 2));
  console.log('✅ Status file updated');
} catch (error) {
  console.error('❌ Error updating status file:', error);
}

// Kill any running automatic detection processes
const { exec } = require('child_process');

exec('ps aux | grep "start_automatic_detection" | grep -v grep | awk \'{print $2}\' | xargs kill', (error, stdout, stderr) => {
  if (error) {
    console.log('ℹ️  No automatic detection processes found to kill');
  } else {
    console.log('✅ Automatic detection processes stopped');
  }
});

console.log('✅ Automatic detection system has been disabled');
console.log('📝 Users must now use manual deposits with transaction hash');
console.log('🔧 To re-enable, run: node start_automatic_detection.js');
