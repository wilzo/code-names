import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import RegisterForm from "@/components/RegisterForm";
import { useState } from "react";
import { registerUser } from "@/services/userService";

export default function RegistroPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleRegister = async (formData: {
    nome: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    try {
      setIsLoading(true);
      setMessage(null);

      const result = await registerUser(formData);
      console.log("Resultado do registro:", result);

      setMessage({
        type: "success",
        text: "Conta criada com sucesso! Verifique sua caixa de entrada e confirme o email antes de fazer login.",
      });

      setTimeout(() => {
        window.location.href = "/login";
      }, 5000);
    } catch (err: any) {
      console.error("Erro no registro:", err);
      setMessage({
        type: "error",
        text: err.message || "Erro ao registrar usuário. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-800 via-red-900 to-orange-700">
      <header className="flex justify-between items-center p-4">
        <Link
          href="/login"
          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 px-4 py-2 rounded-full font-bold text-black transition-colors"
        >
          <ArrowLeft size={20} />
          Voltar
        </Link>
      </header>

      <div className="flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Criar Conta no Código Secreto
            </h1>
            <p className="text-gray-600">Registre-se para começar a jogar</p>
          </div>

          {message && (
            <div
              className={`mb-4 p-4 rounded-lg text-sm ${
                message.type === "success"
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : "bg-red-100 text-red-800 border border-red-200"
              }`}
            >
              {message.text}
              {message.type === "success" && (
                <div className="mt-2 text-xs text-green-700">
                  ⏰ Redirecionando para login em alguns segundos...
                </div>
              )}
            </div>
          )}

          <RegisterForm onSubmit={handleRegister} isLoading={isLoading} />

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Já tem uma conta?{" "}
              <Link
                href="/login"
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                Entre aqui
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
