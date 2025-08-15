const { v4: uuidv4 } = require("uuid");

console.log("🧪 Testando geração de UUIDs:");
console.log("UUID 1:", uuidv4());
console.log("UUID 2:", uuidv4());
console.log("UUID 3:", uuidv4());

console.log("\n✅ Se você vê UUIDs válidos acima, o módulo está funcionando!");
console.log("❌ Se der erro, execute: npm install uuid");
