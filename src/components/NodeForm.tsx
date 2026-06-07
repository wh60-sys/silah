import React from 'react';
import { FamilyMember } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { MessageCircle, ExternalLink, User } from 'lucide-react';

interface NodeFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Partial<FamilyMember> | null;
  onSave: (data: Partial<FamilyMember>) => void;
  title: string;
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold tracking-widest uppercase text-amber-600 border-b border-amber-200/40 pb-1">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export default function NodeForm({ isOpen, onClose, initialData, onSave, title }: NodeFormProps) {
  const [formData, setFormData] = React.useState<Partial<FamilyMember>>({});

  React.useEffect(() => {
    if (isOpen) {
      setFormData(initialData || { isAlive: true });
    }
  }, [isOpen, initialData]);

  const handleChange = (field: keyof FamilyMember, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    handleChange('phone', cleaned);
    if (cleaned.length >= 8) {
      handleChange('whatsappLink', `https://wa.me/${cleaned}`);
    } else {
      handleChange('whatsappLink', '');
    }
    // Auto-set avatar if no photo
    if (!formData.photoUrl && formData.name) {
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random&color=fff&size=128`;
      handleChange('photoUrl', avatarUrl);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const waPreviewLink = formData.phone && formData.phone.length >= 8
    ? `https://wa.me/${formData.phone}`
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="font-serif text-lg">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-5 space-y-6">

          {/* Section 1: Identitas Dasar */}
          <FormSection title="Identitas Dasar">
            <Field label="Nama Lengkap *">
              <Input
                value={formData.name || ''}
                onChange={e => handleChange('name', e.target.value)}
                required
                placeholder="Masukkan nama lengkap"
                data-testid="input-name"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Jenis Kelamin">
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={formData.gender || ''}
                  onChange={e => handleChange('gender', e.target.value as any)}
                  data-testid="select-gender"
                >
                  <option value="">Pilih...</option>
                  <option value="laki-laki">Laki-laki ♂</option>
                  <option value="perempuan">Perempuan ♀</option>
                  <option value="tidak-diketahui">Tidak Diketahui</option>
                </select>
              </Field>
              <Field label="Tempat Lahir">
                <Input
                  value={formData.birthPlace || ''}
                  onChange={e => handleChange('birthPlace', e.target.value)}
                  placeholder="Kota, Provinsi"
                  data-testid="input-birth-place"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Tahun Lahir">
                <Input
                  value={formData.birthYear || ''}
                  onChange={e => handleChange('birthYear', e.target.value)}
                  placeholder="1980"
                  data-testid="input-birth-year"
                />
              </Field>
              <Field label="Tahun Meninggal">
                <Input
                  value={formData.deathYear || ''}
                  onChange={e => handleChange('deathYear', e.target.value)}
                  disabled={formData.isAlive}
                  placeholder="2020"
                  data-testid="input-death-year"
                />
              </Field>
            </div>

            <div className="flex items-center gap-3 border border-border rounded-xl px-4 py-3 bg-muted/30">
              <Switch
                id="isAlive"
                checked={formData.isAlive ?? true}
                onCheckedChange={(checked) => {
                  handleChange('isAlive', checked);
                  if (checked) handleChange('deathYear', '');
                }}
                data-testid="switch-is-alive"
              />
              <Label htmlFor="isAlive" className="cursor-pointer flex-1">
                <span className="font-medium">Masih Hidup</span>
              </Label>
              <span className={`w-2 h-2 rounded-full ${formData.isAlive ?? true ? 'bg-green-500' : 'bg-red-400'}`} />
            </div>
          </FormSection>

          {/* Section 2: Keluarga */}
          <FormSection title="Keluarga">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nama Pasangan">
                <Input
                  value={formData.spouseName || ''}
                  onChange={e => handleChange('spouseName', e.target.value)}
                  placeholder="Nama pasangan"
                  data-testid="input-spouse-name"
                />
              </Field>
              <Field label="Tahun Menikah">
                <Input
                  value={formData.marriageYear || ''}
                  onChange={e => handleChange('marriageYear', e.target.value)}
                  placeholder="2005"
                  data-testid="input-marriage-year"
                />
              </Field>
            </div>
            <Field label="Cabang Keluarga">
              <Input
                value={formData.branch || ''}
                onChange={e => handleChange('branch', e.target.value)}
                placeholder="mis. Cabang Hasan"
                data-testid="input-branch"
              />
            </Field>
          </FormSection>

          {/* Section 3: Kontak & WhatsApp */}
          <FormSection title="Kontak & WhatsApp">
            <Field label="Nomor WhatsApp (format: 628xxxxxxxx)">
              <div className="flex gap-2">
                <Input
                  value={formData.phone || ''}
                  onChange={e => handlePhoneChange(e.target.value)}
                  placeholder="6281234567890"
                  className="flex-1 font-mono"
                  data-testid="input-phone"
                />
                {waPreviewLink && (
                  <a
                    href={waPreviewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors"
                    data-testid="link-open-wa"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Buka WA</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              {waPreviewLink && (
                <p className="text-xs text-green-600 font-mono mt-1 truncate">{waPreviewLink}</p>
              )}
            </Field>
          </FormSection>

          {/* Section 4: Foto Profil */}
          <FormSection title="Foto Profil">
            <div className="flex gap-3 items-start">
              <div className="w-16 h-16 rounded-xl border border-border bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                {formData.photoUrl ? (
                  <img src={formData.photoUrl} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-7 h-7 text-muted-foreground/40" />
                )}
              </div>
              <Field label="URL Foto (opsional)">
                <Input
                  value={formData.photoUrl || ''}
                  onChange={e => handleChange('photoUrl', e.target.value)}
                  placeholder="https://... atau biarkan kosong untuk avatar otomatis"
                  data-testid="input-photo-url"
                />
              </Field>
            </div>
          </FormSection>

          {/* Section 5: Informasi Lainnya */}
          <FormSection title="Informasi Lainnya">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Pekerjaan">
                <Input
                  value={formData.occupation || ''}
                  onChange={e => handleChange('occupation', e.target.value)}
                  placeholder="Wirausaha, PNS..."
                  data-testid="input-occupation"
                />
              </Field>
              <Field label="Pendidikan">
                <Input
                  value={formData.education || ''}
                  onChange={e => handleChange('education', e.target.value)}
                  placeholder="S1, SMA..."
                  data-testid="input-education"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Agama">
                <Input
                  value={formData.religion || ''}
                  onChange={e => handleChange('religion', e.target.value)}
                  placeholder="Islam, Kristen..."
                  data-testid="input-religion"
                />
              </Field>
              <Field label="Alamat">
                <Input
                  value={formData.address || ''}
                  onChange={e => handleChange('address', e.target.value)}
                  placeholder="Kota, Provinsi"
                  data-testid="input-address"
                />
              </Field>
            </div>
            <Field label="Biografi">
              <Textarea
                value={formData.bio || ''}
                onChange={e => handleChange('bio', e.target.value)}
                rows={3}
                placeholder="Ceritakan riwayat hidup singkat..."
                data-testid="textarea-bio"
              />
            </Field>
            <Field label="Catatan Pribadi">
              <Textarea
                value={formData.notes || ''}
                onChange={e => handleChange('notes', e.target.value)}
                rows={2}
                placeholder="Catatan pribadi, kisah menarik..."
                data-testid="textarea-notes"
              />
            </Field>
          </FormSection>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">Batal</Button>
            <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white" data-testid="button-save">
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
