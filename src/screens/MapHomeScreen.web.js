import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, Dimensions, Modal, SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSketches } from '../store/sketchStore';
import { TAGS } from '../constants/tags';

const { width } = Dimensions.get('window');

export default function MapHomeScreen({ navigation }) {
  const [sketches, setSketches] = useState([]);
  const [activeTag, setActiveTag] = useState(null);
  const [selectedSketch, setSelectedSketch] = useState(null);

  useFocusEffect(
    useCallback(() => { getSketches().then(setSketches); }, []),
  );

  const filtered = activeTag ? sketches.filter(s => s.tagId === activeTag) : sketches;
  const tagOf = id => TAGS.find(t => t.id === id);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.headerSub}>
            {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
          </Text>
          <Text style={s.headerTitle}>라온스케치 🗺️</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tagRow} contentContainerStyle={s.tagContent}>
        <TouchableOpacity style={[s.tagChip, !activeTag && s.tagChipActive]} onPress={() => setActiveTag(null)}>
          <Text style={[s.tagText, !activeTag && s.tagTextActive]}>전체</Text>
        </TouchableOpacity>
        {TAGS.map(tag => (
          <TouchableOpacity key={tag.id}
            style={[s.tagChip, activeTag === tag.id && { backgroundColor: tag.bg, borderColor: tag.color }]}
            onPress={() => setActiveTag(activeTag === tag.id ? null : tag.id)}>
            <Text style={[s.tagText, activeTag === tag.id && { color: tag.color, fontWeight: '600' }]}>
              {tag.emoji} {tag.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 웹에서는 지도 대신 스케치 목록 표시 */}
      <View style={s.mapPlaceholder}>
        <Text style={s.mapPlaceholderIcon}>🗺️</Text>
        <Text style={s.mapPlaceholderText}>지도는 모바일 앱에서 확인하세요</Text>
        <Text style={s.mapPlaceholderSub}>총 {filtered.length}개의 스케치</Text>
      </View>

      <View style={s.recentSection}>
        <View style={s.recentHeader}>
          <Text style={s.recentTitle}>스케치 목록</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.recentContent}>
          {filtered.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyText}>아직 스케치가 없어요</Text>
            </View>
          ) : (
            filtered.map(sketch => {
              const tag = tagOf(sketch.tagId);
              return (
                <TouchableOpacity key={sketch.id} style={s.card} onPress={() => setSelectedSketch(sketch)}>
                  {sketch.photos?.[0] ? (
                    <Image source={{ uri: sketch.photos[0] }} style={s.cardImg} />
                  ) : (
                    <View style={[s.cardImg, { backgroundColor: tag?.bg ?? '#f0f0f0', alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ fontSize: 28 }}>{tag?.emoji ?? '📌'}</Text>
                    </View>
                  )}
                  <View style={s.cardBody}>
                    <Text style={s.cardTitle} numberOfLines={1}>{sketch.title}</Text>
                    <Text style={s.cardDate}>
                      {new Date(sketch.createdAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>

      {selectedSketch && (
        <Modal transparent animationType="slide" onRequestClose={() => setSelectedSketch(null)}>
          <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setSelectedSketch(null)}>
            <View style={s.popup}>
              {selectedSketch.photos?.[0] ? (
                <Image source={{ uri: selectedSketch.photos[0] }} style={s.popupImg} />
              ) : (
                <View style={[s.popupImg, { backgroundColor: tagOf(selectedSketch.tagId)?.bg ?? '#f0f0f0', alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 52 }}>{tagOf(selectedSketch.tagId)?.emoji ?? '📌'}</Text>
                </View>
              )}
              <View style={s.popupBody}>
                <Text style={s.popupTitle}>{selectedSketch.title}</Text>
                {selectedSketch.placeName ? <Text style={s.popupPlace}>📍 {selectedSketch.placeName}</Text> : null}
                {selectedSketch.memo ? <Text style={s.popupMemo}>{selectedSketch.memo}</Text> : null}
                <Text style={s.popupDate}>
                  {selectedSketch.weather}{'  '}{selectedSketch.mood}{'  '}
                  {new Date(selectedSketch.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: '#0F6E56', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  headerSub: { fontSize: 11, color: '#9FE1CB' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#E1F5EE', marginTop: 2 },
  tagRow: { maxHeight: 48, borderBottomWidth: 0.5, borderColor: '#e0e0e0' },
  tagContent: { paddingHorizontal: 12, alignItems: 'center', gap: 6, paddingVertical: 8 },
  tagChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 0.5, borderColor: '#ccc', backgroundColor: '#f5f5f5', marginRight: 6 },
  tagChipActive: { backgroundColor: '#0F6E56', borderColor: '#0F6E56' },
  tagText: { fontSize: 12, color: '#555' },
  tagTextActive: { color: '#fff', fontWeight: '600' },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' },
  mapPlaceholderIcon: { fontSize: 48, marginBottom: 12 },
  mapPlaceholderText: { fontSize: 15, color: '#888', fontWeight: '500' },
  mapPlaceholderSub: { fontSize: 13, color: '#aaa', marginTop: 6 },
  recentSection: { backgroundColor: '#fff', borderTopWidth: 0.5, borderColor: '#e0e0e0', paddingTop: 12, paddingBottom: 8 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, marginBottom: 8 },
  recentTitle: { fontSize: 13, fontWeight: '600', color: '#1a1a1a' },
  recentContent: { paddingHorizontal: 12, gap: 8 },
  card: { width: 100, backgroundColor: '#f5f5f5', borderRadius: 10, overflow: 'hidden', marginRight: 4 },
  cardImg: { width: 100, height: 68 },
  cardBody: { padding: 6 },
  cardTitle: { fontSize: 11, fontWeight: '500', color: '#1a1a1a' },
  cardDate: { fontSize: 10, color: '#888', marginTop: 2 },
  emptyCard: { width: width - 48, alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  emptyText: { fontSize: 13, color: '#aaa', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  popup: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  popupImg: { width: '100%', height: 200 },
  popupBody: { padding: 16 },
  popupTitle: { fontSize: 17, fontWeight: '600', color: '#1a1a1a', marginBottom: 6 },
  popupPlace: { fontSize: 12, color: '#888', marginBottom: 6 },
  popupMemo: { fontSize: 14, color: '#333', lineHeight: 21, marginBottom: 8 },
  popupDate: { fontSize: 12, color: '#aaa' },
});
