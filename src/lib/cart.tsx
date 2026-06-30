"use client";

/**
 * Client-side shopping cart store.
 *
 * Persists to localStorage so the cart survives reloads and navigation.
 * Holds enough product data to render the cart and checkout without
 * re-fetching, while the server (POST /api/cart-order) re-verifies price and
 * stock from the database before creating an order.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { finalPrice } from "@/lib/i18n-content";

export type CartItem = {
  id: string;
  name: string;
  name_uk?: string;
  name_nl?: string;
  price: number;
  discount: number;
  image_url: string;
  quantity: number;
  selectedSize?: string; // 'S' | 'M' | 'L' or undefined
};

/** Unique cart key: product id + optional size */
function cartKey(id: string, size?: string): string {
  return size ? `${id}__${size}` : id;
}

type CartContextValue = {
  items: CartItem[];
  totalQuantity: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: string, size?: string) => void;
  setQuantity: (id: string, quantity: number, size?: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "alya-bloemen-cart";
const MAX_QTY = 10;

const CartContext = createContext<CartContextValue | null>(null);

function clampQty(qty: number): number {
  if (!Number.isFinite(qty)) return 1;
  return Math.min(MAX_QTY, Math.max(1, Math.round(qty)));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted cart once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      // Ignore corrupted storage.
    }
    setHydrated(true);
  }, []);

  // Persist on every change (after initial hydration).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full / unavailable — ignore.
    }
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce(
      (sum, i) => sum + finalPrice(i.price, i.discount) * i.quantity,
      0,
    );

    return {
      items,
      totalQuantity,
      subtotal,
      addItem: (item, quantity = 1) =>
        setItems((prev) => {
          const key = cartKey(item.id, item.selectedSize);
          const existing = prev.find((i) => cartKey(i.id, i.selectedSize) === key);
          if (existing) {
            return prev.map((i) =>
              cartKey(i.id, i.selectedSize) === key
                ? { ...i, quantity: clampQty(i.quantity + quantity) }
                : i,
            );
          }
          return [...prev, { ...item, quantity: clampQty(quantity) }];
        }),
      removeItem: (id, size?: string) =>
        setItems((prev) => {
          const key = cartKey(id, size);
          return prev.filter((i) => cartKey(i.id, i.selectedSize) !== key);
        }),
      setQuantity: (id, quantity, size?: string) =>
        setItems((prev) => {
          const key = cartKey(id, size);
          return prev.map((i) =>
            cartKey(i.id, i.selectedSize) === key ? { ...i, quantity: clampQty(quantity) } : i,
          );
        }),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

export { finalPrice };
