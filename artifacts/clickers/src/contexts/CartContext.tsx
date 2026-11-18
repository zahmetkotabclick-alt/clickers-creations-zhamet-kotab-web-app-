import { createContext, useContext, useReducer, useEffect, useMemo, type ReactNode } from 'react';
import { useCampaign } from '@/contexts/CampaignContext';
import { useBooks, type Book } from '@/services/supabase.hooks';

export interface CartItem {
  bookId: string;
  title: string;
  coverUrl: string;
  price: number;
  basePrice?: number;
  originalPrice?: number;
  quantity: number;
  format: 'digital' | 'physical' | 'both';
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QTY'; payload: { bookId: string; quantity: number } }
  | { type: 'CLEAR' }
  | { type: 'TOGGLE_DRAWER' }
  | { type: 'OPEN_DRAWER' }
  | { type: 'CLOSE_DRAWER' }
  | { type: 'LOAD'; payload: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.bookId === action.payload.bookId);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.bookId === action.payload.bookId
              ? {
                  ...i,
                  quantity: i.quantity + action.payload.quantity,
                  basePrice: action.payload.basePrice ?? i.basePrice,
                  originalPrice: action.payload.originalPrice ?? i.originalPrice,
                }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, action.payload] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.bookId !== action.payload) };
    case 'UPDATE_QTY':
      return {
        ...state,
        items: state.items.map((i) =>
          i.bookId === action.payload.bookId
            ? { ...i, quantity: Math.max(1, action.payload.quantity) }
            : i
        ),
      };
    case 'CLEAR':
      return { ...state, items: [] };
    case 'TOGGLE_DRAWER':
      return { ...state, isOpen: !state.isOpen };
    case 'OPEN_DRAWER':
      return { ...state, isOpen: true };
    case 'CLOSE_DRAWER':
      return { ...state, isOpen: false };
    case 'LOAD':
      return { ...state, items: action.payload };
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  totalItems: number;
  totalPrice: number;
  addItem: (item: CartItem) => void;
  removeItem: (bookId: string) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  isInCart: (bookId: string) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);
const CART_KEY = 'zahmet_kotab_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false });
  const { getPricing } = useCampaign();
  const { data: allBooks } = useBooks();

  const booksMap = useMemo(() => {
    const map = new Map<string, Book>();
    if (allBooks) {
      for (const b of allBooks) {
        map.set(b.id, b);
      }
    }
    return map;
  }, [allBooks]);

  // Load persisted cart on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) dispatch({ type: 'LOAD', payload: JSON.parse(saved) });
    } catch {
      // ignore
    }
  }, []);

  // Persist cart on every change
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(state.items));
  }, [state.items]);

  // Self-healing migration: heal any cart items in localStorage that had missing or incorrect basePrice/originalPrice
  useEffect(() => {
    if (!allBooks || allBooks.length === 0 || state.items.length === 0) return;
    let needsUpdate = false;
    const updated = state.items.map((item) => {
      const db = booksMap.get(item.bookId);
      if (db) {
        const correctBase = Number(db.price);
        const correctOrig = db.original_price ? Number(db.original_price) : Number(db.price);
        if (item.basePrice !== correctBase || item.originalPrice !== correctOrig) {
          needsUpdate = true;
          return {
            ...item,
            basePrice: correctBase,
            originalPrice: correctOrig,
          };
        }
      }
      return item;
    });

    if (needsUpdate) {
      dispatch({ type: 'LOAD', payload: updated });
    }
  }, [allBooks, booksMap, state.items]);

  // Dynamically calculate effective pricing according to active campaign
  const dynamicItems = useMemo(() => {
    return state.items.map((item) => {
      const dbBook = booksMap.get(item.bookId);

      // Determine the authoritative pre-campaign reference price
      const basePrice = dbBook
        ? Number(dbBook.price)
        : (item.basePrice !== undefined ? item.basePrice : item.price);

      const originalRefPrice = dbBook
        ? (dbBook.original_price ? Number(dbBook.original_price) : Number(dbBook.price))
        : (item.originalPrice !== undefined ? item.originalPrice : basePrice);

      const pricing = getPricing(basePrice, originalRefPrice);

      return {
        ...item,
        price: pricing.effectivePrice,
        basePrice,
        originalPrice: pricing.originalPrice ?? (originalRefPrice > pricing.effectivePrice ? originalRefPrice : undefined),
      };
    });
  }, [state.items, booksMap, getPricing]);

  const totalItems = dynamicItems.reduce((acc, i) => acc + i.quantity, 0);
  const totalPrice = dynamicItems.reduce((acc, i) => acc + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: dynamicItems,
        isOpen: state.isOpen,
        totalItems,
        totalPrice,
        addItem: (item) => dispatch({ type: 'ADD_ITEM', payload: item }),
        removeItem: (id) => dispatch({ type: 'REMOVE_ITEM', payload: id }),
        updateQuantity: (id, qty) => dispatch({ type: 'UPDATE_QTY', payload: { bookId: id, quantity: qty } }),
        clear: () => dispatch({ type: 'CLEAR' }),
        openCart: () => dispatch({ type: 'OPEN_DRAWER' }),
        closeCart: () => dispatch({ type: 'CLOSE_DRAWER' }),
        toggleCart: () => dispatch({ type: 'TOGGLE_DRAWER' }),
        isInCart: (id) => state.items.some((i) => i.bookId === id),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
