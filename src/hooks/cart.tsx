import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const AS_PRODUCTS_KEY = '@GoMarketPlace:CartItems';
  const [products, setProducts] = useState<Product[]>([]);

  const getCartItems = useCallback(async () => {
    let cartItems: Product[] = [];

    // await AsyncStorage.removeItem(AS_PRODUCTS_KEY);

    const jsonItems = await AsyncStorage.getItem(AS_PRODUCTS_KEY);
    if (jsonItems) {
      cartItems = JSON.parse(jsonItems);
    }

    return cartItems;
  }, []);

  const increment = useCallback(
    async id => {
      const cartItems = await getCartItems();
      const index = cartItems.findIndex(item => item.id === id);

      if (index >= 0) {
        cartItems[index].quantity++;
        await AsyncStorage.setItem(AS_PRODUCTS_KEY, JSON.stringify(cartItems));

        setProducts(cartItems);
      }
    },
    [getCartItems],
  );

  const decrement = useCallback(
    async id => {
      const cartItems = await getCartItems();
      const index = cartItems.findIndex(item => item.id === id);

      if (index >= 0) {
        cartItems[index].quantity--;

        if (cartItems[index].quantity <= 0) {
          cartItems.splice(index, 1);
        }

        await AsyncStorage.setItem(AS_PRODUCTS_KEY, JSON.stringify(cartItems));

        setProducts(cartItems);
      }
    },
    [getCartItems],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const cartItems = await getCartItems();

      const itemExists = cartItems.some(item => item.id === product.id);
      if (itemExists) {
        await increment(product.id);
      } else {
        product.quantity = 1;
        cartItems.push(product);
        await AsyncStorage.setItem(AS_PRODUCTS_KEY, JSON.stringify(cartItems));

        setProducts([...products, product]);
      }
    },
    [products, getCartItems, increment],
  );

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cartItems = await getCartItems();
      setProducts(cartItems);
    }

    loadProducts();
  }, [getCartItems]);

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
