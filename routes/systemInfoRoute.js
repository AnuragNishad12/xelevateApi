const express = require('express');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const router = express.Router();

router.get('/system-info', async (req, res) => {
  try {
    // Fetch basic system information
    const uptime = os.uptime();
    const platform = os.platform();
    const arch = os.arch();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const loadavg = os.loadavg();
    const cpus = os.cpus().length;

    // Fetch OS details manually using `uname` or `/etc/os-release`
    const osInfo = getOsInfo();

    // Fetch CPU info manually using `lscpu` or `cat /proc/cpuinfo` (Linux-specific)
    const cpuInfo = getCpuInfo();

    // Fetch memory info manually using `/proc/meminfo` (Linux-specific)
    const memoryInfo = getMemoryInfo();

    // Fetch disk info manually (Linux) using `lsblk` or `df`
    const diskInfo = getDiskInfo();

    // Fetch network info manually using `ifconfig` or `ip a`
    const networkInfo = getNetworkInfo();

    // Fetch battery info (Linux-specific) using `upower` or `/sys/class/power_supply`
    const batteryInfo = getBatteryInfo();

    // Fetch logged-in users manually using `who` or `w`
    const usersInfo = getUsersInfo();

    // Get system info manually using `dmidecode` or `/sys/class/dmi/id`
    const systemInfo = getSystemInfo();

    // Fetch process info manually using `ps`
    const processInfo = getProcessInfo();

    // Combine all system information
    const systemStats = {
      uptime,
      platform,
      architecture: arch,
      totalMemory: totalMem,
      freeMemory: freeMem,
      loadAverage: loadavg,
      cpuCount: cpus,
      osInfo,
      cpuInfo,
      memoryInfo,
      diskInfo,
      networkInfo,
      batteryInfo,
      usersInfo,
      systemInfo,
      processInfo,
    };

    // Check the 'Accept' header to determine the response format
    const acceptHeader = req.get('Accept');

    if (acceptHeader && acceptHeader.includes('application/json')) {
      // Respond with JSON if the header requests JSON
      return res.json(systemStats);
    }

    // Otherwise, respond with a plain text format
    let textResponse = `
    System Info:
    --------------
    Uptime: ${uptime} seconds
    Platform: ${platform}
    Architecture: ${arch}
    Total Memory: ${totalMem} bytes
    Free Memory: ${freeMem} bytes
    Load Average: ${loadavg.join(', ')}
    CPU Count: ${cpus}

    OS Info:
    Platform: ${osInfo.platform}
    Distro: ${osInfo.distro}
    Hostname: ${osInfo.hostname}
    Release: ${osInfo.release}
    Architecture: ${osInfo.arch}

    CPU Info:
    Manufacturer: ${cpuInfo.manufacturer || 'N/A'}
    Brand: ${cpuInfo.brand || 'N/A'}
    Speed: ${cpuInfo.speed || 'N/A'} GHz
    Cores: ${cpuInfo.cores || 'N/A'}

    Memory Info:
    Total: ${memoryInfo.total} bytes
    Free: ${memoryInfo.free} bytes
    Active: ${memoryInfo.active} bytes
    Used: ${memoryInfo.used} bytes
    Available: ${memoryInfo.available} bytes

    Disk Info:
    ${diskInfo.map(disk => `Type: ${disk.type}, Vendor: ${disk.vendor}, Size: ${disk.size} bytes`).join('\n')}

    Network Info:
    ${networkInfo.map(iface => `Interface: ${iface.iface}, MAC: ${iface.mac}, IP4: ${iface.ip4}, IP6: ${iface.ip6}`).join('\n')}

    Battery Info:
    Has Battery: ${batteryInfo.hasbattery || 'N/A'}
    Battery Percent: ${batteryInfo.percent || 'N/A'}%
    Is Charging: ${batteryInfo.ischarging || 'N/A'}
    Time Left: ${batteryInfo.timeleft || 'N/A'} minutes

    Users Info:
    ${usersInfo.map(user => `User: ${user.user}, Hostname: ${user.hostname}, TTY: ${user.tty}`).join('\n')}

    System Info:
    Manufacturer: ${systemInfo.manufacturer || 'N/A'}
    Model: ${systemInfo.model || 'N/A'}
    Serial: ${systemInfo.serial || 'N/A'}
    UUID: ${systemInfo.uuid || 'N/A'}

    Process Info:
    ${processInfo.map(proc => `PID: ${proc.pid}, Name: ${proc.name}, CPU: ${proc.cpu}%, Memory: ${proc.memory} MB`).join('\n')}
    `;

    return res.type('text').send(textResponse);

  } catch (error) {
    console.error('Error retrieving system information:', error);
    res.status(500).send('Error retrieving system information');
  }
});

// Helper functions for system info retrieval

function getOsInfo() {
  // Read `/etc/os-release` for OS information
  try {
    const osRelease = fs.readFileSync('/etc/os-release', 'utf8');
    const osInfo = {};
    osRelease.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        osInfo[key.trim()] = value.trim().replace(/"/g, '');
      }
    });
    return {
      platform: os.platform(),
      distro: osInfo.NAME || 'N/A',
      hostname: os.hostname(),
      release: os.release(),
      arch: os.arch()
    };
  } catch (error) {
    return { platform: os.platform(), distro: 'N/A', hostname: os.hostname(), release: os.release(), arch: os.arch() };
  }
}

