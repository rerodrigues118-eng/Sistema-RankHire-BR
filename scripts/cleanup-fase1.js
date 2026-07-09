const fs = require('fs');
const path = require('path');

const dirsToScan = [
  path.join(__dirname, '../src'),
  path.join(__dirname, '../app'),
  path.join(__dirname, '../components'),
  path.join(__dirname, '../lib'),
  path.join(__dirname, '../hooks'),
].filter(fs.existsSync);

let deletedFiles = [];
let removedLogsCount = 0;
let removedTodosCount = 0;

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  
  if (files.length === 0) {
    fs.rmdirSync(dir);
    console.log(`Deleted empty dir: ${dir}`);
    return;
  }

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else {
      if (/\.(bak|old|copy|_backup)$/.test(file)) {
        fs.unlinkSync(fullPath);
        deletedFiles.push(fullPath);
        console.log(`Deleted backup file: ${fullPath}`);
        continue;
      }

      if (/\.(ts|tsx|js|jsx)$/.test(file)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        let originalContent = content;

        const logRegex = /console\.log\([^)]*\);?/g;
        const matches = content.match(logRegex);
        if (matches) {
            removedLogsCount += matches.length;
            content = content.replace(logRegex, '');
        }

        const todoRegex = /\/\/\s*(TODO|FIXME)[^\n\r]*/gi;
        content = content.replace(todoRegex, (match) => {
            if (/#\d+/.test(match)) return match;
            removedTodosCount++;
            return '';
        });

        if (file.toLowerCase().includes('mock') || file.toLowerCase().includes('seed')) {
            console.log(`POTENTIAL MOCK FILE: ${fullPath}`);
        }
        
        if (content.toLowerCase().includes('em construção')) {
            console.log(`PAGE UNDER CONSTRUCTION: ${fullPath}`);
        }

        if (content !== originalContent) {
          fs.writeFileSync(fullPath, content, 'utf8');
        }
      }
    }
  }
}

dirsToScan.forEach(scanDir);
console.log('\n--- SUMMARY ---');
console.log(`Deleted ${deletedFiles.length} backup files.`);
console.log(`Removed ${removedLogsCount} console.logs.`);
console.log(`Removed ${removedTodosCount} TODOs/FIXMEs.`);
