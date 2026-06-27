/**
 * Category tree (single source of truth) for Alya Bloemen.
 *
 * Model: products store a flat LEAF slug in `products.category`.
 * The hierarchy below only drives the navigation ("butterbrod") menu,
 * category landing pages and breadcrumbs. Labels are resolved via
 * next-intl using `labelKey` in the `Categories` message namespace.
 *
 * `selectable: true` marks leaf categories that can be assigned to a product.
 */

export interface CategoryNode {
    slug: string;
    labelKey: string;
    children?: CategoryNode[];
    /** Leaf categories that products can be assigned to. */
    selectable?: boolean;
}

export const CATEGORY_TREE: CategoryNode[] = [
    {
        slug: 'bouquets',
        labelKey: 'bouquets',
        children: [
            { slug: 'mono-bouquets', labelKey: 'mono_bouquets', selectable: true },
            { slug: 'mixed-bouquets', labelKey: 'mixed_bouquets', selectable: true },
            { slug: 'author-bouquets', labelKey: 'author_bouquets', selectable: true },
            { slug: 'premium-bouquets', labelKey: 'premium_bouquets', selectable: true },
            { slug: 'mini-bouquets', labelKey: 'mini_bouquets', selectable: true },
            { slug: 'bouquets-decor', labelKey: 'bouquets_decor', selectable: true },
        ],
    },
    {
        slug: 'arrangements',
        labelKey: 'arrangements',
        children: [
            { slug: 'box-arrangements', labelKey: 'box_arrangements', selectable: true },
            { slug: 'basket-arrangements', labelKey: 'basket_arrangements', selectable: true },
            { slug: 'table-arrangements', labelKey: 'table_arrangements', selectable: true },
            { slug: 'interior-arrangements', labelKey: 'interior_arrangements', selectable: true },
            { slug: 'arrangements-decor', labelKey: 'arrangements_decor', selectable: true },
        ],
    },
    {
        slug: 'wedding-floristry',
        labelKey: 'wedding_floristry',
        children: [
            { slug: 'bridal-bouquet', labelKey: 'bridal_bouquet', selectable: true },
            { slug: 'boutonnieres', labelKey: 'boutonnieres', selectable: true },
            { slug: 'hall-table-decor', labelKey: 'hall_table_decor', selectable: true },
            { slug: 'floral-arches', labelKey: 'floral_arches', selectable: true },
        ],
    },
    {
        slug: 'funeral',
        labelKey: 'funeral',
        children: [
            { slug: 'funeral-arrangement', labelKey: 'funeral_arrangement', selectable: true },
            { slug: 'funeral-bouquet', labelKey: 'funeral_bouquet', selectable: true },
            { slug: 'funeral-ribbon', labelKey: 'funeral_ribbon', selectable: true },
            { slug: 'funeral-decor', labelKey: 'funeral_decor', selectable: true },
        ],
    },
    {
        slug: 'weddings',
        labelKey: 'weddings',
        children: [
            { slug: 'wedding-portfolio', labelKey: 'wedding_portfolio', selectable: true },
            { slug: 'wedding-packages', labelKey: 'wedding_packages', selectable: true },
            { slug: 'wedding-decor', labelKey: 'wedding_decor', selectable: true },
        ],
    },
    {
        slug: 'parties',
        labelKey: 'parties',
        children: [
            { slug: 'party-portfolio', labelKey: 'party_portfolio', selectable: true },
            { slug: 'party-packages', labelKey: 'party_packages', selectable: true },
            { slug: 'party-decor', labelKey: 'party_decor', selectable: true },
        ],
    },
];

/** Flatten the tree into the list of selectable leaf categories. */
export function getLeafCategories(nodes: CategoryNode[] = CATEGORY_TREE): CategoryNode[] {
    const leaves: CategoryNode[] = [];
    for (const node of nodes) {
        if (node.children?.length) {
            leaves.push(...getLeafCategories(node.children));
        } else if (node.selectable) {
            leaves.push(node);
        }
    }
    return leaves;
}

/** All valid leaf slugs (used for product validation & admin dropdown). */
export const CATEGORY_LEAF_SLUGS: string[] = getLeafCategories().map(c => c.slug);

/** Set form for O(1) membership checks. */
export const CATEGORY_LEAF_SLUG_SET = new Set(CATEGORY_LEAF_SLUGS);

/**
 * Flatten the tree into full ancestor->node slug paths, e.g.
 * 'bouquets', 'bouquets/mono-bouquets', 'events/weddings',
 * 'events/weddings/wedding-portfolio'. Used to build the sitemap and to
 * resolve the `/category/[...slug]` catch-all route.
 */
export function getCategoryPaths(
    nodes: CategoryNode[] = CATEGORY_TREE,
    prefix: string[] = [],
): string[] {
    const paths: string[] = [];
    for (const node of nodes) {
        const trail = [...prefix, node.slug];
        paths.push(trail.join('/'));
        if (node.children?.length) {
            paths.push(...getCategoryPaths(node.children, trail));
        }
    }
    return paths;
}

/** All category URL paths (parents + leaves), precomputed. */
export const CATEGORY_PATHS: string[] = getCategoryPaths();

export interface CategoryMatch {
    /** The matched node. */
    node: CategoryNode;
    /** Ancestor chain incl. the node itself (for breadcrumbs). */
    trail: CategoryNode[];
}

/**
 * Resolve a `/category/[...slug]` path (array of slug segments) to a node and
 * its breadcrumb trail. Returns null if the path does not exist in the tree.
 */
export function findCategoryByPath(
    segments: string[],
    nodes: CategoryNode[] = CATEGORY_TREE,
    trail: CategoryNode[] = [],
): CategoryMatch | null {
    if (segments.length === 0) return null;
    const [head, ...rest] = segments;
    const node = nodes.find((n) => n.slug === head);
    if (!node) return null;
    const nextTrail = [...trail, node];
    if (rest.length === 0) return { node, trail: nextTrail };
    if (!node.children?.length) return null;
    return findCategoryByPath(rest, node.children, nextTrail);
}

/**
 * Collect every selectable leaf slug under a node (or the node's own slug if it
 * is itself a leaf). These are the slugs stored in `products.category`, used to
 * query all products belonging to a category branch.
 */
export function getLeafSlugsUnder(node: CategoryNode): string[] {
    if (!node.children?.length) return [node.slug];
    const leaves = getLeafCategories([node]);
    return leaves.map((l) => l.slug);
}

/**
 * Find the ancestor trail (root → … → leaf) for a given leaf slug, used to
 * build breadcrumbs on product pages. Returns null when the slug is unknown.
 */
export function findTrailByLeafSlug(
    slug: string,
    nodes: CategoryNode[] = CATEGORY_TREE,
    trail: CategoryNode[] = [],
): CategoryNode[] | null {
    for (const node of nodes) {
        const nextTrail = [...trail, node];
        if (node.slug === slug) return nextTrail;
        if (node.children?.length) {
            const found = findTrailByLeafSlug(slug, node.children, nextTrail);
            if (found) return found;
        }
    }
    return null;
}
