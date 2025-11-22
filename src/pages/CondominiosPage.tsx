import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// Importa o supabase client criado no teu projeto
import { supabase } from "@/supabase-client";

import { CondominioForm } from "@/components/CondominioForm/CondominioForm";
import { CondominioFormData } from "@/components/CondominioForm/validation";
import { Condominio } from "@/api/condominios";

export const CondominiosPage: React.FC = () => {
  const navigate = useNavigate();

  // Estado para controlar se o formulário está aberto
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Estado para guardar o condomínio selecionado para edição (ou null para criar novo)
  const [selectedCondominio, setSelectedCondominio] =
    useState<Condominio | null>(null);

  // Função chamada para abrir o formulário para criação de novo condomínio
  const handleCreate = () => {
    setSelectedCondominio(null);
    setIsFormOpen(true);
  };

  function mapCondominioToFormData(condominio: Condominio): CondominioFormData {
    return {
      nome: condominio.nome,
      morada: condominio.morada,
      codigo_postal: condominio.codigo_postal,
      cidade: condominio.cidade,
      nif: String(condominio.nif), // Converte para string!
      n_fracoes: condominio.n_fracoes,
      contacto_administrador: condominio.contacto_administrador,
    };
  }

  // Função chamada para abrir o formulário para editar um condomínio existente
  const handleEdit = (condominio: Condominio) => {
    setSelectedCondominio(condominio);
    setIsFormOpen(true);
  };

  // Função que une o submit do formulário com a chamada Supabase para inserir/atualizar
  const handleFormSubmit = async (data: CondominioFormData) => {
    try {
      if (selectedCondominio) {
        // Atualizar condomínio existente
        const { error } = await supabase
          .from("condominio")
          .update({
            nome: data.nome,
            morada: data.morada,
            codigo_postal: data.codigo_postal,
            cidade: data.cidade,
            nif: Number(data.nif),
            n_fracoes: data.n_fracoes,
            contacto_administrador: data.contacto_administrador,
          })
          .eq("id_condominio", selectedCondominio.id_condominio); // Ajusta o campo id chave primária

        if (error) {
          console.error("Erro ao atualizar condomínio:", error);
          alert("Erro ao atualizar o condomínio.");
          return;
        }
      } else {
        // Criar novo condomínio
        const { error } = await supabase.from("condominio").insert([
          {
            nome: data.nome,
            morada: data.morada,
            codigo_postal: data.codigo_postal,
            cidade: data.cidade,
            nif: data.nif,
            n_fracoes: data.n_fracoes,
            //contacto_administrador: data.contacto_administrador,
          },
        ]);

        if (error) {
          console.error("Erro ao criar condomínio:", error);
          alert("Erro ao criar o condomínio.");
          return;
        }
      }

      // Fechar o diálogo após sucesso
      setIsFormOpen(false);
      setSelectedCondominio(null);

      // Aqui podes acrescentar lógica para atualizar a lista de condomínios,
      // por exemplo, recarregar dados do backend ou atualizar o state.
      // Exemplo:
      // await fetchCondominios();
    } catch (err) {
      console.error("Erro inesperado:", err);
      alert("Erro inesperado. Por favor tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Gestão de Condomínios
              </h1>
              <p className="text-sm text-muted-foreground">
                Gerir todos os condomínios da plataforma
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleCreate}
              className="gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Novo Condomínio
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo principal e lista de condomínios vai aqui */}

      {/* Formulário de condomínio, com estado controlado */}
      <CondominioForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        initialData={
          selectedCondominio
            ? mapCondominioToFormData(selectedCondominio)
            : undefined
        }
      />
    </div>
  );
};
