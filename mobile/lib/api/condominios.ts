export interface Condominio {
  id_comdominio: number;
  nome: string;
  cidade: string;
  morada: string;
  codigo_postal: string;
  id_user: string;
  image_url?: string | null;
  num_fracoes?: number | null;
  num_pisos?: number | null;
  tem_elevador?: boolean | null;
  is_active: boolean;
  created_at: string;
  memberRole?: 'residente' | 'tecnico';
}
