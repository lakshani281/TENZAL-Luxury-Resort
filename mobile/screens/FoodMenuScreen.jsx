import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getCategories,
  getDailySpecials,
  getFoodItems,
  createOrder,
} from '../services/foodApi';

// Soft Coastal Luxury Theme
const THEME = {
  oceanBlue: '#397C91',
  skyBlue: '#DCEEF4',
  creamWhite: '#FFFDF8',
  sandBeige: '#F5EBDD',
  softPeach: '#F4C9B8',
  darkSlate: '#263B46',
  mutedSlate: '#5E7480',
  white: '#FFFFFF',
};

// Approved Delivery Rooms (Strictly verified 3 rooms)
const DELIVERY_ROOMS = [
  { id: 'room-3', name: 'Uva Valley View Room — Room 3', short: 'Room 3' },
  { id: 'room-4', name: 'Bridal Suite, Uva Valley — Room 4', short: 'Room 4' },
  { id: 'room-5', name: 'Indian Ocean View Room — Room 5', short: 'Room 5' },
];

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Drinks'];

export default function FoodMenuScreen({ navigation, onBack }) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Live API States (Student ID: 22CIS0328)
  const [categories, setCategories] = useState(['All', 'Breakfast', 'Lunch', 'Dinner', 'Drinks', 'Desserts']);
  const [specials, setSpecials] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [partialError, setPartialError] = useState(null);

  // Synchronous concurrency lock to prevent overlapping menu loads
  const isLoadingMenuRef = useRef(false);

  // Mounted-state ref to prevent state updates if component unmounts during async calls
  const isMountedRef = useRef(true);

  // Cart state: empty array as required by Requirement 9 (no preloaded demo items)
  const [cart, setCart] = useState([]);
  const [selectedFoodDetail, setSelectedFoodDetail] = useState(null);
  const [cartVisible, setCartVisible] = useState(false);
  const [orderConfirmedVisible, setOrderConfirmedVisible] = useState(false);
  const [myOrdersVisible, setMyOrdersVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState(null);
  
  // Room selection: default empty; user must select Room 3, 4, or 5
  const [selectedDeliveryRoom, setSelectedDeliveryRoom] = useState('');
  const [roomError, setRoomError] = useState(null);
  const [specialNote, setSpecialNote] = useState('');

  // Active Order state: stores the confirmed order data object from PostgreSQL
  const [activeOrder, setActiveOrder] = useState(null);

  // Order Placement submission states
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  // Load categories, specials, and menu items from backend with Promise.allSettled
  const loadMenuData = useCallback(async (isRefresh = false) => {
    // Synchronous concurrency guard: reject duplicate calls while a request is in flight
    if (isLoadingMenuRef.current) return;
    isLoadingMenuRef.current = true;

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setLoadError(null);
    setPartialError(null);

    try {
      const [catResult, specialsResult, itemsResult] = await Promise.allSettled([
        getCategories(),
        getDailySpecials(),
        getFoodItems({ available: 'all' }),
      ]);

      // If component unmounted while requests were in flight, abort state updates
      if (!isMountedRef.current) return;

      let anySuccess = false;
      const errors = [];

      // 1. Process Categories (Ensure 'All' is first, followed by DB categories)
      if (catResult.status === 'fulfilled' && Array.isArray(catResult.value) && catResult.value.length > 0) {
        const names = catResult.value
          .map((c) => (typeof c === 'string' ? c : c.name))
          .filter((n) => Boolean(n) && n.toLowerCase() !== 'all');
        setCategories(['All', ...names]);
        anySuccess = true;
      } else if (catResult.status === 'rejected') {
        errors.push(`Categories: ${catResult.reason?.message || 'Failed to load'}`);
      }

      // 2. Process Daily Specials
      if (specialsResult.status === 'fulfilled') {
        setSpecials(Array.isArray(specialsResult.value) ? specialsResult.value : []);
        anySuccess = true;
      } else {
        errors.push(`Specials: ${specialsResult.reason?.message || 'Failed to load'}`);
      }

      // 3. Process Menu Items
      if (itemsResult.status === 'fulfilled') {
        setMenuItems(Array.isArray(itemsResult.value) ? itemsResult.value : []);
        anySuccess = true;
      } else {
        errors.push(`Menu Dishes: ${itemsResult.reason?.message || 'Failed to load'}`);
      }

      // Handle failure modes
      if (!anySuccess && errors.length > 0) {
        setLoadError(errors.join('\n'));
      } else if (errors.length > 0) {
        setPartialError(errors.join(' • '));
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error('[FoodMenuScreen] Unexpected error loading menu data:', err);
        setLoadError('An unexpected error occurred while loading menu data. Please retry.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
      isLoadingMenuRef.current = false;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadMenuData(false);
    return () => {
      isMountedRef.current = false;
    };
  }, [loadMenuData]);

  // Cart totals in LKR (Demonstration estimate)
  const totalCartCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);
  const subtotalLKR = cart.reduce((acc, curr) => acc + curr.item.price * curr.quantity, 0);
  const serviceChargeLKR = Math.round(subtotalLKR * 0.1);
  const grandTotalLKR = subtotalLKR + serviceChargeLKR;

  const filteredSpecials =
    selectedCategory === 'All'
      ? specials
      : specials.filter(
          (item) => item.category && item.category.toLowerCase() === selectedCategory.toLowerCase()
        );

  const filteredMenuItems =
    selectedCategory === 'All'
      ? menuItems
      : menuItems.filter(
          (item) => item.category && item.category.toLowerCase() === selectedCategory.toLowerCase()
        );

  const handleAddToCart = (item) => {
    if (!item.isAvailable) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) => (c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { item, quantity: 1 }];
    });

    setNotificationMessage(`Added "${item.name}"`);
    setTimeout(() => {
      setNotificationMessage(null);
    }, 2200);
  };

  const handleUpdateQty = (itemId, delta) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.item.id === itemId) {
            const nextQty = c.quantity + delta;
            return nextQty > 0 ? { ...c, quantity: nextQty } : null;
          }
          return c;
        })
        .filter(Boolean)
    );
  };

  const handleCheckout = async () => {
    if (isPlacingOrder) return; // Prevent duplicate submissions

    if (!selectedDeliveryRoom) {
      setRoomError('Please select your resort delivery room (Room 3, 4, or 5) before ordering.');
      return;
    }
    setRoomError(null);
    setCheckoutError(null);

    const matchedRoom = DELIVERY_ROOMS.find((rm) => rm.name === selectedDeliveryRoom);
    if (!matchedRoom) {
      setRoomError('Please select a valid resort delivery room (Room 3, 4, or 5).');
      return;
    }

    if (!cart || cart.length === 0) {
      setCheckoutError('Your food tray is empty. Add at least one dish before ordering.');
      return;
    }

    // Map cart items: strictly send only item_id and quantity (never send client prices or totals)
    const payloadItems = cart.map((line) => ({
      item_id: Number(line.item.item_id || line.item.id),
      quantity: line.quantity,
    }));

    setIsPlacingOrder(true);

    try {
      const orderPayload = {
        room_number: matchedRoom.short,
        room_name: matchedRoom.name,
        special_note: specialNote ? specialNote.trim() : undefined,
        items: payloadItems,
      };

      const backendOrder = await createOrder(orderPayload);

      // Successfully placed real order in PostgreSQL
      setActiveOrder({
        orderId: backendOrder.order_code,
        orderCode: backendOrder.order_code,
        roomName: backendOrder.room_name,
        roomNumber: backendOrder.room_number,
        items: Array.isArray(backendOrder.items)
          ? backendOrder.items.map((it) => ({
              name: it.item_name,
              quantity: it.quantity,
              price: it.unit_price,
              lineTotal: it.line_total,
            }))
          : [],
        subtotalLKR: backendOrder.subtotal,
        serviceChargeLKR: backendOrder.service_charge,
        totalLKR: backendOrder.total_amount,
        specialNote: backendOrder.special_note || '',
        status: backendOrder.status || 'Pending',
        estimatedDelivery: `~${backendOrder.estimated_delivery_minutes || 30} minutes`,
        estimatedDeliveryMinutes: backendOrder.estimated_delivery_minutes || 30,
        createdAt: backendOrder.created_at,
        raw: backendOrder,
      });

      // Clear cart and reset form only after confirmed success
      setCart([]);
      setSelectedDeliveryRoom('');
      setSpecialNote('');
      setRoomError(null);
      setCheckoutError(null);

      // Close cart tray and open confirmation modal
      setCartVisible(false);
      setOrderConfirmedVisible(true);
    } catch (error) {
      console.error('[FoodMenuScreen] Order creation failed:', error);
      // Keep cart, room, and special instructions intact on failure
      const errorMsg =
        error.message ||
        'Unable to place order. Please check your network connection and try again.';
      setCheckoutError(errorMsg);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleNavPress = (screenTarget) => {
    if (screenTarget === 'Home') {
      if (onBack) {
        onBack();
      } else if (navigation && navigation.navigate) {
        navigation.navigate('Home');
      }
    } else if (navigation && navigation.navigate) {
      navigation.navigate(screenTarget);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.creamWhite} />

      {/* 1. HEADER: Branding, Back Button & Cart */}
      <View style={styles.headerContainer}>
        <View style={styles.brandingRow}>
          <View style={styles.brandingLeft}>
            <TouchableOpacity
              style={styles.headerBackButton}
              activeOpacity={0.7}
              onPress={() => handleNavPress('Home')}
            >
              <Ionicons name="arrow-back" size={18} color={THEME.darkSlate} />
            </TouchableOpacity>

            <View style={styles.brandBadge}>
              <Ionicons name="restaurant" size={11} color={THEME.oceanBlue} />
              <Text style={styles.brandTag}>TENZAL TABLE</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {/* View Orders History */}
            <TouchableOpacity
              style={styles.ordersButton}
              onPress={() => setMyOrdersVisible(true)}
              activeOpacity={0.75}
            >
              <Ionicons name="receipt-outline" size={18} color={THEME.darkSlate} />
            </TouchableOpacity>

            {/* Shopping Cart Button */}
            <TouchableOpacity
              style={styles.cartButton}
              activeOpacity={0.75}
              onPress={() => setCartVisible(true)}
            >
              <Ionicons name="bag-handle-outline" size={20} color={THEME.oceanBlue} />
              {totalCartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{totalCartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.titleWrapper}>
          <Text style={styles.titlePrimary}>In-Room Dining</Text>
          <Text style={styles.titleSubtitle}>
            Artisanal Culinary Experiences · Delivered to Your Room (Demonstration Prices)
          </Text>
        </View>

        {/* Temporary Feedback Notification */}
        {notificationMessage && (
          <View style={styles.notificationBanner}>
            <Ionicons name="checkmark-circle" size={15} color={THEME.oceanBlue} />
            <Text style={styles.notificationText} numberOfLines={1}>
              {notificationMessage}
            </Text>
          </View>
        )}
      </View>

      {/* Demonstration Notice */}
      <View style={styles.demoNoticeBar}>
        <Ionicons name="information-circle-outline" size={14} color={THEME.oceanBlue} />
        <Text style={styles.demoNoticeText}>
          Culinary Simulation: Prices & prep times are demonstration estimates (Student ID: 22CIS0328).
        </Text>
      </View>

      {/* 2. CATEGORY FILTERS */}
      <View style={styles.categorySection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
              >
                <Text style={[styles.categoryText, isSelected && styles.categoryTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* MAIN SCROLLABLE CONTENT WITH LOADING, ERROR & PULL-TO-REFRESH */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.oceanBlue} />
          <Text style={styles.loadingText}>Curating artisanal highland menu...</Text>
          <Text style={styles.loadingSubtext}>Connecting to TENZAL Dining Service</Text>
        </View>
      ) : loadError && specials.length === 0 && menuItems.length === 0 ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={52} color={THEME.oceanBlue} />
          <Text style={styles.errorTitle}>Unable to Connect to Dining Service</Text>
          <Text style={styles.errorMessage}>{loadError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadMenuData(false)}
            activeOpacity={0.85}
          >
            <Ionicons name="reload" size={16} color={THEME.white} />
            <Text style={styles.retryButtonText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadMenuData(true)}
              colors={[THEME.oceanBlue]}
              tintColor={THEME.oceanBlue}
            />
          }
        >
          {/* Partial failure notice if one section failed while others succeeded */}
          {partialError && (
            <View style={styles.partialErrorBanner}>
              <Ionicons name="alert-circle-outline" size={14} color="#92400E" />
              <Text style={styles.partialErrorText} numberOfLines={2}>
                Notice: {partialError}
              </Text>
              <TouchableOpacity onPress={() => loadMenuData(false)} style={styles.partialRetryBtn}>
                <Text style={styles.partialRetryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        {/* 3. TODAY'S SPECIALS (Horizontal Carousel) */}
        {filteredSpecials.length > 0 && (
          <View style={styles.specialsSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionOverline}>CHEF'S CURATED SELECTION</Text>
                <Text style={styles.sectionTitle}>Today's Specials</Text>
              </View>
              <View style={styles.specialsIndicator}>
                <Ionicons name="flame" size={14} color="#DD6B20" />
                <Text style={styles.specialsIndicatorText}>Daily Fresh</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.specialsScroll}>
              {filteredSpecials.map((dish) => (
                <TouchableOpacity
                  key={dish.id}
                  style={styles.specialCard}
                  activeOpacity={0.9}
                  onPress={() => setSelectedFoodDetail(dish)}
                >
                  <View style={styles.specialImageContainer}>
                    <Image source={{ uri: dish.image }} style={styles.specialImage} resizeMode="cover" />
                    <View style={styles.specialBadge}>
                      <Text style={styles.specialBadgeText}>{dish.badge}</Text>
                    </View>
                  </View>

                  <View style={styles.specialInfo}>
                    <Text style={styles.specialName} numberOfLines={1}>{dish.name}</Text>
                    <Text style={styles.specialDescription} numberOfLines={2}>
                      {dish.description}
                    </Text>

                    <View style={styles.specialFooter}>
                      <View>
                        <Text style={styles.priceLabel}>DEMO PRICE</Text>
                        <Text style={styles.specialPrice}>
                          LKR {dish.price.toLocaleString()}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.specialAddButton}
                        activeOpacity={0.85}
                        onPress={() => handleAddToCart(dish)}
                      >
                        <Ionicons name="add" size={16} color={THEME.white} />
                        <Text style={styles.specialAddButtonText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 4. MENU: Two-Column Food Grid */}
        <View style={styles.menuSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionOverline}>
                {selectedCategory === 'All' ? 'ALL DISHES' : `${selectedCategory.toUpperCase()} SELECTION`}
              </Text>
              <Text style={styles.sectionTitle}>
                {selectedCategory === 'All' ? 'Resort Dining Menu' : `${selectedCategory} Menu`}
              </Text>
            </View>
            <Text style={styles.itemCountText}>{filteredMenuItems.length} dishes</Text>
          </View>

          {filteredMenuItems.length === 0 ? (
            <View style={styles.emptyMenuBox}>
              <Ionicons name="restaurant-outline" size={36} color={THEME.mutedSlate} />
              <Text style={styles.emptyMenuTitle}>No dishes found in {selectedCategory}</Text>
              <Text style={styles.emptyMenuSub}>
                Please select another culinary category or pull down to refresh.
              </Text>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {filteredMenuItems.map((dish) => {
                const isAvailable = dish.isAvailable;
                return (
                  <TouchableOpacity
                    key={dish.id}
                    style={[styles.gridCard, !isAvailable && styles.gridCardSoldOut]}
                    activeOpacity={0.88}
                    onPress={() => setSelectedFoodDetail(dish)}
                  >
                    <View style={styles.gridImageContainer}>
                      <Image
                        source={{ uri: dish.image }}
                        style={[styles.gridImage, !isAvailable && styles.gridImageMuted]}
                        resizeMode="cover"
                      />

                      {/* Sold Out Overlay Badge */}
                      {!isAvailable && (
                        <View style={styles.soldOutOverlay}>
                          <View style={styles.soldOutBadge}>
                            <Ionicons name="close-circle-outline" size={12} color={THEME.white} style={{ marginRight: 3 }} />
                            <Text style={styles.soldOutText}>Sold Out</Text>
                          </View>
                        </View>
                      )}

                      {/* Preparation Time Pill */}
                      {isAvailable && (
                        <View style={styles.prepPill}>
                          <Ionicons name="time-outline" size={10} color={THEME.darkSlate} />
                          <Text style={styles.prepText}>{dish.prepTime}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.gridCardBody}>
                      <Text style={styles.gridCardCategory}>{dish.category}</Text>
                      <Text style={styles.gridCardName} numberOfLines={2}>
                        {dish.name}
                      </Text>
                      <Text style={styles.gridCardSubtitle} numberOfLines={1}>
                        {dish.subtitle}
                      </Text>

                      <View style={styles.gridCardFooter}>
                        <View>
                          <Text style={styles.demoPriceSmallLabel}>DEMO</Text>
                          <Text style={[styles.gridPrice, !isAvailable && styles.gridPriceMuted]}>
                            LKR {dish.price.toLocaleString()}
                          </Text>
                        </View>

                        {isAvailable ? (
                          <TouchableOpacity
                            style={styles.gridAddButton}
                            activeOpacity={0.85}
                            onPress={() => handleAddToCart(dish)}
                          >
                            <Ionicons name="add" size={14} color={THEME.white} />
                            <Text style={styles.gridAddButtonText}>Add</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.gridDisabledButton}>
                            <Text style={styles.gridDisabledButtonText}>Sold Out</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>
      )}

      {/* 5. FOOD DETAILS MODAL */}
      <Modal
        visible={!!selectedFoodDetail}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedFoodDetail(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {selectedFoodDetail && (
              <>
                <View style={styles.modalTopHeader}>
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setSelectedFoodDetail(null)}
                  >
                    <Ionicons name="close" size={20} color={THEME.darkSlate} />
                  </TouchableOpacity>
                  <Text style={styles.modalHeaderTitle}>Dish Details</Text>
                  <View style={{ width: 36 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <Image
                    source={{ uri: selectedFoodDetail.image }}
                    style={styles.modalFoodImage}
                    resizeMode="cover"
                  />

                  <View style={styles.modalFoodBody}>
                    <View style={styles.modalCategoryRow}>
                      <View style={styles.dishBadge}>
                        <Text style={styles.dishBadgeText}>{selectedFoodDetail.category}</Text>
                      </View>
                      <View style={styles.prepPill}>
                        <Ionicons name="time-outline" size={11} color={THEME.darkSlate} />
                        <Text style={styles.prepText}>{selectedFoodDetail.prepTime}</Text>
                      </View>
                    </View>

                    <Text style={styles.detailFoodName}>{selectedFoodDetail.name}</Text>
                    <Text style={styles.detailFoodPrice}>
                      LKR {selectedFoodDetail.price.toLocaleString()}
                      <Text style={styles.demoPriceSuffix}> (Demonstration Price)</Text>
                    </Text>
                    <Text style={styles.detailFoodDesc}>{selectedFoodDetail.description || selectedFoodDetail.subtitle}</Text>

                    {/* Ingredients List */}
                    {selectedFoodDetail.ingredients && (
                      <View style={styles.ingredientsBox}>
                        <Text style={styles.boxTitle}>Fresh Ingredients & Seasoning</Text>
                        {selectedFoodDetail.ingredients.map((ing, i) => (
                          <View key={i} style={styles.ingRow}>
                            <Ionicons name="leaf-outline" size={13} color={THEME.oceanBlue} />
                            <Text style={styles.ingText}>{ing}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Add to Cart CTA */}
                    {selectedFoodDetail.isAvailable ? (
                      <TouchableOpacity
                        style={styles.detailAddBtn}
                        activeOpacity={0.85}
                        onPress={() => {
                          handleAddToCart(selectedFoodDetail);
                          setSelectedFoodDetail(null);
                        }}
                      >
                        <Ionicons name="bag-add" size={18} color={THEME.white} />
                        <Text style={styles.detailAddBtnText}>
                          Add to Order · LKR {selectedFoodDetail.price.toLocaleString()}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.detailSoldOutBtn}>
                        <Text style={styles.detailSoldOutBtnText}>Currently Unavailable</Text>
                      </View>
                    )}
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* 6. SHOPPING CART MODAL */}
      <Modal
        visible={cartVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCartVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalTopHeader}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setCartVisible(false)}
              >
                <Ionicons name="close" size={20} color={THEME.darkSlate} />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>Your Order Tray</Text>
              <TouchableOpacity onPress={() => setCart([])}>
                <Text style={styles.clearCartText}>Clear</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 18 }}>
              {cart.length === 0 ? (
                <View style={styles.emptyCartBox}>
                  <Ionicons name="restaurant-outline" size={48} color={THEME.sandBeige} />
                  <Text style={styles.emptyCartTitle}>Your food tray is empty</Text>
                  <Text style={styles.emptyCartSub}>Select items from the menu to build your in-room order.</Text>
                </View>
              ) : (
                <>
                  {/* Cart Items List */}
                  {cart.map((line) => (
                    <View key={line.item.id} style={styles.cartItemRow}>
                      <Image source={{ uri: line.item.image }} style={styles.cartThumb} resizeMode="cover" />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.cartItemName} numberOfLines={1}>{line.item.name}</Text>
                        <Text style={styles.cartItemUnitPrice}>LKR {line.item.price.toLocaleString()} (Demo)</Text>
                      </View>

                      {/* Quantity Controls */}
                      <View style={styles.qtyControl}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => handleUpdateQty(line.item.id, -1)}
                        >
                          <Ionicons name="remove" size={14} color={THEME.darkSlate} />
                        </TouchableOpacity>
                        <Text style={styles.qtyNum}>{line.quantity}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => handleUpdateQty(line.item.id, 1)}
                        >
                          <Ionicons name="add" size={14} color={THEME.darkSlate} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  {/* Delivery Location Selection (Strictly required Room 3, 4, or 5) */}
                  <View style={styles.deliveryBox}>
                    <View style={styles.deliveryHeaderRow}>
                      <Text style={styles.boxTitle}>Select Delivery Room (Required)</Text>
                      {selectedDeliveryRoom ? (
                        <View style={styles.selectedPill}>
                          <Text style={styles.selectedPillText}>Selected</Text>
                        </View>
                      ) : (
                        <View style={styles.requiredPill}>
                          <Text style={styles.requiredPillText}>Action Required</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.deliveryHelperText}>
                      Select your assigned guest room from the three verified resort rooms:
                    </Text>

                    <View style={styles.roomSelectWrap}>
                      {DELIVERY_ROOMS.map((rm) => {
                        const isChosen = selectedDeliveryRoom === rm.name;
                        return (
                          <TouchableOpacity
                            key={rm.id}
                            style={[styles.roomSelectPill, isChosen && styles.roomSelectPillActive]}
                            onPress={() => {
                              setSelectedDeliveryRoom(rm.name);
                              setRoomError(null);
                            }}
                            activeOpacity={0.8}
                          >
                            <Ionicons
                              name={isChosen ? 'radio-button-on' : 'radio-button-off'}
                              size={16}
                              color={isChosen ? THEME.oceanBlue : THEME.mutedSlate}
                            />
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.roomSelectName, isChosen && styles.roomSelectNameActive]}>
                                {rm.name}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {roomError && (
                      <View style={styles.roomErrorBanner}>
                        <Ionicons name="alert-circle" size={15} color="#E53E3E" />
                        <Text style={styles.roomErrorText}>{roomError}</Text>
                      </View>
                    )}

                    <TextInput
                      placeholder="Special kitchen instructions or dietary notes..."
                      placeholderTextColor={THEME.mutedSlate}
                      value={specialNote}
                      onChangeText={setSpecialNote}
                      style={styles.notesInput}
                    />

                    {/* Checkout Error Banner if order submission fails */}
                    {checkoutError && (
                      <View style={styles.checkoutErrorBanner}>
                        <Ionicons name="alert-circle" size={16} color="#DC2626" />
                        <Text style={styles.checkoutErrorText}>{checkoutError}</Text>
                      </View>
                    )}
                  </View>

                  {/* Bill Summary */}
                  <View style={styles.billBox}>
                    <View style={styles.billRow}>
                      <Text style={styles.billLabel}>Subtotal</Text>
                      <Text style={styles.billVal}>LKR {subtotalLKR.toLocaleString()}</Text>
                    </View>
                    <View style={styles.billRow}>
                      <Text style={styles.billLabel}>Resort Service Charge (10%)</Text>
                      <Text style={styles.billVal}>LKR {serviceChargeLKR.toLocaleString()}</Text>
                    </View>
                    <View style={[styles.billRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>Estimated Total Charge to Room</Text>
                      <Text style={styles.totalVal}>LKR {grandTotalLKR.toLocaleString()}</Text>
                    </View>
                    <Text style={styles.demoBillNotice}>
                      * All prices in LKR. In-room dining charge billed to assigned room folio.
                    </Text>
                  </View>

                  {/* Checkout Button */}
                  <TouchableOpacity
                    style={[
                      styles.checkoutBtn,
                      (!selectedDeliveryRoom || isPlacingOrder) && styles.checkoutBtnPending,
                    ]}
                    activeOpacity={isPlacingOrder ? 1 : 0.85}
                    disabled={isPlacingOrder || !selectedDeliveryRoom}
                    onPress={handleCheckout}
                  >
                    {isPlacingOrder ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <ActivityIndicator size="small" color={THEME.white} />
                        <Text style={styles.checkoutBtnText}>Placing In-Room Order...</Text>
                      </View>
                    ) : (
                      <>
                        <Ionicons
                          name={selectedDeliveryRoom ? 'checkmark-circle' : 'alert-circle-outline'}
                          size={18}
                          color={THEME.white}
                        />
                        <Text style={styles.checkoutBtnText}>
                          {selectedDeliveryRoom
                            ? `Place Order · LKR ${grandTotalLKR.toLocaleString()}`
                            : 'Select Delivery Room to Order'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 7. ORDER CONFIRMATION MODAL */}
      <Modal
        visible={orderConfirmedVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setOrderConfirmedVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationCard}>
            <View style={styles.confirmedIconCircle}>
              <Ionicons name="checkmark-done" size={36} color={THEME.white} />
            </View>

            <Text style={styles.confirmHeading}>Order Confirmed!</Text>
            <Text style={styles.orderNumber}>ORDER #{activeOrder?.orderCode || activeOrder?.orderId || 'PENDING'}</Text>
            
            <View style={styles.confirmRoomBox}>
              <Text style={styles.confirmRoomLabel}>DELIVERING TO</Text>
              <Text style={styles.confirmRoomVal}>
                {activeOrder?.roomName || 'Room not assigned'}
              </Text>
            </View>

            <View style={styles.etaBox}>
              <Ionicons name="time-outline" size={18} color={THEME.oceanBlue} />
              <Text style={styles.etaText}>
                Estimated Delivery: {activeOrder?.estimatedDelivery || '~30 minutes'}
              </Text>
            </View>

            <Text style={styles.confirmDemoDisclaimer}>
              Your order has been recorded in the resort kitchen system. Status: {activeOrder?.status || 'Pending'}.
            </Text>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setOrderConfirmedVisible(false)}
            >
              <Text style={styles.doneBtnText}>Back to Food Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 8. MY ORDERS MODAL */}
      <Modal
        visible={myOrdersVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setMyOrdersVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalTopHeader}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setMyOrdersVisible(false)}
              >
                <Ionicons name="close" size={20} color={THEME.darkSlate} />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>My In-Room Orders</Text>
              <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 18 }}>
              {activeOrder ? (
                <View style={styles.activeOrderCard}>
                  <View style={styles.orderHeaderRow}>
                    <Text style={styles.orderCode}>{activeOrder.orderCode || activeOrder.orderId}</Text>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusPillText}>{activeOrder.status || 'Pending'}</Text>
                    </View>
                  </View>

                  <Text style={styles.orderItemsPreview}>
                    {activeOrder.items && activeOrder.items.length > 0
                      ? activeOrder.items
                          .map(
                            (it) =>
                              `• ${it.name} x${it.quantity} (LKR ${(
                                it.lineTotal || it.price * it.quantity
                              ).toLocaleString()})`
                          )
                          .join('\n')
                      : '• No items in active order'}
                  </Text>

                  {activeOrder.specialNote && activeOrder.specialNote.trim() ? (
                    <Text style={styles.orderSpecialNote}>
                      Note: {activeOrder.specialNote}
                    </Text>
                  ) : null}

                  <View style={styles.orderFinancialSummary}>
                    <View style={styles.orderFinanceRow}>
                      <Text style={styles.orderFinanceLabel}>Subtotal</Text>
                      <Text style={styles.orderFinanceVal}>
                        LKR {activeOrder.subtotalLKR ? activeOrder.subtotalLKR.toLocaleString() : '0'}
                      </Text>
                    </View>
                    <View style={styles.orderFinanceRow}>
                      <Text style={styles.orderFinanceLabel}>Resort Service Charge (10%)</Text>
                      <Text style={styles.orderFinanceVal}>
                        LKR {activeOrder.serviceChargeLKR ? activeOrder.serviceChargeLKR.toLocaleString() : '0'}
                      </Text>
                    </View>
                    <View style={[styles.orderFinanceRow, { marginTop: 4 }]}>
                      <Text style={[styles.orderFinanceLabel, { fontWeight: '700', color: THEME.darkSlate }]}>
                        Total Amount
                      </Text>
                      <Text style={[styles.orderFinanceVal, { fontWeight: '800', color: THEME.oceanBlue }]}>
                        LKR {activeOrder.totalLKR ? activeOrder.totalLKR.toLocaleString() : '0'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.orderFooterRow}>
                    <Text style={styles.orderDeliveringTo}>
                      Destination: {activeOrder.roomName ? activeOrder.roomName : (activeOrder.roomNumber || 'Room not assigned')}
                    </Text>
                    <Text style={styles.orderPrice}>
                      ETA: {activeOrder.estimatedDelivery || '~30 min'}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyOrdersBox}>
                  <Ionicons name="receipt-outline" size={48} color={THEME.sandBeige} />
                  <Text style={styles.emptyOrdersTitle}>No active in-room orders</Text>
                  <Text style={styles.emptyOrdersSub}>
                    Select culinary dishes from the menu to build your in-room dining order. Real-time kitchen tracking will appear here.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 9. BOTTOM NAVIGATION: Exactly 5 Tabs */}
      <View style={styles.bottomTab}>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => handleNavPress('Home')}>
          <Ionicons name="home-outline" size={20} color={THEME.mutedSlate} />
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => handleNavPress('Rooms')}>
          <Ionicons name="bed-outline" size={20} color={THEME.mutedSlate} />
          <Text style={styles.tabLabel}>Rooms</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => handleNavPress('Explore')}>
          <Ionicons name="compass-outline" size={20} color={THEME.mutedSlate} />
          <Text style={styles.tabLabel}>Explore</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => handleNavPress('Plan')}>
          <Ionicons name="calendar-outline" size={20} color={THEME.mutedSlate} />
          <Text style={styles.tabLabel}>Plan</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => handleNavPress('Profile')}>
          <Ionicons name="person-outline" size={20} color={THEME.mutedSlate} />
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.creamWhite,
    ...(Platform.OS === 'web' && {
      height: '100vh',
      maxWidth: 480,
      alignSelf: 'center',
      width: '100%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
    }),
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 10,
    backgroundColor: THEME.creamWhite,
    borderBottomWidth: 1,
    borderBottomColor: THEME.sandBeige,
  },
  brandingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBackButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: THEME.white,
    borderWidth: 1,
    borderColor: THEME.sandBeige,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.skyBlue,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  brandTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: THEME.oceanBlue,
  },
  ordersButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.sandBeige,
  },
  cartButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.skyBlue,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: THEME.oceanBlue,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: THEME.white,
  },
  cartBadgeText: {
    color: THEME.white,
    fontSize: 10,
    fontWeight: '700',
  },
  titleWrapper: {
    marginTop: 2,
  },
  titlePrimary: {
    fontSize: 24,
    fontWeight: '800',
    color: THEME.darkSlate,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  titleSubtitle: {
    fontSize: 11,
    color: THEME.mutedSlate,
    marginTop: 2,
  },
  notificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.skyBlue,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  notificationText: {
    fontSize: 12,
    color: THEME.darkSlate,
    fontWeight: '600',
    marginLeft: 6,
  },
  demoNoticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.sandBeige,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  demoNoticeText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
    color: THEME.darkSlate,
  },
  categorySection: {
    paddingVertical: 10,
    backgroundColor: THEME.creamWhite,
    borderBottomWidth: 1,
    borderBottomColor: THEME.sandBeige,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryPill: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: THEME.white,
    borderWidth: 1,
    borderColor: THEME.sandBeige,
  },
  categoryPillActive: {
    backgroundColor: THEME.oceanBlue,
    borderColor: THEME.oceanBlue,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.mutedSlate,
  },
  categoryTextActive: {
    color: THEME.white,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionOverline: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.oceanBlue,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: THEME.darkSlate,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  itemCountText: {
    fontSize: 12,
    color: THEME.mutedSlate,
    fontWeight: '500',
  },
  specialsSection: {
    marginTop: 14,
    marginBottom: 22,
  },
  specialsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.softPeach,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  specialsIndicatorText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9C4221',
  },
  specialsScroll: {
    paddingLeft: 20,
    paddingRight: 10,
    gap: 14,
  },
  specialCard: {
    width: 250,
    backgroundColor: THEME.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.sandBeige,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  specialImageContainer: {
    height: 140,
    width: '100%',
    position: 'relative',
  },
  specialImage: {
    width: '100%',
    height: '100%',
  },
  specialBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(38, 59, 70, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  specialBadgeText: {
    color: THEME.white,
    fontSize: 10,
    fontWeight: '700',
  },
  specialInfo: {
    padding: 14,
  },
  specialName: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.darkSlate,
    marginBottom: 4,
  },
  specialDescription: {
    fontSize: 12,
    color: THEME.mutedSlate,
    lineHeight: 16,
    marginBottom: 12,
    minHeight: 32,
  },
  specialFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.sandBeige,
    paddingTop: 8,
  },
  priceLabel: {
    fontSize: 8,
    color: THEME.mutedSlate,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  specialPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.darkSlate,
  },
  specialAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.oceanBlue,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 2,
  },
  specialAddButtonText: {
    color: THEME.white,
    fontSize: 12,
    fontWeight: '700',
  },
  menuSection: {
    paddingHorizontal: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    backgroundColor: THEME.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: THEME.sandBeige,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 4,
  },
  gridCardSoldOut: {
    opacity: 0.65,
    backgroundColor: '#F8F6F0',
  },
  gridImageContainer: {
    height: 110,
    width: '100%',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridImageMuted: {
    opacity: 0.5,
  },
  soldOutOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E53E3E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  soldOutText: {
    color: THEME.white,
    fontSize: 10,
    fontWeight: '700',
  },
  prepPill: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  prepText: {
    fontSize: 9,
    fontWeight: '600',
    color: THEME.darkSlate,
  },
  gridCardBody: {
    padding: 10,
  },
  gridCardCategory: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.oceanBlue,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  gridCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.darkSlate,
    lineHeight: 16,
    marginBottom: 2,
    minHeight: 32,
  },
  gridCardSubtitle: {
    fontSize: 10,
    color: THEME.mutedSlate,
    marginBottom: 6,
  },
  gridCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.sandBeige,
    paddingTop: 8,
  },
  demoPriceSmallLabel: {
    fontSize: 8,
    color: THEME.oceanBlue,
    fontWeight: '700',
  },
  gridPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.darkSlate,
  },
  gridPriceMuted: {
    color: THEME.mutedSlate,
  },
  gridAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.oceanBlue,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
    gap: 2,
  },
  gridAddButtonText: {
    color: THEME.white,
    fontSize: 11,
    fontWeight: '700',
  },
  gridDisabledButton: {
    backgroundColor: THEME.sandBeige,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  gridDisabledButtonText: {
    color: THEME.mutedSlate,
    fontSize: 10,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: THEME.creamWhite,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.sandBeige,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.darkSlate,
  },
  clearCartText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E53E3E',
  },
  modalFoodImage: {
    width: '100%',
    height: 220,
  },
  modalFoodBody: {
    padding: 20,
  },
  modalCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dishBadge: {
    backgroundColor: THEME.skyBlue,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dishBadgeText: {
    color: THEME.oceanBlue,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  detailFoodName: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.darkSlate,
    marginBottom: 4,
  },
  detailFoodPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.oceanBlue,
    marginBottom: 4,
  },
  demoPriceSuffix: {
    fontSize: 11,
    fontWeight: '500',
    color: THEME.mutedSlate,
  },
  detailFoodDesc: {
    fontSize: 13,
    color: THEME.darkSlate,
    lineHeight: 19,
    marginBottom: 16,
  },
  ingredientsBox: {
    backgroundColor: THEME.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.sandBeige,
    padding: 14,
    marginBottom: 20,
  },
  boxTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.mutedSlate,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  ingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  ingText: {
    fontSize: 12,
    color: THEME.darkSlate,
  },
  detailAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.oceanBlue,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  detailAddBtnText: {
    color: THEME.white,
    fontSize: 14,
    fontWeight: '700',
  },
  detailSoldOutBtn: {
    backgroundColor: THEME.sandBeige,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  detailSoldOutBtnText: {
    color: THEME.mutedSlate,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCartBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyCartTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.darkSlate,
  },
  emptyCartSub: {
    fontSize: 12,
    color: THEME.mutedSlate,
    textAlign: 'center',
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.white,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.sandBeige,
    marginBottom: 8,
  },
  cartThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  cartItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.darkSlate,
  },
  cartItemUnitPrice: {
    fontSize: 11,
    color: THEME.oceanBlue,
    fontWeight: '600',
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.creamWhite,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.sandBeige,
  },
  qtyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  qtyNum: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.darkSlate,
    paddingHorizontal: 4,
  },
  deliveryBox: {
    backgroundColor: THEME.white,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.sandBeige,
    marginTop: 10,
    marginBottom: 10,
  },
  deliveryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  selectedPill: {
    backgroundColor: '#C6F6D5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  selectedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#22543D',
  },
  requiredPill: {
    backgroundColor: '#FED7D7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  requiredPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9B2C2C',
  },
  deliveryHelperText: {
    fontSize: 11,
    color: THEME.mutedSlate,
    marginBottom: 10,
  },
  roomSelectWrap: {
    gap: 8,
    marginBottom: 12,
  },
  roomSelectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.creamWhite,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: THEME.sandBeige,
  },
  roomSelectPillActive: {
    borderColor: THEME.oceanBlue,
    backgroundColor: THEME.skyBlue,
  },
  roomSelectName: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.darkSlate,
  },
  roomSelectNameActive: {
    color: THEME.oceanBlue,
    fontWeight: '700',
  },
  roomErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF5F5',
    borderColor: '#FEB2B2',
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  roomErrorText: {
    flex: 1,
    fontSize: 11,
    color: '#C53030',
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: THEME.creamWhite,
    borderWidth: 1,
    borderColor: THEME.sandBeige,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: THEME.darkSlate,
  },
  billBox: {
    backgroundColor: THEME.white,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.sandBeige,
    marginBottom: 14,
    gap: 6,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  billLabel: {
    fontSize: 12,
    color: THEME.mutedSlate,
  },
  billVal: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.darkSlate,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: THEME.sandBeige,
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.darkSlate,
  },
  totalVal: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.oceanBlue,
  },
  demoBillNotice: {
    fontSize: 10,
    color: THEME.mutedSlate,
    fontStyle: 'italic',
    marginTop: 4,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.oceanBlue,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  checkoutBtnPending: {
    backgroundColor: '#7A98A6',
  },
  checkoutBtnText: {
    color: THEME.white,
    fontSize: 14,
    fontWeight: '700',
  },
  confirmationCard: {
    backgroundColor: THEME.white,
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    alignSelf: 'center',
    maxWidth: 400,
  },
  confirmedIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.oceanBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  confirmHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.darkSlate,
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.oceanBlue,
    letterSpacing: 1,
    marginBottom: 10,
  },
  confirmRoomBox: {
    alignItems: 'center',
    backgroundColor: THEME.skyBlue,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
  },
  confirmRoomLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.oceanBlue,
    letterSpacing: 1,
    marginBottom: 2,
  },
  confirmRoomVal: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.darkSlate,
    textAlign: 'center',
  },
  etaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.sandBeige,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    marginBottom: 12,
  },
  etaText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.darkSlate,
  },
  confirmDemoDisclaimer: {
    fontSize: 11,
    color: THEME.mutedSlate,
    textAlign: 'center',
    lineHeight: 15,
    marginBottom: 18,
  },
  doneBtn: {
    backgroundColor: THEME.darkSlate,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  doneBtnText: {
    color: THEME.white,
    fontSize: 13,
    fontWeight: '700',
  },
  activeOrderCard: {
    backgroundColor: THEME.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.sandBeige,
    padding: 14,
    gap: 10,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderCode: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.darkSlate,
  },
  statusPill: {
    backgroundColor: THEME.skyBlue,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.oceanBlue,
  },
  orderItemsPreview: {
    fontSize: 12,
    color: THEME.darkSlate,
    lineHeight: 18,
  },
  orderSpecialNote: {
    fontSize: 11,
    fontStyle: 'italic',
    color: THEME.mutedSlate,
    marginTop: 4,
  },
  orderFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: THEME.sandBeige,
    paddingTop: 8,
  },
  orderDeliveringTo: {
    fontSize: 11,
    color: THEME.mutedSlate,
    flex: 1,
    marginRight: 6,
  },
  orderPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.darkSlate,
  },
  bottomTab: {
    flexDirection: 'row',
    backgroundColor: THEME.white,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.sandBeige,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minWidth: 50,
  },
  tabLabel: {
    fontSize: 10,
    color: THEME.mutedSlate,
    marginTop: 3,
  },
  loadingContainer: {
    paddingVertical: 70,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.darkSlate,
  },
  loadingSubtext: {
    fontSize: 12,
    color: THEME.mutedSlate,
  },
  errorContainer: {
    paddingHorizontal: 28,
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.darkSlate,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 12,
    color: THEME.mutedSlate,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.oceanBlue,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    gap: 6,
    marginTop: 8,
  },
  retryButtonText: {
    color: THEME.white,
    fontSize: 13,
    fontWeight: '700',
  },
  partialErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  partialErrorText: {
    flex: 1,
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
  },
  partialRetryBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F59E0B',
    borderRadius: 6,
  },
  partialRetryText: {
    fontSize: 11,
    color: THEME.white,
    fontWeight: '700',
  },
  emptyMenuBox: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyMenuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME.darkSlate,
    textAlign: 'center',
  },
  emptyMenuSub: {
    fontSize: 12,
    color: THEME.mutedSlate,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  checkoutErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 12,
    gap: 8,
  },
  checkoutErrorText: {
    flex: 1,
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
    lineHeight: 16,
  },
  orderFinancialSummary: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: THEME.sandBeige,
    paddingVertical: 8,
    marginVertical: 4,
    gap: 4,
  },
  orderFinanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderFinanceLabel: {
    fontSize: 11,
    color: THEME.mutedSlate,
  },
  orderFinanceVal: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.darkSlate,
  },
  orderEtaText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.oceanBlue,
  },
  emptyOrdersBox: {
    paddingVertical: 44,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyOrdersTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.darkSlate,
    textAlign: 'center',
  },
  emptyOrdersSub: {
    fontSize: 12,
    color: THEME.mutedSlate,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
});