function getCpuInfo() {
  // Get CPU info from `/proc/cpuinfo` (Linux-specific)
  try {
    const cpuInfo = fs.readFileSync('/proc/cpuinfo', 'utf8');
    const lines = cpuInfo.split('\n');
    const cpuData = {};
    lines.forEach(line => {
      const [key, value] = line.split(':');
      if (key && value) {
        cpuData[key.trim()] = value.trim();
      }
    });
    return {
      manufacturer: cpuData['vendor_id'] || 'N/A',
      brand: cpuData['model name'] || 'N/A',
      speed: cpuData['cpu MHz'] || 'N/A',
      cores: os.cpus().length
    };
  } catch (error) {
    return { manufacturer: 'N/A', brand: 'N/A', speed: 'N/A', cores: os.cpus().length };
  }
}

function getMemoryInfo() {
  // Get memory information from `/proc/meminfo`
  try {
    const memInfo = fs.readFileSync('/proc/meminfo', 'utf8');
    const memData = {};
    memInfo.split('\n').forEach(line => {
      const [key, value] = line.split(':');
      if (key && value) {
        memData[key.trim()] = parseInt(value.trim().split(' ')[0]);
      }
    });
    return {
      total: memData['MemTotal'] || 0,
      free: memData['MemFree'] || 0,
      active: memData['Active'] || 0,
      used: memData['MemTotal'] - memData['MemFree'],
      available: memData['MemAvailable'] || 0
    };
  } catch (error) {
    return { total: 0, free: 0, active: 0, used: 0, available: 0 };
  }
}

function getDiskInfo() {
  // Get disk info using `lsblk` or `df`
  try {
    const result = execSync('lsblk -o NAME,SIZE,TYPE,VENDOR').toString();
    const disks = result.split('\n').slice(1).map(line => {
      const [name, size, type, vendor] = line.trim().split(/\s+/);
      return { name, size, type, vendor };
    });
    return disks;
  } catch (error) {
    return [];
  }
}

function getNetworkInfo() {
  // Get network info using `ifconfig` or `ip a`
  try {
    const result = execSync('ip -o addr show').toString();
    const networkInterfaces = result.split('\n').map(line => {
      const match = line.match(/(\w+):\s.*inet\s([\d\.]+).*(inet6\s([\da-f:]+))?/);
      if (match) {
        return { iface: match[1], ip4: match[2], ip6: match[4] || 'N/A' };
      }
    }).filter(Boolean);
    return networkInterfaces;
  } catch (error) {
    return [];
  }
}

function getBatteryInfo() {
  // Get battery info from `/sys/class/power_supply`
  try {
    const batteryPath = '/sys/class/power_supply/BAT0/';
    const hasBattery = fs.existsSync(batteryPath);
    if (hasBattery) {
      const percent = fs.readFileSync(path.join(batteryPath, 'capacity'), 'utf8').trim();
      const isCharging = fs.readFileSync(path.join(batteryPath, 'status'), 'utf8').trim() === 'Charging';
      const timeLeft = fs.readFileSync(path.join(batteryPath, 'time_to_empty'), 'utf8').trim();
      return { hasbattery: true, percent, ischarging: isCharging, timeleft: timeLeft };
    }
    return { hasbattery: false, percent: 'N/A', ischarging: 'N/A', timeleft: 'N/A' };
  } catch (error) {
    return { hasbattery: false, percent: 'N/A', ischarging: 'N/A', timeleft: 'N/A' };
  }
}

function getUsersInfo() {
  // Get users info using `who`
  try {
    const result = execSync('who').toString();
    const users = result.split('\n').map(line => {
      const parts = line.split(/\s+/);
      return { user: parts[0], hostname: parts[1], tty: parts[2] };
    });
    return users;
  } catch (error) {
    return [];
  }
}

function getSystemInfo() {
  // Get system info (manufacturer, model, serial, UUID) from `/sys/class/dmi/id`
  try {
    const manufacturer = fs.readFileSync('/sys/class/dmi/id/board_vendor', 'utf8').trim();
    const model = fs.readFileSync('/sys/class/dmi/id/board_name', 'utf8').trim();
    const serial = fs.readFileSync('/sys/class/dmi/id/product_serial', 'utf8').trim();
    const uuid = fs.readFileSync('/sys/class/dmi/id/product_uuid', 'utf8').trim();
    return { manufacturer, model, serial, uuid };
  } catch (error) {
    return { manufacturer: 'N/A', model: 'N/A', serial: 'N/A', uuid: 'N/A' };
  }
}

function getProcessInfo() {
  // Get process info using `ps`
  try {
    const result = execSync('ps -eo pid,comm,%cpu,%mem').toString();
    const processes = result.split('\n').slice(1).map(line => {
      const parts = line.trim().split(/\s+/);
      return { pid: parts[0], name: parts[1], cpu: parts[2], memory: parts[3] };
    });
    return processes;
  } catch (error) {
    return [];
  }
}

module.exports = router;