import React, { useState, useRef, useMemo } from 'react';
import FamilyTree, { FamilyTreeRef } from '../components/FamilyTree';
import Sidebar from '../components/Sidebar';
import SearchBar from '../components/SearchBar';
import Toolbar from '../components/Toolbar';
import NodeForm from '../components/NodeForm';
import FilterPanel from '../components/FilterPanel';
import { useFamilyTree } from '../hooks/useFamilyTree';
import { LayoutMode, FamilyMember, TreeFilters } from '../types';
import { exportJSON, exportPNG } from '../utils/exportUtils';
import { importJSON } from '../utils/importUtils';
import { toast } from '../hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '../components/ui/alert-dialog';
import { Switch } from '../components/ui/switch';
import { GitBranch, Pencil, MessageCircle } from 'lucide-react';

type FormMode = 'edit' | 'add_child' | 'add_sibling' | 'add_parent';

export default function Home() {
  const {
    data, setData, isEditorMode, setIsEditorMode,
    selectedNode, setSelectedNode,
    updateNode, addNode, addParent, deleteNode
  } = useFamilyTree();

  const treeRef = useRef<FamilyTreeRef>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('horizontal');
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('edit');
  const [nodeToDelete, setNodeToDelete] = useState<FamilyMember | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filters, setFilters] = useState<TreeFilters>({ generations: [], branches: [] });

  const { availableBranches, maxGen, totalNodes, aliveCount, waCount } = useMemo(() => {
    const branches = new Set<string>();
    let max = 0, total = 0, alive = 0, wa = 0;
    const traverse = (node: FamilyMember) => {
      if (node.branch) branches.add(node.branch);
      if (node.generation > max) max = node.generation;
      total++;
      if (node.isAlive) alive++;
      if (node.whatsappLink) wa++;
      if (node.children) node.children.forEach(traverse);
    };
    if (data) traverse(data);
    return { availableBranches: Array.from(branches), maxGen: max, totalNodes: total, aliveCount: alive, waCount: wa };
  }, [data]);

  const filteredData = useMemo(() => {
    if (!data) return null;
    if (filters.generations.length === 0 && filters.branches.length === 0) return data;
    const filterNode = (node: FamilyMember): FamilyMember | null => {
      const matchGen = filters.generations.length === 0 || filters.generations.includes(node.generation);
      const matchBranch = filters.branches.length === 0 || (node.branch != null && filters.branches.includes(node.branch));
      const isMatch = matchGen && matchBranch;
      const filteredChildren: FamilyMember[] = [];
      if (node.children) node.children.forEach(c => { const fc = filterNode(c); if (fc) filteredChildren.push(fc); });
      if (isMatch || filteredChildren.length > 0) {
        return { ...node, name: isMatch ? node.name : `${node.name} (Disembunyikan)`, children: filteredChildren.length > 0 ? filteredChildren : undefined };
      }
      return null;
    };
    return filterNode(data);
  }, [data, filters]);

  const handlePhotoUpload = (nodeId: string, photoUrl: string) => {
    updateNode(nodeId, { photoUrl });
    setSelectedNode(prev => prev?.id === nodeId ? { ...prev, photoUrl } : prev);
    toast({ title: "Foto diperbarui", description: "Foto profil berhasil disimpan." });
  };

  const handleStartBackgroundMusic = async () => {
    if (!audioRef.current) return;

    try {
      audioRef.current.volume = 0.35;
      await audioRef.current.play();
    } catch (error) {
      console.warn('Gagal memutar audio:', error);
      toast({ title: 'Gagal memutar musik', description: 'Silakan klik tombol lagi untuk memulai musik.', variant: 'destructive' });
      return;
    }

    setShowWelcome(false);
  };

  const handleSaveForm = (formData: Partial<FamilyMember>) => {
    if (formMode === 'edit' && selectedNode) {
      updateNode(selectedNode.id, formData);
      setSelectedNode({ ...selectedNode, ...formData });

    } else if (formMode === 'add_parent' && selectedNode) {
      addParent(selectedNode.id, formData);
      setSelectedNode(null);
      toast({ title: "Berhasil", description: `Leluhur "${formData.name}" ditambahkan di atas ${selectedNode.name}.` });

    } else if (formMode === 'add_child' && selectedNode) {
      const newNode: FamilyMember = {
        id: `node-${Date.now()}`,
        name: formData.name || 'Nama Baru',
        isAlive: formData.isAlive ?? true,
        generation: selectedNode.generation + 1,
        branch: formData.branch || selectedNode.branch,
        ...formData
      };
      addNode(selectedNode.id, newNode);

    } else if (formMode === 'add_sibling' && selectedNode && data) {
      let parentId: string | null = null;
      const findParent = (node: FamilyMember, targetId: string) => {
        if (node.children?.some(c => c.id === targetId)) { parentId = node.id; return; }
        node.children?.forEach(c => findParent(c, targetId));
      };
      findParent(data, selectedNode.id);
      if (parentId) {
        const newNode: FamilyMember = {
          id: `node-${Date.now()}`,
          name: formData.name || 'Nama Baru',
          isAlive: formData.isAlive ?? true,
          generation: selectedNode.generation,
          branch: formData.branch || selectedNode.branch,
          ...formData
        };
        addNode(parentId, newNode);
      } else {
        toast({ title: "Gagal", description: "Tidak dapat menemukan parent node.", variant: "destructive" });
      }
    }
    setFormOpen(false);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const newData = await importJSON(file);
      setData(newData);
      toast({ title: "Berhasil", description: "Data berhasil diimpor." });
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formTitle: Record<FormMode, string> = {
    edit: 'Edit Anggota Keluarga',
    add_child: 'Tambah Anak',
    add_sibling: 'Tambah Saudara',
    add_parent: selectedNode?.id === data?.id
      ? `Tambah Orang Tua / Leluhur di atas ${selectedNode?.name || 'Akar'}`
      : `Tambah Orang Tua dari ${selectedNode?.name || ''}`,
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground font-sans">
      <audio ref={audioRef} src="/ddd.mp3" loop preload="auto" />
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-5">
          <div className="w-full max-w-lg rounded-3xl border border-amber-200/20 bg-slate-950/95 p-8 text-center shadow-2xl backdrop-blur-xl">
            <p className="text-amber-200 text-sm uppercase tracking-[0.3em] mb-4">Selamat Datang</p>
            <h2 className="text-3xl font-semibold text-white mb-3">Sejarah Keluarga</h2>
            <p className="text-sm leading-7 text-slate-300 mb-8">
              Selamat datang di catatan silsilah keluarga. Musik latar akan mulai setelah Anda menutup popup ini.
            </p>
            <button
              type="button"
              onClick={handleStartBackgroundMusic}
              className="inline-flex items-center justify-center rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
            >
              Mulai Musik
            </button>
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col relative min-w-0">

        {/* Navbar */}
        <header className="navbar-premium shrink-0 z-20" data-testid="navbar">
          <div className="flex items-center justify-between px-5 py-3 gap-4">

            {/* Brand */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg shrink-0"
                style={{ background: 'linear-gradient(135deg, #c9a84c, #8a6520)' }}>
                <GitBranch className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-serif font-bold leading-tight tracking-wide" style={{ fontSize: '15px', color: '#e8c97e' }}
                  data-testid="app-title">Silsilah Keluarga</h1>
                <p style={{ fontSize: '9px', color: 'rgba(201,168,76,0.45)', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
                  Catatan Sejarah Keturunan
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-sm hidden md:block">
              <SearchBar data={data} onSelect={setSelectedNode} dark />
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-3 shrink-0">
              <FilterPanel filters={filters} setFilters={setFilters} maxGeneration={maxGen} availableBranches={availableBranches} dark />
              <div className="w-px h-6 hidden sm:block" style={{ background: 'rgba(201,168,76,0.15)' }} />
              <div className="flex items-center gap-2">
                <Pencil className="w-3.5 h-3.5 hidden sm:block" style={{ color: 'rgba(201,168,76,0.5)' }} />
                <span className="text-xs font-medium hidden sm:block" style={{ color: 'rgba(201,168,76,0.6)' }}>Mode Edit</span>
                <Switch
                  id="editor-mode"
                  checked={isEditorMode}
                  onCheckedChange={setIsEditorMode}
                  data-testid="switch-editor-mode"
                  className="data-[state=checked]:bg-amber-600"
                />
              </div>
            </div>
          </div>

          {/* Stats sub-bar */}
          <div className="flex items-center gap-5 px-5 pb-3 flex-wrap">
            <StatChip label="Total" value={totalNodes} />
            <Sep />
            <StatChip label="Hidup" value={aliveCount} dot="green" />
            <Sep />
            <StatChip label="Meninggal" value={totalNodes - aliveCount} dot="red" />
            <Sep />
            <StatChip label="Generasi" value={maxGen + 1} />
            <Sep />
            <StatChip label="Cabang" value={availableBranches.length} />
            {waCount > 0 && (
              <>
                <Sep />
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-3 h-3" style={{ color: '#25D366' }} />
                  <span style={{ fontSize: '11px', color: 'rgba(37,211,102,0.7)', fontWeight: 500 }}>WA</span>
                  <span style={{ fontSize: '11px', color: 'rgba(37,211,102,0.9)', fontWeight: 700 }}>{waCount}</span>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Canvas */}
        <main className="flex-1 relative canvas-bg overflow-hidden">
          {filteredData ? (
            <FamilyTree
              ref={treeRef}
              data={filteredData}
              layoutMode={layoutMode}
              onNodeClick={(node) => setSelectedNode(node)}
              selectedNodeId={selectedNode?.id || null}
            />
          ) : (
            <div className="flex h-full items-center justify-center" style={{ color: 'rgba(201,168,76,0.4)' }}>
              Tidak ada data silsilah.
            </div>
          )}
          <Toolbar
            layoutMode={layoutMode}
            setLayoutMode={setLayoutMode}
            onZoomIn={() => treeRef.current?.zoomIn()}
            onZoomOut={() => treeRef.current?.zoomOut()}
            onResetZoom={() => treeRef.current?.resetZoom()}
            onExportJSON={() => data && exportJSON(data)}
            onExportPNG={() => exportPNG(document.querySelector('svg'))}
            onImportClick={() => fileInputRef.current?.click()}
          />
        </main>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 right-0 z-50 md:relative md:flex shrink-0 transition-transform duration-300 ${selectedNode ? 'translate-x-0' : 'translate-x-full md:translate-x-0 md:w-0'}`}>
        {selectedNode && (
          <Sidebar
            node={selectedNode}
            rootId={data?.id || null}
            onClose={() => setSelectedNode(null)}
            isEditorMode={isEditorMode}
            onEdit={() => { setFormMode('edit'); setFormOpen(true); }}
            onAddChild={() => { setFormMode('add_child'); setFormOpen(true); }}
            onAddSibling={() => { setFormMode('add_sibling'); setFormOpen(true); }}
            onAddParent={() => { setFormMode('add_parent'); setFormOpen(true); }}
            onDelete={(n) => setNodeToDelete(n)}
            onPhotoUpload={handlePhotoUpload}
          />
        )}
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportFile} data-testid="input-import-file" />

      <NodeForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        initialData={formMode === 'edit' ? selectedNode : { isAlive: formMode === 'add_child', branch: selectedNode?.branch }}
        onSave={handleSaveForm}
        title={formTitle[formMode]}
      />

      <AlertDialog open={!!nodeToDelete} onOpenChange={() => setNodeToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{nodeToDelete?.name}</strong> beserta seluruh keturunannya? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (nodeToDelete) deleteNode(nodeToDelete.id);
                setNodeToDelete(null);
                setSelectedNode(null);
                toast({ title: "Terhapus", description: "Node berhasil dihapus." });
              }}
              data-testid="button-confirm-delete"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatChip({ label, value, dot }: { label: string; value: number; dot?: 'green' | 'red' }) {
  return (
    <div className="flex items-center gap-1.5">
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot === 'green' ? 'bg-green-400' : 'bg-red-400'}`} />}
      <span style={{ fontSize: '11px', color: 'rgba(201,168,76,0.45)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '11px', color: 'rgba(201,168,76,0.85)', fontWeight: 700 }} className="tabular-nums">{value}</span>
    </div>
  );
}

function Sep() {
  return <div className="w-px h-3 hidden sm:block" style={{ background: 'rgba(201,168,76,0.12)' }} />;
}
