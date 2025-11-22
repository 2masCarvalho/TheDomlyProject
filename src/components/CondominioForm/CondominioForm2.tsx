import { useState } from "react";
import { supabase } from "@/supabase-client";

function CondominioForm2() {
  // State to hold form data
  const [formData, setFormData] = useState({
    nome: "",
    morada: "",
    cidade: "",
    codigo_postal: "",
    nif: "",
    data_criacao: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Generic handler to update state on input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default browser submission
    setLoading(true);
    setMessage("");

    try {
      // 1. Get the currently logged-in user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("User not authenticated. Please log in.");
      }

      // 2. Prepare the object to insert
      // It includes form data + the user's ID
      const newCondo = {
        ...formData,
        id_user: user.id,
        // 'nif' is int4 in your DB, so convert it
        nif: parseInt(formData.nif, 10),
      };

      // 3. Insert the data into the 'condominio' table
      const { data, error } = await supabase
        .from("condominio")
        .insert([newCondo])
        .select(); // .select() returns the newly created row

      if (error) {
        throw error;
      }

      // Success!
      setMessage(`Success! Condominio "${data[0].nome}" created.`);
      // Reset form
      setFormData({
        nome: "",
        morada: "",
        cidade: "",
        codigo_postal: "",
        nif: "",
        data_criacao: "",
      });
    } catch (error) {
      console.error("Error creating condominium:", error.message);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create New Condominio</h2>

      {/* Form Fields */}
      <div>
        <label htmlFor="nome">Nome:</label>
        <input
          type="text"
          id="nome"
          name="nome"
          value={formData.nome}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="morada">Morada (Address):</label>
        <input
          type="text"
          id="morada"
          name="morada"
          value={formData.morada}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="cidade">Cidade (City):</label>
        <input
          type="text"
          id="cidade"
          name="cidade"
          value={formData.cidade}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="codigo_postal">Código Postal (Postal Code):</label>
        <input
          type="text"
          id="codigo_postal"
          name="codigo_postal"
          value={formData.codigo_postal}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="nif">NIF (Tax ID):</label>
        <input
          type="number"
          id="nif"
          name="nif"
          value={formData.nif}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="data_criacao">Data de Criação (Creation Date):</label>
        <input
          type="date"
          id="data_criacao"
          name="data_criacao"
          value={formData.data_criacao}
          onChange={handleChange}
          required
        />
      </div>

      {/* Submission Button and Messages */}
      <button type="submit" disabled={loading}>
        {loading ? "Creating..." : "Create Condominio"}
      </button>

      {message && <p>{message}</p>}
    </form>
  );
}

export default CondominioForm2;
