import React, { useRef } from 'react';
import { FamilyMember } from '../types';
import {
  X, User, Edit, Trash2, PlusCircle, Users, Camera,
  MapPin, Calendar, Heart, BookOpen, GitBranch,
  ArrowUpFromLine, MessageCircle, Briefcase, GraduationCap,
  Star, Phone, FileText
} from 'lucide-react';

interface SidebarProps {
  node: FamilyMember | null;
  rootId: string | null;
  onClose: () => void;
  isEditorMode: boolean;
  onEdit: (node: FamilyMember) => void;
  onAddChild: (node: FamilyMember) => void;
  onAddSibling: (node: FamilyMember) => void;
  onAddParent: (node: FamilyMember) => void;
  onDelete: (node: FamilyMember) => void;
  onPhotoUpload: (nodeId: string, photoUrl: string) => void;
}

export default function Sidebar({
  node, rootId, onClose, isEditorMode,
  onEdit, onAddChild, onAddSibling, onAddParent, onDelete, onPhotoUpload
}: SidebarProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);

  if (!node) return null;

  const isRoot = node.id === rootId;
  const autoAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(node.name)}&background=1a1a2e&color=c9a84c&size=128`;
  const photoSrc = node.photoUrl || autoAvatar;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) onPhotoUpload(node.id, result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <aside
      className="w-80 h-full flex flex-col overflow-hidden shadow-2xl"
      style={{ background: '#0d0d14', borderLeft: '1px solid rgba(201,168,76,0.15)' }}
      data-testid="sidebar"
    >
      {/* Header */}
      <div className="relative px-5 pt-5 pb-20"
        style={{ background: 'linear-gradient(160deg, #0f1a2e 0%, #111928 60%, #12121a 100%)' }}>
        <div className="flex justify-between items-start">
          <div>
            <p style={{ color: 'rgba(201,168,76,0.5)', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>
              PROFIL ANGGOTA
            </p>
            <h2 className="font-serif mt-1 leading-tight" style={{ color: '#e8c97e', fontSize: '16px', fontWeight: 700 }}>
              {node.name}
            </h2>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors shrink-0"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
            data-testid="button-close-sidebar">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap mt-3">
          <Badge color={node.isAlive ? 'green' : 'red'}>
            <span className={`w-1.5 h-1.5 rounded-full ${node.isAlive ? 'bg-green-400' : 'bg-red-400'}`} />
            {node.isAlive ? 'Masih Hidup' : 'Meninggal'}
          </Badge>
          <Badge color="gold">
            <GitBranch className="w-2.5 h-2.5" />
            Gen ke-{node.generation}
          </Badge>
          {isRoot && <Badge color="amber">Leluhur Pertama</Badge>}
        </div>
      </div>

      {/* Photo card (overlaps header) */}
      <div className="px-5 -mt-14 mb-4 relative z-10">
        <div
          className={`relative w-full rounded-2xl overflow-hidden border group ${isEditorMode ? 'cursor-pointer' : ''}`}
          style={{ aspectRatio: '4/3', background: '#1a1a2e', borderColor: 'rgba(201,168,76,0.2)' }}
          onClick={() => isEditorMode && photoInputRef.current?.click()}
          data-testid="photo-avatar"
        >
          <img src={photoSrc} alt={node.name} className="w-full h-full object-cover" />
          {isEditorMode && (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(0,0,0,0.65)' }}>
              <Camera className="w-8 h-8 text-white mb-1" />
              <span className="text-white text-xs font-medium">Ganti Foto</span>
            </div>
          )}
        </div>
        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} data-testid="input-photo-upload" />
      </div>

      {/* WhatsApp button */}
      {node.whatsappLink && (
        <div className="px-5 mb-3">
          <a
            href={node.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
            style={{ background: '#25D366', color: '#fff' }}
            data-testid="link-wa-chat"
          >
            <MessageCircle className="w-4 h-4" />
            Chat via WhatsApp
          </a>
        </div>
      )}

      {/* Info rows */}
      <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-0.5">
        {node.spouseName && <InfoRow icon={<Heart className="w-3.5 h-3.5" style={{ color: '#c0516a' }} />} label="Pasangan" value={node.spouseName} />}
        {node.marriageYear && <InfoRow icon={<Calendar className="w-3.5 h-3.5" style={{ color: '#c9a84c' }} />} label="Tahun Menikah" value={node.marriageYear} />}
        {(node.birthYear || node.birthPlace) && (
          <InfoRow
            icon={<Calendar className="w-3.5 h-3.5" style={{ color: '#7eb8c9' }} />}
            label="Lahir"
            value={[node.birthPlace, node.birthYear].filter(Boolean).join(', ')}
          />
        )}
        {!node.isAlive && node.deathYear && (
          <InfoRow icon={<Calendar className="w-3.5 h-3.5" style={{ color: '#888' }} />} label="Meninggal" value={node.deathYear} />
        )}
        {node.occupation && <InfoRow icon={<Briefcase className="w-3.5 h-3.5" style={{ color: '#a78bfa' }} />} label="Pekerjaan" value={node.occupation} />}
        {node.education && <InfoRow icon={<GraduationCap className="w-3.5 h-3.5" style={{ color: '#60a5fa' }} />} label="Pendidikan" value={node.education} />}
        {node.religion && <InfoRow icon={<Star className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />} label="Agama" value={node.religion} />}
        {node.address && <InfoRow icon={<MapPin className="w-3.5 h-3.5" style={{ color: '#34d399' }} />} label="Alamat" value={node.address} />}
        {node.phone && <InfoRow icon={<Phone className="w-3.5 h-3.5" style={{ color: '#25D366' }} />} label="WhatsApp" value={node.phone} />}
        {node.branch && <InfoRow icon={<GitBranch className="w-3.5 h-3.5" style={{ color: '#c9a84c' }} />} label="Cabang" value={node.branch} />}

        {node.bio && (
          <TextBlock icon={<BookOpen className="w-3.5 h-3.5" />} title="Biografi" text={node.bio} />
        )}
        {node.notes && (
          <TextBlock icon={<FileText className="w-3.5 h-3.5" />} title="Catatan" text={node.notes} />
        )}

        {/* Editor actions */}
        {isEditorMode && (
          <div className="mt-5 pt-4 space-y-2" style={{ borderTop: '1px solid rgba(201,168,76,0.12)' }}>
            <p style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.45)', fontWeight: 700 }}
              className="mb-3">Aksi Editor</p>

            <EditorBtn icon={<ArrowUpFromLine className="w-3.5 h-3.5" />} label="Tambah Orang Tua" onClick={() => onAddParent(node)} color="ancestor" />
            <EditorBtn icon={<Edit className="w-3.5 h-3.5" />} label="Edit Profil" onClick={() => onEdit(node)} color="default" />
            <EditorBtn icon={<PlusCircle className="w-3.5 h-3.5" />} label="Tambah Anak" onClick={() => onAddChild(node)} color="default" />
            {node.generation > 0 && (
              <EditorBtn icon={<Users className="w-3.5 h-3.5" />} label="Tambah Saudara" onClick={() => onAddSibling(node)} color="default" />
            )}
            <EditorBtn icon={<Trash2 className="w-3.5 h-3.5" />} label="Hapus Node" onClick={() => onDelete(node)} color="destructive" />
          </div>
        )}
      </div>
    </aside>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: 'green' | 'red' | 'gold' | 'amber' }) {
  const styles = {
    green: { background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' },
    red: { background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' },
    gold: { background: 'rgba(201,168,76,0.12)', color: '#e8c97e', border: '1px solid rgba(201,168,76,0.25)' },
    amber: { background: 'rgba(245,158,11,0.12)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.25)' },
  };
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={styles[color]}>
      {children}
    </span>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: 'rgba(255,255,255,0.04)' }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p style={{ fontSize: '9px', color: 'rgba(139,134,128,0.8)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }} className="mb-0.5">{label}</p>
        <p style={{ fontSize: '13px', color: '#d4d0cc', lineHeight: 1.4 }} className="break-words">{value}</p>
      </div>
    </div>
  );
}

function TextBlock({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(201,168,76,0.08)' }}>
      <div className="flex items-center gap-1.5 mb-2">
        <span style={{ color: 'rgba(201,168,76,0.5)' }}>{icon}</span>
        <p style={{ fontSize: '9px', color: 'rgba(201,168,76,0.5)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>{title}</p>
      </div>
      <p style={{ fontSize: '12px', color: 'rgba(212,208,204,0.75)', lineHeight: 1.65, background: 'rgba(255,255,255,0.025)', borderRadius: '10px', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        {text}
      </p>
    </div>
  );
}

function EditorBtn({ icon, label, onClick, color }: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color: 'default' | 'destructive' | 'ancestor';
}) {
  const styles = {
    default: { color: '#d4d0cc', borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' },
    destructive: { color: '#f87171', borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)' },
    ancestor: { color: '#fcd34d', borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.06)' },
  };
  return (
    <button
      onClick={onClick}
      data-testid={`button-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 border"
      style={styles[color]}
    >
      {icon}
      {label}
    </button>
  );
}
