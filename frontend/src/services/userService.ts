export async function registerUser(formData: {
  nome: string;
  email: string;
  password: string;
  confirmPassword: string;
}) {
  console.log("Enviando dados de registro:", formData);

  try {
    const res = await fetch("http://localhost:3001/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    console.log("Resposta recebida:", res);

    if (!res.ok) {
      let errorData;
      try {
        errorData = await res.json();
      } catch (jsonError) {
        console.error("Erro ao parsear resposta de erro:", jsonError);
        throw new Error(`Erro ${res.status}: ${res.statusText}`);
      }
      throw new Error(
        errorData.error || `Erro ${res.status}: ${res.statusText}`
      );
    }

    let data;
    try {
      data = await res.json();
    } catch (jsonError) {
      console.error("Erro ao parsear resposta de sucesso:", jsonError);
      throw new Error("Erro de comunicação com o servidor");
    }

    return data;
  } catch (error) {
    console.error("Erro no registro:", error);
    throw error;
  }
}
