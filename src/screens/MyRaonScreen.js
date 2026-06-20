import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSketches } from '../store/sketchStore';
import { TAGS } from '../constants/tags';

export default function MyRaonScreen() {
  const [sketches, setSketches] = useState([]);

  useFocusEffect(useCallback(() => { getSketches().then(setSketches); }, []));

  const now = new Date();
  const thisMonth = sketches.filter(s => {
    const d = new Date(s.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const tagCounts = TAGS.map(tag => ({
    ...tag,
    count: sketches.filter(s => s.tagId === tag.id).length,
  })).sort((a, b) => b.count - a.count);

  const placeMap = {};
  sketches.forEach(s => {
    if (s.placeName) placeMap[s.placeName] = (placeMap[s.placeName] ?? 0) + 1;
  });
  const topPlaces = Object.entries(placeMap).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const encourage = thisMonth.length === 0 ? '이번 달 첫 기록을 남겨보세요! 🌱'
    : thisMonth.length < 5 ? `이번 달 ${thisMonth.length}번 나들이했어요! 계속 기록해봐요 😊`
    : `이번 달 ${thisMonth.length}번 나들이했어요! 정말 활발하네요 🎉`;

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>나의 라온</Text>
      </View>
      <ScrollView contentContainerStyle={s.body}>
        <View style={s.encourageBox}>
          <Text style={s.encourageText}>{encourage}</Text>
        </View>

        <Text style={s.sectionTitle}>이번 달 활동</Text>
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statNum}>{thisMonth.length}</Text>
            <Text style={s.statLabel}>이번 달 기록</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>{sketches.length}</Text>
            <Text style={s.statLabel}>전체 스케치</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>활동 태그별 횟수</Text>
        {tagCounts.map(tag => (
          <View key={tag.id} style={s.tagRow}>
            <View style={[s.tagDot, { backgroundColor: tag.color }]}>
              <Text style={{ fontSize: 14 }}>{tag.emoji}</Text>
            </View>
            <Text style={s.tagName}>{tag.label}</Text>
            <View style={s.barWrap}>
              <View style={[s.bar, { width: `${sketches.length ? (tag.count / sketches.length) * 100 : 0}%`, backgroundColor: tag.color }]} />
            </View>
            <Text style={s.tagCount}>{tag.count}회</Text>
          </View>
        ))}

        {topPlaces.length > 0 && (
          <>
            <Text style={s.sectionTitle}>자주 간 장소 TOP 3</Text>
            {topPlaces.map(([name, cnt], i) => (
              <View key={name} style={s.placeRow}>
                <Text style={s.placeRank}>{i + 1}</Text>
                <Text style={s.placeName}>{name}</Text>
                <Text style={s.placeCount}>{cnt}회</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderColor: '#e0e0e0' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#1a1a1a' },
  body: { padding: 16, gap: 8 },
  encourageBox: { backgroundColor: '#E1F5EE', borderRadius: 12, padding: 14, marginBottom: 8 },
  encourageText: { fontSize: 14, color: '#085041', lineHeight: 22 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginTop: 8, marginBottom: 8 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  statCard: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 12, padding: 16, alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: '600', color: '#0F6E56' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  tagDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tagName: { fontSize: 13, color: '#333', width: 50 },
  barWrap: { flex: 1, height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 4 },
  tagCount: { fontSize: 12, color: '#888', width: 28, textAlign: 'right' },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5, borderColor: '#f0f0f0' },
  placeRank: { fontSize: 16, fontWeight: '600', color: '#0F6E56', width: 20 },
  placeName: { flex: 1, fontSize: 13, color: '#333' },
  placeCount: { fontSize: 12, color: '#888' },
});
