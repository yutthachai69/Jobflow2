const fs = require('fs');
const file = 'd:\\jobflow2.1\\app\\components\\forms\\CleanRoomForm.tsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(/text-gray-800(?! dark:text-white)/g, 'text-gray-800 dark:text-white');
c = c.replace(/text-gray-700(?! dark:text-gray-300)/g, 'text-gray-700 dark:text-gray-300');
c = c.replace(/text-gray-500(?! dark:text-gray-400)/g, 'text-gray-500 dark:text-gray-400');
c = c.replace(/<span className="text-sm">/g, '<span className="text-sm dark:text-gray-200">');

fs.writeFileSync(file, c);
console.log('Successfully updated text colors for dark mode.');
