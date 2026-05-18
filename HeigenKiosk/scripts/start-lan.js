const { spawn } = require('child_process');
const os = require('os');

function getLocalIPv4() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

const localIP = getLocalIPv4();
if (!localIP) {
  console.error('Unable to determine local IPv4 address. Please check your network connection.');
  process.exit(1);
}

const args = ['expo', 'start', '--host', 'lan', '--port', '8090', ...process.argv.slice(2)];
const env = { ...process.env, REACT_NATIVE_PACKAGER_HOSTNAME: localIP, EXPO_DEVTOOLS_LISTEN_ADDRESS: '0.0.0.0' };

console.log(`Starting Expo on LAN host ${localIP}...`);

const child = spawn('npx', args, { stdio: 'inherit', env, shell: true });
child.on('close', (code) => process.exit(code));
child.on('error', (error) => {
  console.error('Failed to start Expo:', error);
  process.exit(1);
});
