import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SectionList, Image,
  TouchableOpacity, SafeAreaView, Alert, ScrollView,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSketches, deleteSketch } from '../store/sketchStore';
import { TAGS } from '../constants/tags';

function groupByMonth(sketches) {
  const map = {};
  sketches.forEach(s => {
    const d = new Date(s.createdAt);
    const key = `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
    if (!map[key]) map[key] = { title: key, data: [] };
    map[key].data.push(s);
  });
  return Object.values(map);
}

export default function SketchListScreen({ navigation }) {
  const [sketches, setSketches] = useState([]);
  const [activeTag, setActiveTag] = useState(null);
  const [selectedSketch, setSelectedSketch] = useState(null);

  useFocusEffect(
    useCallback(() => { getSketches().then(setSketches); }, []),
  );

  const filtered = activeTag ? sketches.filter(s => s.tagId === activeTag) : sketches;
  const sections = groupByMonth(filtered);
  const tagOf = id => TAGS.find(t => t.id === id);

  function confirmDelete(id) {
    Alert.alert('삭제할까요?', '이 스케치를 지우면 복구할 수 없어요.', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => {
        await deleteSketch(id);
        if (selectedSketch?.id === id) setSelectedSketch(null);
        getSketches().then(setSketches);
      }},
    ]);
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>스케치 목록</Text>
        <Text style={s.headerCount}>{filtered.length}개</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tagRow} contentContainerStyle={s.tagContent}>
        <TouchableOpacity style={[s.chip, !activeTag && s.chipActive]} onPress={() => setActiveTag(null)}>
          <Text style={[s.chipText, !activeTag && s.chipTextActive]}>전체</Text>
        </TouchableOpacity>
        {TAGS.map(tag => (
          <TouchableOpacity key={tag.id}
            style={[s.chip, activeTag === tag.id && { backgroundColor: tag.bg, borderColor: tag.color }]}
            onPress={() => setActiveTag(activeTag === tag.id ? null : tag.id)}>
            <Text style={[s.chipText, activeTag === tag.id && { color: tag.color, fontWeight: '600' }]}>
              {tag.emoji} {tag.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        stickySectionHeadersEnabled={true}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>아직 스케치가 없어요</Text>
            <Text style={s.emptyHint}>+ 버튼으로 첫 기록을 남겨보세요!</Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            <Text style={s.sectionCount}>{section.data.length}개</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const tag = tagOf(item.tagId);
          return (
            <TouchableOpacity style={s.card} onPress={() => setSelectedSketch(item)} activeOpacity={0.85}>
              {item.photos?.[0] ? (
                <Image source={{ uri: item.photos[0] }} style={s.cardImg} />
              ) : (
                <View style={[s.cardImg, s.cardImgEmpty]}>
                  <Text style={{ fontSize: 32 }}>{tag?.emoji ?? '📌'}</Text>
                </View>
              )}
              <View style={s.cardBody}>
                <View style={s.cardTitleRow}>
                  <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
                  {tag && (
                    <View style={[s.badge, { backgroundColor: tag.bg }]}>
                      <Text style={[s.badgeText, { color: tag.color }]}>{tag.emoji} {tag.label}</Text>
                    </View>
                  )}
                </View>
                {item.placeName ? <Text style={s.cardPlace}>📍 {item.placeName}</Text> : null}
                {item.memo ? <Text style={s.cardMemo} numberOfLines={3}>{item.memo}</Text> : null}
                <View style={s.cardFooter}>
                  <Text style={s.cardDate}>
                    {new Date(item.createdAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                    {item.weather ? '  ' + item.weather : ''}
                    {item.mood ? '  ' + item.mood : ''}
                  </Text>
                  <TouchableOpacity onPress={() => confirmDelete(item.id)}>
                    <Text style={s.deleteBtn}>삭제</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {selectedSketch && (
        <Modal transparent animationType="slide" onRequestClose={() => setSelectedSketch(null)}>
          <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setSelectedSketch(null)}>
            <TouchableOpacity style={s.popup} activeOpacity={1} onPress={() => {}}>
              {selectedSketch.photos?.[0] ? (
                <Image source={{ uri: selectedSketch.photos[0] }} style={s.popupImg} />
              ) : (
                <View style={[s.popupImg, { backgroundColor: tagOf(selectedSketch.tagId)?.bg ?? '#f0f0f0', alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 52 }}>{tagOf(selectedSketch.tagId)?.emoji ?? '📌'}</Text>
                </View>
              )}
              <View style={s.popupBody}>
                <View style={s.popupTitleRow}>
                  <Text style={s.popupTitle}>{selectedSketch.title}</Text>
                  {tagOf(selectedSketch.tagId) && (
                    <View style={[s.badge, { backgroundColor: tagOf(selectedSketch.tagId).bg }]}>
                      <Text style={[s.badgeText, { color: tagOf(selectedSketch.tagId).color }]}>
                        {tagOf(selectedSketch.tagId).emoji} {tagOf(selectedSketch.tagId).label}
                      </Text>
                    </View>
                  )}
                </View>
                {selectedSketch.placeName ? <Text style={s.popupPlace}>📍 {selectedSketch.placeName}</Text> : null}
                {selectedSketch.memo ? (
                  <ScrollView style={s.popupMemoScroll} showsVerticalScrollIndicator={false}>
                    <Text style={s.popupMemo}>{selectedSketch.memo}</Text>
                  </ScrollView>
                ) : null}
                <Text style={s.popupDate}>
                  {selectedSketch.weather}{'  '}{selectedSketch.mood}{'  '}
                  {new Date(selectedSketch.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
                <View style={s.popupActions}>
                  <TouchableOpacity style={s.editBtn} onPress={() => {
                    setSelectedSketch(null);
                    navigation.getParent()?.navigate('Record', { sketch: selectedSketch });
                  }}>
                    <Text style={s.editBtnText}>편집</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.closeBtn} onPress={() => setSelectedSketch(null)}>
                    <Text style={s.closeBtnText}>닫기</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderColor: '#e0e0e0' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#1a1a1a' },
  headerCount: { fontSize: 13, color: '#888' },
  tagRow: { maxHeight: 48, borderBottomWidth: 0.5, borderColor: '#e0e0e0' },
  tagContent: { paddingHorizontal: 12, alignItems: 'center', paddingVertical: 8, gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, borderWidth: 0.5, borderColor: '#ccc', backgroundColor: '#f5f5f5', marginRight: 6 },
  chipActive: { backgroundColor: '#0F6E56', borderColor: '#0F6E56' },
  chipText: { fontSize: 12, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  list: { paddingBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f7f7f7', borderBottomWidth: 0.5, borderColor: '#e8e8e8' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#0F6E56' },
  sectionCount: { fontSize: 12, color: '#aaa' },
  card: { backgroundColor: '#fff', marginHorizontal: 12, marginTop: 12, borderRadius: 12, borderWidth: 0.5, borderColor: '#e0e0e0', overflow: 'hidden' },
  cardImg: { width: '100%', height: 160 },
  cardImgEmpty: { backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '500' },
  cardPlace: { fontSize: 12, color: '#888', marginBottom: 4 },
  cardMemo: { fontSize: 13, color: '#444', lineHeight: 19, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  cardDate: { fontSize: 11, color: '#aaa' },
  deleteBtn: { fontSize: 12, color: '#e24b4a' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: '#aaa' },
  emptyHint: { fontSize: 13, color: '#ccc', marginTop: 6 },
  // Detail modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  popup: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden', maxHeight: '85%' },
  popupImg: { width: '100%', height: 220 },
  popupBody: { padding: 16 },
  popupTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  popupTitle: { fontSize: 17, fontWeight: '600', color: '#1a1a1a', flex: 1, marginRight: 8 },
  popupPlace: { fontSize: 13, color: '#888', marginBottom: 8 },
  popupMemoScroll: { maxHeight: 160, marginBottom: 10 },
  popupMemo: { fontSize: 15, color: '#333', lineHeight: 23 },
  popupDate: { fontSize: 12, color: '#aaa', marginBottom: 14 },
  popupActions: { flexDirection: 'row', gap: 10 },
  editBtn: { flex: 1, borderWidth: 1.5, borderColor: '#0F6E56', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  editBtnText: { color: '#0F6E56', fontSize: 15, fontWeight: '600' },
  closeBtn: { flex: 1, backgroundColor: '#0F6E56', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  closeBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
