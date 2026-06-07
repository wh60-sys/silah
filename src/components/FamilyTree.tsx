import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as d3 from 'd3';
import { FamilyMember, LayoutMode } from '../types';

export interface FamilyTreeRef {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

interface FamilyTreeProps {
  data: FamilyMember | null;
  layoutMode: LayoutMode;
  onNodeClick: (node: FamilyMember) => void;
  selectedNodeId: string | null;
}

interface FlatNode {
  id: string;
  name: string;
  spouseName?: string;
  isAlive: boolean;
  x: number;
  y: number;
}

// Gold accent color
const GOLD = '#c9a84c';
const GOLD_LIGHT = '#e8c97e';
const CARD_BG = '#12121a';
const CARD_BG_DEAD = '#0e0e16';
const CARD_BORDER = 'rgba(201,168,76,0.22)';
const CARD_BORDER_SELECTED = '#c9a84c';
const TEXT_PRIMARY = '#f0ede8';
const TEXT_MUTED = '#8b8680';

const FamilyTree = forwardRef<FamilyTreeRef, FamilyTreeProps>(({ data, layoutMode, onNodeClick, selectedNodeId }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomBehavior = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      if (svgRef.current && zoomBehavior.current) {
        d3.select(svgRef.current).transition().duration(300).call(zoomBehavior.current.scaleBy, 1.2);
      }
    },
    zoomOut: () => {
      if (svgRef.current && zoomBehavior.current) {
        d3.select(svgRef.current).transition().duration(300).call(zoomBehavior.current.scaleBy, 0.8);
      }
    },
    resetZoom: () => {
      if (svgRef.current && zoomBehavior.current && containerRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight || 800;
        const initialTransform = layoutMode === 'horizontal'
          ? d3.zoomIdentity.translate(120, h / 2).scale(0.7)
          : d3.zoomIdentity.translate(w / 2, 120).scale(0.7);
        d3.select(svgRef.current).transition().duration(750).call(zoomBehavior.current.transform, initialTransform);
      }
    }
  }));

  useEffect(() => {
    if (!data || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 800;

    d3.select(containerRef.current).selectAll('*').remove();

    const svg = d3.select(containerRef.current)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', [0, 0, width, height].join(' '))
      .style('background-color', 'transparent')
      .style('cursor', 'grab')
      .on('mousedown', function () { d3.select(this).style('cursor', 'grabbing'); })
      .on('mouseup', function () { d3.select(this).style('cursor', 'grab'); });

    svgRef.current = svg.node();

    const defs = svg.append('defs');

    // Gold glow filter for selected/alive
    const goldGlow = defs.append('filter').attr('id', 'glow-gold').attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    goldGlow.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMergeGold = goldGlow.append('feMerge');
    feMergeGold.append('feMergeNode').attr('in', 'coloredBlur');
    feMergeGold.append('feMergeNode').attr('in', 'SourceGraphic');

    // Green glow
    const greenGlow = defs.append('filter').attr('id', 'glow-green').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    greenGlow.append('feGaussianBlur').attr('stdDeviation', '2').attr('result', 'coloredBlur');
    const feMergeGreen = greenGlow.append('feMerge');
    feMergeGreen.append('feMergeNode').attr('in', 'coloredBlur');
    feMergeGreen.append('feMergeNode').attr('in', 'SourceGraphic');

    // Drop shadow
    const shadow = defs.append('filter').attr('id', 'shadow').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    shadow.append('feDropShadow').attr('dx', '0').attr('dy', '4').attr('stdDeviation', '8').attr('flood-color', 'rgba(0,0,0,0.6)');

    // Selected glow shadow
    const shadowSel = defs.append('filter').attr('id', 'shadow-selected').attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    shadowSel.append('feDropShadow').attr('dx', '0').attr('dy', '0').attr('stdDeviation', '12').attr('flood-color', 'rgba(201,168,76,0.5)');

    // Gold gradient for links
    const goldGrad = defs.append('linearGradient').attr('id', 'link-gold').attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%');
    goldGrad.append('stop').attr('offset', '0%').attr('stop-color', GOLD).attr('stop-opacity', '0.3');
    goldGrad.append('stop').attr('offset', '100%').attr('stop-color', GOLD_LIGHT).attr('stop-opacity', '0.5');

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 3])
      .on('zoom', (event) => { g.attr('transform', event.transform); });

    zoomBehavior.current = zoom;
    svg.call(zoom as any);

    const initialTransform = layoutMode === 'horizontal'
      ? d3.zoomIdentity.translate(120, height / 2).scale(0.7)
      : d3.zoomIdentity.translate(width / 2, 120).scale(0.7);
    svg.call(zoom.transform as any, initialTransform);

    const root = d3.hierarchy<FamilyMember>(data);

    const nodeW = 180;
    const nodeH = 220;
    const photoR = 32;

    const treeLayout = layoutMode === 'horizontal'
      ? d3.tree<FamilyMember>().nodeSize([nodeH + 30, nodeW + 80])
      : d3.tree<FamilyMember>().nodeSize([nodeW + 60, nodeH + 60]);

    treeLayout(root);

    const nodes = root.descendants();
    const links = root.links();

    // Build name map for cross-branch marriage lines
    const nameToNodes: Map<string, FlatNode[]> = new Map();
    nodes.forEach(d => {
      const tx = layoutMode === 'horizontal' ? d.y : d.x;
      const ty = layoutMode === 'horizontal' ? d.x : d.y;
      const flat: FlatNode = { id: d.data.id, name: d.data.name, spouseName: d.data.spouseName, isAlive: d.data.isAlive, x: tx, y: ty };
      const existing = nameToNodes.get(d.data.name) || [];
      existing.push(flat);
      nameToNodes.set(d.data.name, existing);
    });

    const crossLinks: Array<{ ax: number; ay: number; bx: number; by: number }> = [];
    const drawnPairs = new Set<string>();
    nodes.forEach(d => {
      const spouseName = d.data.spouseName;
      if (!spouseName) return;
      const spouseNodes = nameToNodes.get(spouseName);
      if (!spouseNodes || spouseNodes.length === 0) return;
      const ax = layoutMode === 'horizontal' ? d.y : d.x;
      const ay = layoutMode === 'horizontal' ? d.x : d.y;
      spouseNodes.forEach(sn => {
        if (sn.id === d.data.id) return;
        const pairKey = [d.data.id, sn.id].sort().join('--');
        if (drawnPairs.has(pairKey)) return;
        drawnPairs.add(pairKey);
        const isChildOfD = d.children?.some(c => c.data.id === sn.id);
        const isParentOfD = d.parent?.data.id === sn.id;
        if (isChildOfD || isParentOfD) return;
        crossLinks.push({ ax, ay, bx: sn.x, by: sn.y });
      });
    });

    const linkGenerator = layoutMode === 'horizontal'
      ? d3.linkHorizontal<any, any>().x(d => d.y).y(d => d.x)
      : d3.linkVertical<any, any>().x(d => d.x).y(d => d.y);

    // Cross-branch marriage lines
    const crossLinkGroup = g.append('g').attr('class', 'cross-links');
    crossLinks.forEach(cl => {
      const midX = (cl.ax + cl.bx) / 2;
      const midY = (cl.ay + cl.by) / 2;
      const path = layoutMode === 'horizontal'
        ? `M ${cl.ax} ${cl.ay} C ${midX} ${cl.ay} ${midX} ${cl.by} ${cl.bx} ${cl.by}`
        : `M ${cl.ax} ${cl.ay} C ${cl.ax} ${midY} ${cl.bx} ${midY} ${cl.bx} ${cl.by}`;
      crossLinkGroup.append('path').attr('d', path).attr('fill', 'none')
        .attr('stroke', '#e0428a').attr('stroke-width', 1.5).attr('stroke-dasharray', '6 4').attr('opacity', 0.6);
      crossLinkGroup.append('text').attr('x', midX).attr('y', midY)
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('font-size', '12px').text('♥').attr('fill', '#e0428a').attr('opacity', 0.8);
    });

    // Tree links
    g.append('g').attr('class', 'links')
      .selectAll('.link').data(links).join('path')
      .attr('class', 'link').attr('fill', 'none')
      .attr('stroke', GOLD).attr('stroke-width', 1.5).attr('opacity', 0.35)
      .attr('d', linkGenerator as any);

    // Clip paths for circular photos
    nodes.forEach(d => {
      defs.append('clipPath').attr('id', `clip-${d.data.id}`)
        .append('circle').attr('cx', 0).attr('cy', 0).attr('r', photoR);
    });

    // Nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const nodeEnter = nodeGroup.selectAll('.node').data(nodes).enter()
      .append('g').attr('class', 'node cursor-pointer')
      .attr('transform', d => layoutMode === 'horizontal' ? `translate(${d.y},${d.x})` : `translate(${d.x},${d.y})`)
      .attr('filter', d => d.data.id === selectedNodeId ? 'url(#shadow-selected)' : 'url(#shadow)')
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeClick(d.data);
      });

    // Card background
    nodeEnter.append('rect')
      .attr('width', nodeW).attr('height', nodeH)
      .attr('x', -nodeW / 2).attr('y', -nodeH / 2)
      .attr('rx', 14).attr('ry', 14)
      .attr('fill', d => d.data.isAlive ? CARD_BG : CARD_BG_DEAD)
      .attr('stroke', d => d.data.id === selectedNodeId ? CARD_BORDER_SELECTED : CARD_BORDER)
      .attr('stroke-width', d => d.data.id === selectedNodeId ? 1.5 : 1);

    // Deceased overlay
    nodeEnter.each(function(d) {
      if (!d.data.isAlive) {
        d3.select(this).append('rect')
          .attr('width', nodeW).attr('height', nodeH)
          .attr('x', -nodeW / 2).attr('y', -nodeH / 2)
          .attr('rx', 14).attr('ry', 14)
          .attr('fill', 'rgba(0,0,0,0.15)');
      }
    });

    // Photo area (top center)
    const photoY = -nodeH / 2 + photoR + 16;

    // Photo background circle
    nodeEnter.append('circle')
      .attr('cx', 0).attr('cy', photoY)
      .attr('r', photoR + 4)
      .attr('fill', 'rgba(201,168,76,0.08)')
      .attr('stroke', d => d.data.isAlive ? GOLD : '#555')
      .attr('stroke-width', 2);

    // Photo or avatar
    nodeEnter.each(function(d) {
      const g2 = d3.select(this);
      const photoUrl = d.data.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.data.name)}&background=1a1a2e&color=c9a84c&size=128`;

      g2.append('image')
        .attr('href', photoUrl)
        .attr('x', -photoR).attr('y', photoY - photoR)
        .attr('width', photoR * 2).attr('height', photoR * 2)
        .attr('clip-path', `url(#clip-${d.data.id})`)
        .attr('preserveAspectRatio', 'xMidYMid slice');

      // Gender badge
      const genderIcon = d.data.gender === 'laki-laki' ? '♂' : d.data.gender === 'perempuan' ? '♀' : '';
      if (genderIcon) {
        g2.append('circle')
          .attr('cx', photoR - 2).attr('cy', photoY + photoR - 2)
          .attr('r', 9)
          .attr('fill', d.data.gender === 'laki-laki' ? '#1e3a5f' : '#5f1e3a')
          .attr('stroke', CARD_BG).attr('stroke-width', 1.5);
        g2.append('text')
          .attr('x', photoR - 2).attr('y', photoY + photoR - 2)
          .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
          .attr('font-size', '9px').attr('fill', GOLD_LIGHT)
          .text(genderIcon);
      }
    });

    // Text area below photo
    const textStartY = photoY + photoR + 16;

    // Name
    nodeEnter.append('text')
      .attr('x', 0).attr('y', textStartY)
      .attr('text-anchor', 'middle')
      .attr('font-family', '"Playfair Display", Georgia, serif')
      .attr('font-weight', '700').attr('font-size', '13px')
      .attr('fill', d => d.data.id === selectedNodeId ? GOLD_LIGHT : TEXT_PRIMARY)
      .text(d => {
        const max = 16;
        return d.data.name.length > max ? d.data.name.slice(0, max) + '…' : d.data.name;
      });

    // Years
    nodeEnter.append('text')
      .attr('x', 0).attr('y', textStartY + 18)
      .attr('text-anchor', 'middle')
      .attr('font-family', '"DM Sans", "Inter", sans-serif')
      .attr('font-size', '11px').attr('fill', TEXT_MUTED)
      .text(d => {
        if (d.data.birthYear || d.data.deathYear) {
          const end = d.data.isAlive ? 'sekarang' : (d.data.deathYear || '?');
          return `${d.data.birthYear || '?'} – ${end}`;
        }
        return '';
      });

    // Spouse
    nodeEnter.append('text')
      .attr('x', 0).attr('y', textStartY + 34)
      .attr('text-anchor', 'middle')
      .attr('font-family', '"DM Sans", "Inter", sans-serif')
      .attr('font-size', '11px').attr('font-style', 'italic')
      .attr('fill', 'rgba(201,168,76,0.6)')
      .text(d => {
        if (!d.data.spouseName) return '';
        const max = 15;
        const name = d.data.spouseName.length > max ? d.data.spouseName.slice(0, max) + '…' : d.data.spouseName;
        return `♥ ${name}`;
      });

    // Occupation
    nodeEnter.append('text')
      .attr('x', 0).attr('y', textStartY + 50)
      .attr('text-anchor', 'middle')
      .attr('font-family', '"DM Sans", "Inter", sans-serif')
      .attr('font-size', '10px').attr('fill', 'rgba(139,134,128,0.7)')
      .text(d => {
        if (!d.data.occupation) return '';
        const max = 18;
        return d.data.occupation.length > max ? d.data.occupation.slice(0, max) + '…' : d.data.occupation;
      });

    // Separator line
    nodeEnter.append('line')
      .attr('x1', -nodeW / 2 + 20).attr('y1', textStartY + 60)
      .attr('x2', nodeW / 2 - 20).attr('y2', textStartY + 60)
      .attr('stroke', 'rgba(201,168,76,0.15)').attr('stroke-width', 1);

    // Status dot (alive/deceased)
    nodeEnter.each(function(d) {
      const g2 = d3.select(this);
      const cx = -nodeW / 2 + 14;
      const cy = -nodeH / 2 + 14;
      if (d.data.isAlive) {
        g2.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 7)
          .attr('fill', 'rgba(34,197,94,0.2)').attr('filter', 'url(#glow-green)');
        g2.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 4)
          .attr('fill', '#22c55e');
      } else {
        g2.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 4)
          .attr('fill', '#ef4444').attr('opacity', 0.8);
      }
    });

    // WhatsApp button (bottom right of card) — only if whatsappLink exists
    nodeEnter.each(function(d) {
      if (!d.data.whatsappLink) return;
      const g2 = d3.select(this);
      const bx = nodeW / 2 - 18;
      const by = nodeH / 2 - 18;

      // WA circle button
      g2.append('circle')
        .attr('cx', bx).attr('cy', by).attr('r', 13)
        .attr('fill', '#25D366').attr('opacity', 0.9)
        .style('cursor', 'pointer');

      // WA "W" text (simplified icon)
      g2.append('text')
        .attr('x', bx).attr('y', by)
        .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
        .attr('font-size', '11px').attr('font-weight', 'bold').attr('fill', '#fff')
        .text('WA').style('cursor', 'pointer')
        .on('click', (event) => {
          event.stopPropagation();
          window.open(d.data.whatsappLink, '_blank');
        });

      g2.select('circle:last-of-type')
        .on('click', (event) => {
          event.stopPropagation();
          window.open(d.data.whatsappLink, '_blank');
        });
    });

    // Gold top accent line for selected node
    nodeEnter.each(function(d) {
      if (d.data.id !== selectedNodeId) return;
      d3.select(this).append('rect')
        .attr('width', nodeW - 4).attr('height', 3)
        .attr('x', -nodeW / 2 + 2).attr('y', -nodeH / 2 + 2)
        .attr('rx', 12).attr('fill', GOLD).attr('opacity', 0.8);
    });

    // Pan to selected node
    if (selectedNodeId) {
      const selected = nodes.find(n => n.data.id === selectedNodeId);
      if (selected && zoomBehavior.current) {
        const tx = layoutMode === 'horizontal' ? selected.y : selected.x;
        const ty = layoutMode === 'horizontal' ? selected.x : selected.y;
        svg.transition().duration(600).call(
          zoomBehavior.current.transform,
          d3.zoomIdentity.translate(width / 2 - tx, height / 2 - ty).scale(0.9)
        );
      }
    }
  }, [data, layoutMode, selectedNodeId]);

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden" data-testid="family-tree-canvas" />
  );
});

export default FamilyTree;
