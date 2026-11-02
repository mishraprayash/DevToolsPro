import { describe, it, expect } from 'vitest';
import {
  getToolById,
  getToolsByCategory,
  getNewTools,
  categories,
  categoryLabels,
  tools,
  ToolCategory,
} from '../../registry';

describe('registry lookup utilities', () => {
  it('should retrieve existing tool by ID', () => {
    const jsonTool = getToolById('json');
    expect(jsonTool).toBeDefined();
    expect(jsonTool?.name).toBe('JSON Beautifier');

    const uuidTool = getToolById('uuid');
    expect(uuidTool).toBeDefined();
    expect(uuidTool?.name).toBe('UUID Generator');
  });

  it('should return undefined for non-existent tool ID', () => {
    expect(getToolById('non-existent-id-123')).toBeUndefined();
    expect(getToolById('')).toBeUndefined();
  });

  it('should filter tools by category correctly', () => {
    categories.forEach((cat) => {
      const catTools = getToolsByCategory(cat);
      expect(catTools.length).toBeGreaterThan(0);
      catTools.forEach((t) => {
        expect(t.category).toBe(cat);
      });
    });

    const unknownCatTools = getToolsByCategory('InvalidCategory' as ToolCategory);
    expect(unknownCatTools).toEqual([]);
  });

  it('should retrieve new tools marked with isNew', () => {
    const newTools = getNewTools();
    expect(newTools.length).toBeGreaterThan(0);
    newTools.forEach((t) => {
      expect(t.isNew).toBe(true);
    });
  });

  it('should have valid categoryLabels for all defined categories', () => {
    categories.forEach((cat) => {
      expect(categoryLabels[cat]).toBe(cat);
    });
  });

  it('should ensure all tools have unique IDs', () => {
    const ids = tools.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
