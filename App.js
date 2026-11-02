
import React, { useState, useRef } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { recognizeText } from 'expo-ocr-kit';

const C = {
  bg: '#F7F8F3',
  sage: '#879B83',
  dark: '#344638',
  muted: '#788276',
  white: '#FFFFFF',
  light: '#E7EDE3',
  border: '#E8EBE4',
};

const categories = [
  { icon: '💊', name: 'Medicines' },
  { icon: '🩹', name: 'First Aid' },
  { icon: '🧴', name: 'Personal Care' },
  { icon: '🩺', name: 'Healthcare' },
];

const initialProducts = [
  { id: '1', icon: '💊', name: 'Daily Wellness', detail: 'Health essentials', price: 99 },
  { id: '2', icon: '🩹', name: 'First Aid Kit', detail: 'Home care', price: 149 },
  { id: '3', icon: '🧴', name: 'Personal Care', detail: 'Everyday care', price: 129 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState({});
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [barcodeType, setBarcodeType] = useState('');
  const [photo, setPhoto] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [isRecognizing, setIsRecognizing] = useState(false);

  const cameraRef = useRef(null);

  const cartCount = Object.values(cart).reduce(
    (sum, qty) => sum + qty,
    0
  );

  const cartTotal = initialProducts.reduce(
    (sum, p) => sum + p.price * (cart[p.id] || 0),
    0
  );

  const openScanner = async () => {
    setScanned(false);
    setBarcode('');
    setBarcodeType('');
    setPhoto(null);
    setOcrText('');
    setCameraReady(false);
    setIsRecognizing(false);
    setActiveTab('Scan');

    if (!permission?.granted) {
      const result = await requestPermission();

      if (!result.granted) {
        Alert.alert(
          'Camera permission required',
          'Allow CareDoor to access your camera to scan medicine packaging.'
        );
      }
    }
  };

  const handleBarcode = ({ data, type }) => {
    if (scanned) return;

    setScanned(true);
    setBarcode(String(data));
    setBarcodeType(type || 'Barcode');
  };

  const takePhoto = async () => {
    if (!cameraRef.current || !cameraReady) {
      Alert.alert(
        'Camera is starting',
        'Please wait a moment and try again.'
      );
      return;
    }

    try {
      const result = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (result?.uri) {
        setPhoto(result.uri);
        setOcrText('');
      }
    } catch {
      Alert.alert(
        'Camera error',
        'Could not take the picture. Please try again.'
      );
    }
  };

  const readMedicineLabel = async () => {
    if (!photo) {
      Alert.alert(
        'No photo',
        'Take a packaging photo first.'
      );
      return;
    }

    setIsRecognizing(true);
    setOcrText('');

    try {
      const result = await recognizeText(photo);
      const text = result?.text?.trim() || '';

      setOcrText(text);

      if (!text) {
        Alert.alert(
          'No text found',
          'Try taking a clearer photo with better lighting.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Text recognition failed',
        error?.message ||
          'Please check your development build and try again.'
      );
    } finally {
      setIsRecognizing(false);
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
    setOcrText('');
    setCameraReady(false);
  };

  const addItem = (id) => {
    setCart((old) => ({
      ...old,
      [id]: (old[id] || 0) + 1,
    }));
  };

  const changeQty = (id, amount) => {
    setCart((old) => {
      const next = { ...old };
      const quantity = (next[id] || 0) + amount;

      if (quantity <= 0) {
        delete next[id];
      } else {
        next[id] = quantity;
      }

      return next;
    });
  };

  const goHome = () => setActiveTab('Home');

  const Header = () => (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>C</Text>
        </View>

        <View>
          <Text style={styles.brand}>CareDoor</Text>
          <Text style={styles.tagline}>
            Healthcare, closer to you
          </Text>
        </View>

        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => setActiveTab('Cart')}
        >
          <Text style={styles.cartIcon}>🛍️</Text>

          {cartCount > 0 && (
            <Text style={styles.cartCount}>{cartCount}</Text>
          )}
        </TouchableOpacity>
      </View>

      {activeTab === 'Home' && (
        <>
          <View style={styles.location}>
            <Text style={styles.locationLabel}>
              DELIVERING TO
            </Text>
            <Text style={styles.locationValue}>
              📍 Manipur, India
            </Text>
          </View>

          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>⌕</Text>

            <TextInput
              placeholder="Search healthcare products..."
              placeholderTextColor="#92998F"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />

            <TouchableOpacity
              style={styles.scanButton}
              onPress={openScanner}
            >
              <Text style={styles.scanText}>▦</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  const SectionTitle = ({ title, action, onPress }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {action ? (
        <TouchableOpacity onPress={onPress}>
          <Text style={styles.smallText}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const ProductCard = ({ item }) => (
    <View style={styles.product}>
      <View style={styles.productIcon}>
        <Text style={styles.productEmoji}>{item.icon}</Text>
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDetail}>{item.detail}</Text>
        <Text style={styles.price}>₹{item.price}</Text>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => addItem(item.id)}
      >
        <Text style={styles.addText}>+ Add</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHome = () => {
    const filtered = initialProducts.filter((p) =>
      `${p.name} ${p.detail}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );

    return (
      <>
        <View style={styles.welcome}>
          <Text style={styles.eyebrow}>
            YOUR HEALTH, OUR CARE
          </Text>

          <Text style={styles.heading}>
            Wellness starts{'\n'}at your doorstep.
          </Text>

          <Text style={styles.description}>
            Everyday healthcare, made simpler for you and your family.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setSearch('')}
          >
            <Text style={styles.primaryButtonText}>
              Explore essentials →
            </Text>
          </TouchableOpacity>

          <View style={styles.decorCircle}>
            <Text style={styles.decorIcon}>🌿</Text>
          </View>
        </View>

        <SectionTitle
          title="Shop by category"
          action="Explore care"
        />

        <View style={styles.categories}>
          {categories.map((item) => (
            <TouchableOpacity
              key={item.name}
              style={styles.category}
              onPress={() => setSearch(item.name)}
            >
              <View style={styles.categoryIcon}>
                <Text style={styles.categoryEmoji}>
                  {item.icon}
                </Text>
              </View>

              <Text style={styles.categoryName}>
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionTitle
          title="Everyday essentials"
          action="View all →"
          onPress={() => setSearch('')}
        />

        {filtered.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}

        {filtered.length === 0 && (
          <Text style={styles.emptyText}>
            No sample products found. Try another search.
          </Text>
        )}

        <View style={styles.note}>
          <Text style={styles.noteIcon}>♡</Text>

          <View style={{ flex: 1 }}>
            <Text style={styles.noteTitle}>
              Care you can trust
            </Text>

            <Text style={styles.noteText}>
              Always check medicine labels and use licensed pharmacies.
            </Text>
          </View>
        </View>
      </>
    );
  };

  const renderScanner = () => {
    if (!permission) {
      return (
        <Text style={styles.description}>
          Checking camera permission…
        </Text>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.centerPanel}>
          <Text style={styles.bigIcon}>📷</Text>

          <Text style={styles.pageTitle}>
            Scan your medicine
          </Text>

          <Text style={styles.description}>
            Camera access is needed to photograph packaging and read barcodes.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={requestPermission}
          >
            <Text style={styles.primaryButtonText}>
              Allow camera access
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goHome}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryText}>
              Back to home
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        <Text style={styles.pageTitle}>
          Medicine scanner
        </Text>

        <Text style={styles.description}>
          Place a medicine barcode inside the frame, or photograph the label.
        </Text>

        {!photo ? (
          <View style={styles.cameraFrame}>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="back"
              onCameraReady={() => setCameraReady(true)}
              onBarcodeScanned={
                scanned ? undefined : handleBarcode
              }
              barcodeScannerSettings={{
                barcodeTypes: [
                  'qr',
                  'ean13',
                  'ean8',
                  'upc_a',
                  'upc_e',
                  'code128',
                  'code39',
                  'code93',
                  'itf14',
                  'pdf417',
                ],
              }}
            />

            <View
              pointerEvents="none"
              style={styles.scanFrame}
            >
              <View style={styles.scanCornerTL} />
              <View style={styles.scanCornerTR} />
              <View style={styles.scanCornerBL} />
              <View style={styles.scanCornerBR} />
            </View>

            <View style={styles.cameraHint}>
              <Text style={styles.cameraHintText}>
                Align the barcode or medicine label here
              </Text>
            </View>
          </View>
        ) : (
          <Image
            source={{ uri: photo }}
            style={styles.capturedImage}
            resizeMode="contain"
          />
        )}

        {barcode !== '' && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>
              Barcode detected
            </Text>

            <Text style={styles.resultValue}>
              {barcode}
            </Text>

            <Text style={styles.resultMeta}>
              Format: {barcodeType}
            </Text>

            <Text style={styles.noteText}>
              This is the barcode value, not a verified medicine identity.
            </Text>
          </View>
        )}

        {photo && (
          <>
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>
                Packaging photo captured
              </Text>

              <Text style={styles.noteText}>
                Your photo is ready. Tap below to read the text on the label.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                isRecognizing && styles.disabledButton,
              ]}
              onPress={readMedicineLabel}
              disabled={isRecognizing}
            >
              <Text style={styles.primaryButtonText}>
                {isRecognizing
                  ? 'Reading label...'
                  : 'Read Medicine Label'}
              </Text>
            </TouchableOpacity>

            {ocrText !== '' && (
              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>
                  Recognized Text
                </Text>

                <Text style={styles.resultValue}>
                  {ocrText}
                </Text>

                <Text style={styles.noteText}>
                  Text recognition may make mistakes. Verify the medicine
                  name, strength, and manufacturer against the original
                  packaging. This result does not confirm medicine
                  authenticity or whether the medicine is suitable for you.
                </Text>
              </View>
            )}
          </>
        )}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={photo ? retakePhoto : takePhoto}
        >
          <Text style={styles.primaryButtonText}>
            {photo ? 'Retake photo' : 'Take packaging photo'}
          </Text>
        </TouchableOpacity>

        {scanned && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              setScanned(false);
              setBarcode('');
              setBarcodeType('');
            }}
          >
            <Text style={styles.secondaryText}>
              Scan another barcode
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={goHome}
        >
          <Text style={styles.secondaryText}>
            Back to home
          </Text>
        </TouchableOpacity>
      </>
    );
  };

  const renderCart = () => {
    const items = initialProducts.filter(
      (p) => (cart[p.id] || 0) > 0
    );

    return (
      <>
        <Text style={styles.pageTitle}>Your cart</Text>

        <Text style={styles.description}>
          Review your selected items.
        </Text>

        {items.length === 0 ? (
          <View style={styles.centerPanel}>
            <Text style={styles.bigIcon}>🛍️</Text>

            <Text style={styles.productName}>
              Your cart is empty
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={goHome}
            >
              <Text style={styles.primaryButtonText}>
                Explore products
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {items.map((item) => (
              <View key={item.id} style={styles.cartRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>
                    {item.name}
                  </Text>

                  <Text style={styles.price}>
                    ₹{item.price} each
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.qtyButton}
                  onPress={() => changeQty(item.id, -1)}
                >
                  <Text style={styles.qtyText}>−</Text>
                </TouchableOpacity>

                <Text style={styles.qtyValue}>
                  {cart[item.id]}
                </Text>

                <TouchableOpacity
                  style={styles.qtyButton}
                  onPress={() => changeQty(item.id, 1)}
                >
                  <Text style={styles.qtyText}>+</Text>
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                ₹{cartTotal}
              </Text>
            </View>

            <Text style={styles.noteText}>
              Sample cart only. Checkout and payment are not connected yet.
            </Text>
          </>
        )}
      </>
    );
  };

  const renderOtherTab = () => (
    <View style={styles.centerPanel}>
      <Text style={styles.bigIcon}>♡</Text>

      <Text style={styles.pageTitle}>
        {activeTab}
      </Text>

      <Text style={styles.description}>
        Your CareDoor {activeTab.toLowerCase()} section will be set up here.
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={goHome}
      >
        <Text style={styles.primaryButtonText}>
          Back to home
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={C.bg}
      />

      <Header />

      <ScrollView
        key={activeTab}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'Home' && renderHome()}
        {activeTab === 'Scan' && renderScanner()}
        {activeTab === 'Cart' && renderCart()}

        {(activeTab === 'Categories' ||
          activeTab === 'Account') &&
          renderOtherTab()}
      </ScrollView>

      <View style={styles.bottomNav}>
        {[
          { name: 'Home', icon: '⌂' },
          { name: 'Categories', icon: '▦' },
          { name: 'Scan', icon: '◎' },
          { name: 'Cart', icon: '🛍' },
          { name: 'Account', icon: '○' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.name}
            style={styles.navItem}
            onPress={() =>
              tab.name === 'Scan'
                ? openScanner()
                : setActiveTab(tab.name)
            }
          >
            <Text
              style={[
                styles.navIcon,
                activeTab === tab.name && styles.navActive,
              ]}
            >
              {tab.icon}
            </Text>

            <Text
              style={[
                styles.navLabel,
                activeTab === tab.name && styles.navActive,
              ]}
            >
              {tab.name}
            </Text>

            {tab.name === 'Cart' && cartCount > 0 && (
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>
                  {cartCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: C.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  logoText: {
    color: C.white,
    fontSize: 27,
    fontWeight: '700',
  },
  brand: {
    color: C.dark,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  tagline: {
    color: C.muted,
    fontSize: 11,
    marginTop: 2,
  },
  cartButton: {
    marginLeft: 'auto',
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIcon: {
    fontSize: 21,
  },
  cartCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: C.sage,
    color: C.white,
    borderRadius: 10,
    minWidth: 19,
    textAlign: 'center',
    fontSize: 11,
    overflow: 'hidden',
    padding: 2,
  },
  location: {
    marginTop: 18,
    marginBottom: 12,
  },
  locationLabel: {
    fontSize: 9,
    letterSpacing: 1.6,
    color: C.muted,
    fontWeight: '700',
  },
  locationValue: {
    marginTop: 4,
    color: C.dark,
    fontSize: 13,
    fontWeight: '600',
  },
  searchBox: {
    height: 51,
    borderRadius: 16,
    backgroundColor: C.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchIcon: {
    fontSize: 25,
    color: C.sage,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: C.dark,
    paddingVertical: 8,
  },
  scanButton: {
    width: 35,
    height: 35,
    backgroundColor: C.light,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanText: {
    color: C.dark,
    fontSize: 22,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  welcome: {
    backgroundColor: C.light,
    borderRadius: 24,
    padding: 21,
    marginTop: 10,
    minHeight: 220,
    overflow: 'hidden',
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 1.7,
    color: C.sage,
    fontWeight: '700',
  },
  heading: {
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '700',
    color: C.dark,
    marginTop: 12,
  },
  description: {
    fontSize: 12,
    lineHeight: 19,
    color: C.muted,
    marginTop: 9,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: C.dark,
    paddingVertical: 13,
    paddingHorizontal: 17,
    borderRadius: 12,
    marginTop: 17,
  },
  primaryButtonText: {
    color: C.white,
    fontSize: 12,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  decorCircle: {
    position: 'absolute',
    right: -19,
    bottom: 22,
    width: 105,
    height: 105,
    borderRadius: 55,
    backgroundColor: '#D4E0CF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorIcon: {
    fontSize: 47,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 25,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.dark,
  },
  smallText: {
    fontSize: 10,
    color: C.sage,
    fontWeight: '600',
  },
  categories: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  category: {
    alignItems: 'center',
    width: '24%',
  },
  categoryIcon: {
    width: 59,
    height: 59,
    borderRadius: 19,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  categoryEmoji: {
    fontSize: 25,
  },
  categoryName: {
    fontSize: 9,
    color: C.dark,
    marginTop: 8,
    textAlign: 'center',
  },
  product: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: C.white,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  productIcon: {
    width: 62,
    height: 68,
    borderRadius: 14,
    backgroundColor: C.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productEmoji: {
    fontSize: 27,
  },
  productInfo: {
    flex: 1,
    marginLeft: 13,
  },
  productName: {
    fontSize: 12,
    fontWeight: '700',
    color: C.dark,
  },
  productDetail: {
    fontSize: 10,
    color: C.muted,
    marginTop: 4,
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    color: C.dark,
    marginTop: 6,
  },
  addButton: {
    borderWidth: 1,
    borderColor: C.sage,
    borderRadius: 10,
    padding: 10,
  },
  addText: {
    color: C.sage,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyText: {
    color: C.muted,
    fontSize: 12,
    paddingVertical: 18,
  },
  note: {
    marginTop: 12,
    backgroundColor: C.light,
    padding: 15,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  noteIcon: {
    fontSize: 25,
    color: C.sage,
  },
  noteTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.dark,
  },
  noteText: {
    fontSize: 10,
    lineHeight: 16,
    color: C.muted,
    marginTop: 5,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: C.white,
    paddingTop: 10,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navIcon: {
    fontSize: 22,
    color: C.muted,
  },
  navLabel: {
    fontSize: 9,
    color: C.muted,
  },
  navActive: {
    color: C.sage,
    fontWeight: '700',
  },
  navBadge: {
    position: 'absolute',
    top: -5,
    right: 10,
    minWidth: 16,
    height: 16,
    backgroundColor: C.sage,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBadgeText: {
    color: C.white,
    fontSize: 9,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: C.dark,
    marginTop: 12,
  },
  centerPanel: {
    alignItems: 'center',
    paddingTop: 35,
    paddingHorizontal: 8,
  },
  bigIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  secondaryButton: {
    alignSelf: 'center',
    padding: 12,
    marginTop: 6,
  },
  secondaryText: {
    color: C.sage,
    fontSize: 12,
    fontWeight: '600',
  },
  cameraFrame: {
    height: 350,
    marginTop: 20,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#202820',
  },
  scanFrame: {
    position: 'absolute',
    top: '30%',
    left: '12%',
    right: '12%',
    height: 125,
  },
  scanCornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FFFFFF',
    borderTopLeftRadius: 10,
  },
  scanCornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#FFFFFF',
    borderTopRightRadius: 10,
  },
  scanCornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FFFFFF',
    borderBottomLeftRadius: 10,
  },
  scanCornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#FFFFFF',
    borderBottomRightRadius: 10,
  },
  cameraHint: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: '#00000099',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  cameraHintText: {
    color: C.white,
    fontSize: 11,
  },
  resultCard: {
    backgroundColor: C.white,
    padding: 16,
    borderRadius: 16,
    marginTop: 15,
    borderWidth: 1,
    borderColor: C.border,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.dark,
  },
  resultValue: {
    fontSize: 17,
    fontWeight: '700',
    color: C.sage,
    marginTop: 8,
  },
  resultMeta: {
    fontSize: 11,
    color: C.muted,
    marginTop: 5,
  },
  capturedImage: {
    width: '100%',
    height: 300,
    borderRadius: 20,
    marginTop: 20,
    backgroundColor: C.light,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 15,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 20,
    color: C.dark,
  },
  qtyValue: {
    fontSize: 13,
    fontWeight: '700',
    color: C.dark,
    marginHorizontal: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: C.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: C.dark,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: C.dark,
  },
});
