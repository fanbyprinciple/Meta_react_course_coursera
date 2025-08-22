import React from 'react';
import type { ImageSourcePropType, ListRenderItemInfo } from 'react-native';
import { Dimensions, FlatList, Image, StyleSheet, View } from 'react-native';

const { width } = Dimensions.get('screen');
const ITEM_SIZE = Math.round(width * 0.24);

const images: ImageSourcePropType[] = [
  require('../../assets/images/achu.jpg'),
  require('../../assets/images/devu.jpg'),
  require('../../assets/images/ammaji.jpg'),
  require('../../assets/images/ash.jpg'),
  require('../../assets/images/papa.jpg'),
];

type CarouselItemProps = {
  source: ImageSourcePropType;
};

function CarouselItem({ source }: CarouselItemProps) {
  return (
    <View style={styles.itemContainer}>
      <Image source={source} style={styles.image} />
    </View>
  );
}

export function CircularSlider() {
  const renderItem = ({ item }: ListRenderItemInfo<ImageSourcePropType>) => (
    <CarouselItem source={item} />
  );

  return (
    <View style={styles.container}>
      <FlatList
        style={{flexGrow: 0, backgroundColor:"red"}}
        data={images}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end"
  },
  listContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  itemContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    marginHorizontal: 8,
    borderRadius: ITEM_SIZE / 2,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
