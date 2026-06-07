import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { FamilyMember } from '../types';

interface SearchBarProps {
  data: FamilyMember | null;
  onSelect: (node: FamilyMember) => void;
  dark?: boolean;
}

export default function SearchBar({ data, onSelect, dark }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FamilyMember[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim() || !data) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    const matches: FamilyMember[] = [];
    const searchTree = (node: FamilyMember) => {
      const nameMatch = node.name.toLowerCase().includes(query.toLowerCase());
      const spouseMatch = node.spouseName?.toLowerCase().includes(query.toLowerCase());
      if (nameMatch || spouseMatch) matches.push(node);
      if (node.children) node.children.forEach(searchTree);
    };
    searchTree(data);
    setResults(matches.slice(0, 10));
    setIsOpen(true);
  }, [query, data]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-64 md:w-80" data-testid="search-bar">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Search className={`h-4 w-4 ${dark ? 'text-white/40' : 'text-muted-foreground'}`} />
      </div>
      <input
        type="text"
        placeholder="Cari anggota keluarga..."
        className={`search-input w-full h-9 pl-9 pr-4 rounded-xl text-sm outline-none transition-all duration-200
          ${dark
            ? 'bg-white/8 border border-white/14 text-white/90 placeholder:text-white/40 focus:bg-white/13 focus:border-white/28'
            : 'bg-background border border-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary'
          }`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (results.length > 0) setIsOpen(true); }}
        data-testid="input-search"
        style={dark ? { background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.14)' } : undefined}
      />

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border shadow-lg rounded-xl z-50 max-h-72 overflow-y-auto divide-y divide-border">
          {results.map(node => (
            <div
              key={node.id}
              className="px-3 py-2.5 hover:bg-accent cursor-pointer flex items-center gap-2.5"
              onClick={() => { onSelect(node); setIsOpen(false); setQuery(''); }}
              data-testid={`search-result-${node.id}`}
            >
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 text-xs font-bold text-muted-foreground">
                {node.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{node.name}</div>
                <div className="text-xs text-muted-foreground flex gap-2">
                  <span>Generasi {node.generation}</span>
                  {node.spouseName && <span>· {node.spouseName}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && query.trim() && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border shadow-lg rounded-xl z-50 p-4 text-center text-sm text-muted-foreground">
          Tidak ditemukan.
        </div>
      )}
    </div>
  );
}
