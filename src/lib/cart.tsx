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

export type CartItem = {
  id: string;
  name: string;
  price: number;
  discount: number;
  image_url: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  totalQuantity: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
};

const STORAGE_KEY = "elite-bloemen-cart";
const MAX_QTY = 10;

const CartContext = createContext<CartContextValue | null>(null);

/** Final price after applying a percentage discount (rounded to integer). */
function finalPrice(price: number, discount: number): number {
  if (!discount || discount <= 0) return price;
  return Math.round(price * (1 - discount / 100));
}

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
          const existing = prev.find((i) => i.id === item.id);
          if (existing) {
            return prev.map((i) =>
              i.id === item.id
                ? { ...i, quantity: clampQty(i.quantity + quantity) }
                : i,
            );
          }
          return [...prev, { ...item, quantity: clampQty(quantity) }];
        }),
      removeItem: (id) =>
        setItems((prev) => prev.filter((i) => i.id !== id)),
      setQuantity: (id, quantity) =>
        setItems((prev) =>
          prev.map((i) =>
            i.id === id ? { ...i, quantity: clampQty(quantity) } : i,
          ),
        ),
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
