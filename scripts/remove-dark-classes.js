#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function removeFileSync(filePath) {
  try {
    fs.unlinkSync(filePath);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // ignore
  }
}

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and .next
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        walkDir(filePath, callback);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      callback(filePath);
    }
  });
}

let filesModified = 0;

walkDir(path.join(__dirname, '../src'), (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;

  // Remove dark: utility classes
  content = content.replace(/\s+dark:[a-zA-Z0-9\-]*/g, '');
  
  // Clean up double spaces in className
  content = content.replace(/className="([^"]*)(\s{2,})([^"]*)"/g, 'className="$1 $3"');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    filesModified++;
    console.log(`✅ ${filePath}`);
  }
});

console.log(`\n🎉 Removed dark: classes from ${filesModified} files`);
