import { Send } from "lucide-react";
import { ChatMessage } from "@/hooks/useChat";

interface ChatPanelProps {
  messages: ChatMessage[];
  inputMessage: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  maxLength?: number;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  className?: string;
}

export default function ChatPanel({
  messages,
  inputMessage,
  onInputChange,
  onSendMessage,
  onKeyPress,
  placeholder = "Digite sua mensagem...",
  maxLength = 200,
  messagesEndRef,
  className = "",
}: ChatPanelProps) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-3">
        <h3 className="font-semibold text-gray-800">Chat & Registro</h3>
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>Nenhuma mensagem ainda.</p>
            <p className="text-sm">Seja o primeiro a conversar!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`text-sm ${
                message.type === "system"
                  ? "text-gray-600 italic"
                  : "text-gray-800"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-xs text-gray-400 mt-0.5 shrink-0">
                  {formatTime(message.timestamp)}
                </span>
                <div className="flex-1 min-w-0">
                  {message.type === "system" ? (
                    <span className="text-blue-600">• {message.message}</span>
                  ) : (
                    <div>
                      <span className="font-medium text-gray-700">
                        {message.username}:
                      </span>{" "}
                      <span className="text-gray-800">{message.message}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={onKeyPress}
            placeholder={placeholder}
            maxLength={maxLength}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <button
            onClick={onSendMessage}
            disabled={!inputMessage.trim()}
            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {inputMessage.length}/{maxLength} caracteres
        </div>
      </div>
    </div>
  );
}
