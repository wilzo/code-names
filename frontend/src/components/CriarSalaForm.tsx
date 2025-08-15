import { useState } from "react";
import { Lock, Unlock } from "lucide-react";

export default function CriarSalaForm({
  onSubmit,
}: {
  onSubmit: (data: any) => void;
}) {
  const [nomeSala, setNomeSala] = useState("");
  const [senha, setSenha] = useState("");
  const [salaPrivada, setSalaPrivada] = useState(false);
  const [maxJogadores, setMaxJogadores] = useState(8);

  const handleSubmit = () => {
    if (!nomeSala.trim()) return;
    onSubmit({
      nome: nomeSala, // Corrigido: nomeSala -> nome
      maxJogadores,
      privada: salaPrivada, // Corrigido: salaPrivada -> privada
      senha: senha, // Adicionado campo senha
    });
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome da sala
        </label>
        <input
          type="text"
          value={nomeSala}
          onChange={(e) => setNomeSala(e.target.value)}
          placeholder="Digite o nome da sala"
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max. jogadores
          </label>
          <select
            value={maxJogadores}
            onChange={(e) => setMaxJogadores(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
          >
            <option value={4}>4 jogadores</option>
            <option value={6}>6 jogadores</option>
            <option value={8}>8 jogadores</option>
            <option value={10}>10 jogadores</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de sala
          </label>
          <button
            type="button"
            onClick={() => setSalaPrivada(!salaPrivada)}
            className="w-full p-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-start"
          >
            {salaPrivada ? (
              <Lock className="w-4 h-4 mr-2" />
            ) : (
              <Unlock className="w-4 h-4 mr-2" />
            )}
            {salaPrivada ? "Privada" : "Pública"}
          </button>
        </div>
      </div>
      {salaPrivada && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Senha da sala
          </label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Digite uma senha"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
          />
        </div>
      )}
      <button
        type="submit"
        disabled={!nomeSala.trim()}
        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white font-semibold py-3 text-lg rounded-md transition-colors"
      >
        Criar Sala
      </button>
    </form>
  );
}
