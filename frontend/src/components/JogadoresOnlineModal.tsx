import { Users, Crown, User, X } from "lucide-react";

interface Jogador {
  id: string;
  nome: string;
  equipe: "vermelho" | "azul";
  role: "agente" | "espião_mestre";
  isHost: boolean;
  isOnline?: boolean;
}

interface JogadoresOnlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  jogadores: Jogador[];
  currentUserId: string;
}

export default function JogadoresOnlineModal({
  isOpen,
  onClose,
  jogadores,
  currentUserId,
}: JogadoresOnlineModalProps) {
  if (!isOpen) return null;

  const jogadoresVermelho = jogadores.filter((j) => j.equipe === "vermelho");
  const jogadoresAzul = jogadores.filter((j) => j.equipe === "azul");

  const getEquipeColor = (equipe: string) => {
    return equipe === "vermelho" ? "text-red-600" : "text-blue-600";
  };

  const getEquipeBg = (equipe: string) => {
    return equipe === "vermelho" ? "bg-red-50" : "bg-blue-50";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Jogadores Online ({jogadores.length})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            Equipe Vermelha ({jogadoresVermelho.length})
          </h3>
          <div className="space-y-2">
            {jogadoresVermelho.length === 0 ? (
              <p className="text-gray-400 text-sm italic">Nenhum jogador</p>
            ) : (
              jogadoresVermelho.map((jogador) => (
                <div
                  key={jogador.id}
                  className={`p-3 rounded-lg border ${getEquipeBg(
                    "vermelho"
                  )} ${
                    jogador.id === currentUserId ? "ring-2 ring-yellow-400" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {jogador.isHost && (
                        <Crown
                          className="w-4 h-4 text-yellow-500"
                          aria-label="Líder da sala"
                        />
                      )}
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-800">
                        {jogador.nome}
                        {jogador.id === currentUserId && " (Você)"}
                        {jogador.isHost && " ⭐"}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-600">
                        {jogador.role === "agente" ? "Agente" : "Espião Mestre"}
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-green-600">Online</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Equipe Azul */}
        <div className="mb-4">
          <h3 className="font-semibold text-blue-600 mb-2 flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            Equipe Azul ({jogadoresAzul.length})
          </h3>
          <div className="space-y-2">
            {jogadoresAzul.length === 0 ? (
              <p className="text-gray-400 text-sm italic">Nenhum jogador</p>
            ) : (
              jogadoresAzul.map((jogador) => (
                <div
                  key={jogador.id}
                  className={`p-3 rounded-lg border ${getEquipeBg("azul")} ${
                    jogador.id === currentUserId ? "ring-2 ring-yellow-400" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {jogador.isHost && (
                        <Crown
                          className="w-4 h-4 text-yellow-500"
                          aria-label="Líder da sala"
                        />
                      )}
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-800">
                        {jogador.nome}
                        {jogador.id === currentUserId && " (Você)"}
                        {jogador.isHost && " ⭐"}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-600">
                        {jogador.role === "agente" ? "Agente" : "Espião Mestre"}
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-green-600">Online</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
