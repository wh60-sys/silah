export interface FamilyMember {
  id: string;
  name: string;
  spouseName?: string;
  spouseId?: string;
  gender?: 'laki-laki' | 'perempuan' | 'tidak-diketahui';
  birthYear?: string;
  deathYear?: string;
  isAlive: boolean;
  generation: number;
  photoUrl?: string;
  bio?: string;
  branch?: string;
  address?: string;
  children?: FamilyMember[];
  // New fields
  phone?: string;
  whatsappLink?: string;
  occupation?: string;
  religion?: string;
  education?: string;
  birthPlace?: string;
  marriageYear?: string;
  notes?: string;
}

export type LayoutMode = 'horizontal' | 'vertical';

export interface TreeFilters {
  generations: number[];
  branches: string[];
}
