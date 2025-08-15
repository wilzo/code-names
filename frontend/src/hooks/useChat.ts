import { useState, useRef } from "react";

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
  type: "chat" | "system";
}

export interface UseChatOptions {
  maxMessages?: number;
  onSendMessage?: (message: string) => void;
}

export const useChat = (options: UseChatOptions = {}) => {
  const { maxMessages = 50, onSendMessage } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const addMessage = (
    userId: string,
    username: string,
    message: string,
    type: "chat" | "system" = "chat"
  ) => {
    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      username,
      message,
      timestamp: new Date().toISOString(),
      type,
    };

    setMessages((prev) => {
      const updated = [...prev, newMessage];
      return updated.slice(-maxMessages);
    });

    // Auto-scroll para a última mensagem
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const addSystemMessage = (message: string) => {
    addMessage("system", "Sistema", message, "system");
  };

  const sendMessage = () => {
    if (!inputMessage.trim()) return false;

    onSendMessage?.(inputMessage.trim());
    setInputMessage("");
    return true;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    inputMessage,
    setInputMessage,
    addMessage,
    addSystemMessage,
    sendMessage,
    handleKeyPress,
    clearMessages,
    messagesEndRef,
  };
};
