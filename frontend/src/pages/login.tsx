import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LoginForm from "../components/LoginForm";
import { useRouter } from "next/router";
import { useState } from "react";
import { login } from "@/services/authService";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  interface LoginFormData {
    email: string;
    password: string;
  }

  const handleLogin = async (formData: LoginFormData): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await login(formData.email, formData.password);

      localStorage.setItem("supabase.auth.token", result.token);
      localStorage.setItem("user", JSON.stringify(result.usuario));

      // Redireciona para a página de criar sala
      router.push("/criarsala");
    } catch (err: any) {
      console.error("Erro no login:", err);
      setError(err.message || "Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br align-items-center from-orange-800 via-red-900 to-orange-700">
      <header className="flex justify-between items-center p-4"></header>

      <div className="flex justify-center px-4 py-10">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              CodWilzo Login
            </h1>
            <p className="text-gray-600">Faça login para continuar jogando</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm bg-red-100 text-red-800 border border-red-200">
              {error}
            </div>
          )}

          <LoginForm onSubmit={handleLogin} isLoading={isLoading} />

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Não tem uma conta?{" "}
              <Link
                href="/register"
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                Registre-se aqui
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
