/**
 * Safely serialize data for inline embedding inside a JSON-LD
 * <script type="application/ld+json"> via dangerouslySetInnerHTML.
 *
 * Escapes characters that could break out of the script element or be
 * misinterpreted by the HTML parser, defending against stored XSS when
 * admin-controlled content (e.g. settings.address) flows into structured data.
 */
export function safeJsonLd(data: unknown): string {
    return JSON.stringify(data)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
}
