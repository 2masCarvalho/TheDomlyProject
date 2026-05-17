import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface Choice<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  label?: string;
  value?: T;
  choices: Choice<T>[];
  onChange: (value: T) => void;
  error?: string;
}

export function ChoicePicker<T extends string>({ label, value, choices, onChange, error }: Props<T>) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {choices.map((c) => {
          const selected = c.value === value;
          return (
            <Pressable
              key={c.value}
              onPress={() => onChange(c.value)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{c.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151' },
  row: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  chipSelected: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  chipLabel: { fontSize: 14, color: '#374151', fontWeight: '500' },
  chipLabelSelected: { color: '#fff' },
  error: { fontSize: 13, color: '#DC2626' },
});
