import React from 'react';
import { TreeFilters } from '../types';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { SlidersHorizontal } from 'lucide-react';

interface FilterPanelProps {
  filters: TreeFilters;
  setFilters: React.Dispatch<React.SetStateAction<TreeFilters>>;
  maxGeneration: number;
  availableBranches: string[];
  dark?: boolean;
}

export default function FilterPanel({ filters, setFilters, maxGeneration, availableBranches, dark }: FilterPanelProps) {
  const toggleGeneration = (gen: number) => {
    setFilters(prev => ({
      ...prev,
      generations: prev.generations.includes(gen)
        ? prev.generations.filter(g => g !== gen)
        : [...prev.generations, gen]
    }));
  };

  const toggleBranch = (branch: string) => {
    setFilters(prev => ({
      ...prev,
      branches: prev.branches.includes(branch)
        ? prev.branches.filter(b => b !== branch)
        : [...prev.branches, branch]
    }));
  };

  const resetFilters = () => setFilters({ generations: [], branches: [] });

  const activeCount = filters.generations.length + filters.branches.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150
            ${dark
              ? 'bg-white/10 border border-white/15 text-white/80 hover:bg-white/18 hover:text-white'
              : 'bg-secondary border border-border text-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          data-testid="button-filter"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filter</span>
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center shadow">
              {activeCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Filter Silsilah</h4>
            {activeCount > 0 && (
              <button onClick={resetFilters} className="text-xs text-muted-foreground hover:text-destructive transition-colors" data-testid="button-reset-filter">
                Reset
              </button>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Generasi</Label>
            <div className="flex flex-col gap-2">
              {Array.from({ length: maxGeneration + 1 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Label htmlFor={`gen-${i}`} className="text-sm cursor-pointer">Generasi {i}</Label>
                  <Switch
                    id={`gen-${i}`}
                    checked={filters.generations.length === 0 || filters.generations.includes(i)}
                    onCheckedChange={() => toggleGeneration(i)}
                    data-testid={`switch-gen-${i}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {availableBranches.length > 0 && (
            <div className="space-y-2">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Cabang Keluarga</Label>
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                {availableBranches.map(branch => (
                  <div key={branch} className="flex items-center justify-between">
                    <Label htmlFor={`branch-${branch}`} className="text-sm truncate cursor-pointer pr-2" title={branch}>{branch}</Label>
                    <Switch
                      id={`branch-${branch}`}
                      checked={filters.branches.length === 0 || filters.branches.includes(branch)}
                      onCheckedChange={() => toggleBranch(branch)}
                      data-testid={`switch-branch-${branch}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
