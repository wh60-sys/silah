import { FamilyMember } from '../types';

export function importJSON(file: File): Promise<FamilyMember> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        resolve(json);
      } catch (err) {
        reject(new Error("Format file JSON tidak valid."));
      }
    };
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.readAsText(file);
  });
}

// Very basic CSV import (assuming specific structure from exportCSV)
export function importCSV(file: File): Promise<FamilyMember> {
  return new Promise((resolve, reject) => {
    // Mock implementation for now
    reject(new Error("Impor CSV belum diimplementasi secara penuh. Gunakan format JSON."));
  });
}

export function importGEDCOM(file: File): Promise<FamilyMember> {
  return new Promise((resolve, reject) => {
    // Mock implementation
    reject(new Error("Impor GEDCOM belum diimplementasi secara penuh. Gunakan format JSON."));
  });
}
