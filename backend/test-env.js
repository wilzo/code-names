// Teste simples para verificar as variáveis de ambiente
require("dotenv").config();

console.log("=== TESTE DE VARIÁVEIS DE AMBIENTE ===");
console.log(
  "SUPABASE_URL:",
  process.env.SUPABASE_URL ? "✅ Configurado" : "❌ Não configurado"
);
console.log(
  "SUPABASE_ANON_KEY:",
  process.env.SUPABASE_ANON_KEY ? "✅ Configurado" : "❌ Não configurado"
);
console.log("PORT:", process.env.PORT || "3001 (padrão)");
console.log("NODE_ENV:", process.env.NODE_ENV || "development (padrão)");

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.log(
    "\n❌ PROBLEMA: Arquivo .env não encontrado ou variáveis não configuradas!"
  );
  console.log("📋 Solução: Crie um arquivo .env na pasta backend/ com:");
  console.log("SUPABASE_URL=sua_url_aqui");
  console.log("SUPABASE_ANON_KEY=sua_chave_aqui");
} else {
  console.log("\n✅ Tudo configurado corretamente!");
}
