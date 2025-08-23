import React, { useState } from 'react';
import type { ImageSourcePropType, ListRenderItemInfo } from 'react-native';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('screen');
const ITEM_SIZE = Math.round(width * 0.24);
const ITEM_GAP = 16; // total horizontal gap between items
const ITEM_PADDING = 6; // space to show background when selected

const images: ImageSourcePropType[] = [
  require('../../assets/images/achu.jpg'),
  require('../../assets/images/devu.jpg'),
  require('../../assets/images/ammaji.jpg'),
  require('../../assets/images/ash.jpg'),
  require('../../assets/images/papa.jpg'),
];

type CarouselItemProps = {
  source: ImageSourcePropType;
  index: number;
  scrollX: Animated.SharedValue<number>;
  isSelected: boolean;
  onPress: () => void;
};

function CarouselItem({ source, index, scrollX, isSelected, onPress }: CarouselItemProps) {
  const fullItem = ITEM_SIZE + ITEM_GAP; // item width + gap

  const animatedStyle = useAnimatedStyle(() => {
    // Calculate distance of this item's center from the screen's center in scroll coordinates
    const centerOffset = (width - ITEM_SIZE) / 2; // padding applied to contentContainerStyle
    const centerX = scrollX.value + centerOffset; // current center position in content space
    const itemCenterX = index * fullItem + ITEM_SIZE / 2; // this item's center position

    const distance = Math.abs(centerX - itemCenterX);

    // Keep size the same (preserves layout), just lift the focused item vertically
    const translateY = interpolate(distance, [0, fullItem], [-16, 0], Extrapolate.CLAMP);
    const opacity = interpolate(distance, [0, fullItem], [1, 0.85], Extrapolate.CLAMP);

    return {
      transform: [{ translateY }],
      opacity,
    };
  }, []);

  return (
    <Pressable onPress={onPress} hitSlop={8}>
      <Animated.View
        style={[
          styles.itemContainer,
          animatedStyle,
          isSelected ? styles.itemSelected : null,
        ]}
      >
        <Animated.Image source={source} style={styles.image} />
      </Animated.View>
    </Pressable>
  );
}

// Background Component without blur
function AnimatedBackground({ scrollX }: { scrollX: Animated.SharedValue<number> }) {
  const fullItem = ITEM_SIZE + ITEM_GAP;
  
  // Calculate the current active index based on scroll position
  const activeIndex = useDerivedValue(() => {
    const centerOffset = (width - ITEM_SIZE) / 2;
    const centerX = scrollX.value + centerOffset;
    const index = Math.round(centerX / fullItem);
    return Math.max(0, Math.min(images.length - 1, index));
  });

  // Create animated styles for each background image
  const backgroundStyles = images.map((_, index) =>
    useAnimatedStyle(() => {
      const opacity = activeIndex.value === index ? 1 : 0;
      return {
        opacity,
      };
    })
  );

  return (
    <View style={styles.backgroundContainer}>
      {images.map((image, index) => (
        <Animated.Image
          key={index}
          source={image}
          style={[styles.backgroundImage, backgroundStyles[index]]}
          // Removed blurRadius
        />
      ))}
      {/* Optional: Light overlay to improve carousel visibility */}
      <View style={styles.overlay} />
    </View>
  );
}

export function CircularSlider() {
  const scrollX = useSharedValue(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Reanimated v2+ scroll handler
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const renderItem = ({ item, index }: ListRenderItemInfo<ImageSourcePropType>) => (
    <CarouselItem
      source={item}
      index={index}
      scrollX={scrollX}
      isSelected={selectedIndex === index}
      onPress={() => setSelectedIndex(index)}
    />
  );

  return (
    <View style={styles.container}>
      {/* Background that changes based on scroll */}
      <AnimatedBackground scrollX={scrollX} />
      
      {/* Carousel positioned at the bottom */}
      <View style={styles.carouselContainer}>
        <Animated.FlatList
          data={images}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          // This padding centers the first and last items
          contentContainerStyle={{ 
            paddingHorizontal: (width - ITEM_SIZE) / 2, 
            alignItems: 'center' 
          }}
          onScroll={onScroll}
          scrollEventThrottle={16}
          snapToInterval={ITEM_SIZE + ITEM_GAP} // Enable snapping
          decelerationRate="fast"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImage: {
    position: 'absolute',
    width: width,
    height: height,
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Lighter overlay since no blur
  },
  carouselContainer: {
    position: 'absolute',
    bottom: 50, // Position at the bottom with some margin
    left: 0,
    right: 0,
    zIndex: 1, // Ensure carousel is above background
  },
  itemContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    marginHorizontal: ITEM_GAP / 2,
    borderRadius: ITEM_SIZE / 2,
    overflow: 'hidden',
    padding: ITEM_PADDING,
    backgroundColor: 'transparent',
    // Enhanced shadow for better visibility without blur
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  itemSelected: {
    backgroundColor: '#D0EBFF', // light highlight
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: (ITEM_SIZE - ITEM_PADDING * 2) / 2,
  },
});
