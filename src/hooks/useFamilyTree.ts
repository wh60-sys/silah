import { useState, useEffect, useCallback } from 'react';
import { FamilyMember } from '../types';
import { sampleData } from '../data/sampleData';
import { toast } from './use-toast';

const STORAGE_KEY = 'pohon_keluarga_data';

function incrementGenerations(node: FamilyMember): FamilyMember {
  return {
    ...node,
    generation: node.generation + 1,
    children: node.children?.map(incrementGenerations)
  };
}

export function useFamilyTree() {
  const [data, setData] = useState<FamilyMember | null>(null);
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [selectedNode, setSelectedNode] = useState<FamilyMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch {
        setData(sampleData);
      }
    } else {
      setData(sampleData);
    }
  }, []);

  useEffect(() => {
    if (!data) return;
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (isEditorMode) {
        toast({ title: "Tersimpan otomatis", description: "Perubahan silsilah berhasil disimpan." });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [data, isEditorMode]);

  const updateNode = useCallback((id: string, updates: Partial<FamilyMember>) => {
    setData(prev => {
      if (!prev) return prev;
      const clone: FamilyMember = JSON.parse(JSON.stringify(prev));
      let found = false;
      const searchAndUpdate = (node: FamilyMember) => {
        if (node.id === id) {
          Object.assign(node, updates);
          found = true;
          return;
        }
        if (node.children) {
          for (const child of node.children) {
            searchAndUpdate(child);
            if (found) return;
          }
        }
      };
      searchAndUpdate(clone);
      return clone;
    });
  }, []);

  const addNode = useCallback((parentId: string, newNode: FamilyMember) => {
    setData(prev => {
      if (!prev) return prev;
      const clone: FamilyMember = JSON.parse(JSON.stringify(prev));
      let found = false;
      const searchAndAdd = (node: FamilyMember) => {
        if (node.id === parentId) {
          if (!node.children) node.children = [];
          node.children.push(newNode);
          found = true;
          return;
        }
        if (node.children) {
          for (const child of node.children) {
            searchAndAdd(child);
            if (found) return;
          }
        }
      };
      searchAndAdd(clone);
      return clone;
    });
  }, []);

  /**
   * addParent: wraps the current root with a new ancestor node.
   * The existing tree is preserved as a child of the new ancestor.
   * All existing generations are incremented by 1.
   * Use targetNodeId to insert a parent above a specific non-root node
   * (inserts new node between that node's parent and itself).
   */
  const addParent = useCallback((targetNodeId: string, parentData: Partial<FamilyMember>) => {
    setData(prev => {
      if (!prev) return prev;
      const clone: FamilyMember = JSON.parse(JSON.stringify(prev));

      // Case 1: target is root — new root wraps everything
      if (clone.id === targetNodeId) {
        const updatedOldRoot = incrementGenerations(clone);
        const newRoot: FamilyMember = {
          id: `node-${Date.now()}`,
          name: parentData.name || 'Leluhur Baru',
          isAlive: parentData.isAlive ?? false,
          generation: 0,
          branch: parentData.branch,
          spouseName: parentData.spouseName,
          birthYear: parentData.birthYear,
          deathYear: parentData.deathYear,
          gender: parentData.gender,
          bio: parentData.bio,
          address: parentData.address,
          photoUrl: parentData.photoUrl,
          children: [updatedOldRoot]
        };
        return newRoot;
      }

      // Case 2: target is non-root — insert new node between parent and target
      let done = false;
      const insertAbove = (node: FamilyMember) => {
        if (!node.children) return;
        const idx = node.children.findIndex(c => c.id === targetNodeId);
        if (idx !== -1) {
          const targetChild = node.children[idx];
          // Bump all descendants of target by 1
          const bumpedTarget = incrementGenerations(targetChild);
          const newParentNode: FamilyMember = {
            id: `node-${Date.now()}`,
            name: parentData.name || 'Leluhur Baru',
            isAlive: parentData.isAlive ?? false,
            generation: targetChild.generation, // takes the original generation slot
            branch: parentData.branch || targetChild.branch,
            spouseName: parentData.spouseName,
            birthYear: parentData.birthYear,
            deathYear: parentData.deathYear,
            gender: parentData.gender,
            bio: parentData.bio,
            address: parentData.address,
            photoUrl: parentData.photoUrl,
            children: [bumpedTarget]
          };
          node.children[idx] = newParentNode;
          done = true;
          return;
        }
        for (const child of node.children) {
          insertAbove(child);
          if (done) return;
        }
      };
      insertAbove(clone);
      return clone;
    });
  }, []);

  const deleteNode = useCallback((id: string) => {
    setData(prev => {
      if (!prev) return prev;
      if (prev.id === id) return null;
      const clone: FamilyMember = JSON.parse(JSON.stringify(prev));
      let found = false;
      const searchAndDelete = (node: FamilyMember) => {
        if (node.children) {
          const index = node.children.findIndex(c => c.id === id);
          if (index !== -1) {
            node.children.splice(index, 1);
            found = true;
            return;
          }
          for (const child of node.children) {
            searchAndDelete(child);
            if (found) return;
          }
        }
      };
      searchAndDelete(clone);
      return clone;
    });
  }, []);

  return {
    data,
    setData,
    isEditorMode,
    setIsEditorMode,
    selectedNode,
    setSelectedNode,
    searchQuery,
    setSearchQuery,
    updateNode,
    addNode,
    addParent,
    deleteNode
  };
}
