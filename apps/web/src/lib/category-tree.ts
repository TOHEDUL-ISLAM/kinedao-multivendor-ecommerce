import type {
  CategoryDTO,
  CategoryTreeNodeDTO,
} from "@kineDao.com/api-types/catalog";

/**
 * Transforms a flat list of categories into a nested tree structure.
 * This is a client-side fallback for when the server doesn't return a pre-built tree.
 */
export function buildCategoryTree(
  flatCategories: CategoryDTO[]
): CategoryTreeNodeDTO[] {
  const categoryMap = new Map<string, CategoryTreeNodeDTO>();
  const rootCategories: CategoryTreeNodeDTO[] = [];

  // First pass: create all nodes
  for (const category of flatCategories) {
    const node: CategoryTreeNodeDTO = {
      id: category.id,
      name: category.name,
      nameBn: category.nameBn,
      slug: category.slug,
      iconKey: category.iconKey,
      imageUrl: category.imageUrl,
      depth: 0, // Will be calculated based on parentId chain
      productCount: category.productCount ?? 0,
      children: [],
    };
    categoryMap.set(category.id, node);
  }

  // Second pass: build tree structure and calculate depths
  for (const category of flatCategories) {
    const node = categoryMap.get(category.id)!;

    if (category.parentId && categoryMap.has(category.parentId)) {
      const parent = categoryMap.get(category.parentId)!;
      parent.children.push(node);
      node.depth = parent.depth + 1;
    } else {
      rootCategories.push(node);
    }
  }

  // Sort children by natural ordering (assumes they come sorted from API)
  return rootCategories;
}

/**
 * Flattens a category tree back into a flat list.
 * Useful for searching or filtering across all categories.
 */
export function flattenCategoryTree(
  tree: CategoryTreeNodeDTO[]
): CategoryTreeNodeDTO[] {
  const result: CategoryTreeNodeDTO[] = [];

  function traverse(nodes: CategoryTreeNodeDTO[]) {
    for (const node of nodes) {
      result.push(node);
      if (node.children.length > 0) {
        traverse(node.children);
      }
    }
  }

  traverse(tree);
  return result;
}

/**
 * Finds a category by ID in the tree structure.
 */
export function findCategoryById(
  tree: CategoryTreeNodeDTO[],
  id: string
): CategoryTreeNodeDTO | null {
  for (const node of tree) {
    if (node.id === id) {
      return node;
    }
    if (node.children.length > 0) {
      const found = findCategoryById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Finds a category by slug in the tree structure.
 */
export function findCategoryBySlug(
  tree: CategoryTreeNodeDTO[],
  slug: string
): CategoryTreeNodeDTO | null {
  for (const node of tree) {
    if (node.slug === slug) {
      return node;
    }
    if (node.children.length > 0) {
      const found = findCategoryBySlug(node.children, slug);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Gets the path from root to a category (breadcrumb).
 */
export function getCategoryPath(
  tree: CategoryTreeNodeDTO[],
  targetId: string
): CategoryTreeNodeDTO[] {
  const path: CategoryTreeNodeDTO[] = [];

  function traverse(nodes: CategoryTreeNodeDTO[]): boolean {
    for (const node of nodes) {
      path.push(node);
      if (node.id === targetId) {
        return true;
      }
      if (node.children.length > 0 && traverse(node.children)) {
        return true;
      }
      path.pop();
    }
    return false;
  }

  traverse(tree);
  return path;
}
