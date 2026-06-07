import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, FileJson, Image, Upload, AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter } from 'lucide-react';

interface ToolbarProps {
  layoutMode: 'horizontal' | 'vertical';
  setLayoutMode: (mode: 'horizontal' | 'vertical') => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onExportJSON: () => void;
  onExportPNG: () => void;
  onImportClick: () => void;
}

export default function Toolbar({
  layoutMode, setLayoutMode,
  onZoomIn, onZoomOut, onResetZoom,
  onExportJSON, onExportPNG, onImportClick
}: ToolbarProps) {
  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-2xl px-3 py-2 flex items-center gap-0.5 md:gap-1 z-10"
      style={{
        background: 'rgba(18,18,26,0.92)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(201,168,76,0.18)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)',
      }}
      data-testid="toolbar"
    >
      <ToolBtn icon={<ZoomOut className="w-4 h-4" />} label="Perkecil" onClick={onZoomOut} />
      <ToolBtn icon={<Maximize2 className="w-4 h-4" />} label="Reset" onClick={onResetZoom} />
      <ToolBtn icon={<ZoomIn className="w-4 h-4" />} label="Perbesar" onClick={onZoomIn} />

      <Divider />

      <button
        onClick={() => setLayoutMode(layoutMode === 'horizontal' ? 'vertical' : 'horizontal')}
        title="Ubah tata letak"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150"
        style={{ color: 'rgba(201,168,76,0.8)' }}
        data-testid="button-layout-toggle"
      >
        {layoutMode === 'horizontal'
          ? <><AlignVerticalDistributeCenter className="w-3.5 h-3.5" /><span className="hidden sm:inline">Vertikal</span></>
          : <><AlignHorizontalDistributeCenter className="w-3.5 h-3.5" /><span className="hidden sm:inline">Horizontal</span></>
        }
      </button>

      <Divider />

      <ToolBtn icon={<FileJson className="w-4 h-4" />} label="Ekspor JSON" onClick={onExportJSON} />
      <ToolBtn icon={<Image className="w-4 h-4" />} label="Ekspor PNG" onClick={onExportPNG} />
      <ToolBtn icon={<Upload className="w-4 h-4" />} label="Impor" onClick={onImportClick} />
    </div>
  );
}

function ToolBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      title={label}
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-150 active:scale-95"
      style={{ color: 'rgba(240,237,232,0.5)' }}
      data-testid={`button-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {icon}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 mx-1 shrink-0" style={{ background: 'rgba(201,168,76,0.2)' }} />;
}
