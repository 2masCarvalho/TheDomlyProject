import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface Props {
  uris: string[];
  onChange: (uris: string[]) => void;
  max?: number;
}

export function PhotoPicker({ uris, onChange, max = 5 }: Props) {
  const remaining = max - uris.length;

  async function ensurePermission(kind: 'camera' | 'library') {
    const fn =
      kind === 'camera'
        ? ImagePicker.requestCameraPermissionsAsync
        : ImagePicker.requestMediaLibraryPermissionsAsync;
    const result = await fn();
    if (!result.granted) {
      Alert.alert(
        'Permissão necessária',
        kind === 'camera'
          ? 'Domly precisa de aceder à câmara para tirar fotografias.'
          : 'Domly precisa de aceder às fotografias para anexar imagens.',
      );
      return false;
    }
    return true;
  }

  async function pickFromLibrary() {
    if (remaining <= 0) return;
    if (!(await ensurePermission('library'))) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.7,
      base64: false,
    });
    if (result.canceled) return;
    const newUris = result.assets.map((a) => a.uri);
    onChange([...uris, ...newUris].slice(0, max));
  }

  async function takePhoto() {
    if (remaining <= 0) return;
    if (!(await ensurePermission('camera'))) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: false,
    });
    if (result.canceled) return;
    const uri = result.assets[0]?.uri;
    if (uri) onChange([...uris, uri].slice(0, max));
  }

  function removeAt(index: number) {
    onChange(uris.filter((_, i) => i !== index));
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>Fotografias</Text>
        <Text style={styles.count}>{uris.length}/{max}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {uris.map((uri, i) => (
          <View key={`${uri}-${i}`} style={styles.thumbWrap}>
            <Image source={{ uri }} style={styles.thumb} contentFit="cover" />
            <Pressable onPress={() => removeAt(i)} style={styles.removeBtn} hitSlop={8}>
              <Ionicons name="close" size={14} color="#fff" />
            </Pressable>
          </View>
        ))}
        {remaining > 0 ? (
          <>
            <Pressable onPress={takePhoto} style={[styles.thumbWrap, styles.addBtn]}>
              <Ionicons name="camera" size={26} color="#2563EB" />
              <Text style={styles.addLabel}>Câmara</Text>
            </Pressable>
            <Pressable onPress={pickFromLibrary} style={[styles.thumbWrap, styles.addBtn]}>
              <Ionicons name="images" size={26} color="#2563EB" />
              <Text style={styles.addLabel}>Galeria</Text>
            </Pressable>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, fontWeight: '500', color: '#374151' },
  count: { fontSize: 13, color: '#6B7280' },
  row: { gap: 10 },
  thumbWrap: { width: 84, height: 84, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  thumb: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(17,24,39,0.85)',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    gap: 4,
  },
  addLabel: { fontSize: 12, color: '#2563EB', fontWeight: '500' },
});
