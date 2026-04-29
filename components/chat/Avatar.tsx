// features/chat/components/Avatar.tsx
import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Colors } from './Colors';

interface AvatarProps {
  src?: string | null;
  initials: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
}

const SIZES = {
  xs: 24, sm: 32, md: 40, lg: 56, xl: 80,
};
const FONT_SIZES = {
  xs: 9, sm: 12, md: 14, lg: 18, xl: 24,
};
const DOT_SIZES = {
  xs: 8, sm: 10, md: 12, lg: 14, xl: 16,
};

export default function Avatar({ src, initials, size = 'md', online }: AvatarProps) {
  const dim = SIZES[size];
  const fontSize = FONT_SIZES[size];
  const dotSize = DOT_SIZES[size];

  return (
    <View style={{ width: dim, height: dim }}>
      {src ? (
        <Image
          source={{ uri: src }}
          style={[styles.avatar, { width: dim, height: dim, borderRadius: dim / 2 }]}
        />
      ) : (
        <View style={[styles.initials, { width: dim, height: dim, borderRadius: dim / 2 }]}>
          <Text style={[styles.initialsText, { fontSize }]}>{initials || '?'}</Text>
        </View>
      )}
      {online !== undefined && (
        <View style={[
          styles.dot,
          {
            width: dotSize, height: dotSize, borderRadius: dotSize / 2,
            backgroundColor: online ? Colors.online : Colors.offline,
            bottom: 0, right: 0,
          },
        ]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { resizeMode: 'cover' },
  initials: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: { color: Colors.white, fontWeight: '700' },
  dot: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: Colors.white,
  },
});