import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, SafeAreaView, Share,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getSketches } from '../store/sketchStore';
import { TAGS } from '../constants/tags';

export default function ShareScreen() {
  const [sketches, setSketches] = useState([]);

  useFocusEffect(useCallback(() => { getSketches().then(setSketches); }, []));

  async function shareSketch(sketch) {
    const tag = TAGS.find(t => t.id === sketch.tagId);
    await Share.share({
      message: `[라온스케치] ${tag?.emoji ?? ''} ${sketch.title}\n${sketch.placeName ?? ''}\n${sketch.memo ?? ''}\n\n나의 라온스케치 기록 🗺️`,
    });
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>가족 공유</Text>
        <Text style={s.headerSub}>스케치를 골라 카카오톡으로 보내봐요</Text>
      </View>
      <FlatList
        data={sketches}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>공유할 스케치가 없어요</Text>
            <Text style={s.emptyHint}>먼저 기록을 남겨보세요!</Text>
          </View>
        }
        renderItem={({ item }) => {
          const tag = TAGS.find(t => t.id === item.tagId);
          return (
            <View style={s.card}>
              {item.photos?.[0] ? (
                <Image source={{ uri: item.photos[0] }} style={s.cardImg} />
              ) : (
                <View style={[s.cardImg, s.cardImgEmpty]}>
                  <Text style={{ fontSize: 28 }}>{tag?.emoji ?? '📌'}</Text>
                </View>
              )}
              <View style={s.cardBody}>
                <Text style={s.cardTitle} numberOfLines={1}>{item.title}</Text>
                {item.memo ? <Text style={s.cardMemo} numberOfLines={1}>{item.memo}</Text> : null}
                <TouchableOpacity style={s.shareBtn} onPress={() => shareSketch(item)}>
                  <Text style={s.shareBtnText}>카카오톡으로 공유</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 0.5, borderColor: '#e0e0e0' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#1a1a1a' },
  headerSub: { fontSize: 12, color: '#888', marginTop: 3 },
  list: { padding: 12, gap: 10 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: '#e0e0e0', overflow: 'hidden' },
  cardImg: { width: 80, height: 80 },
  cardImgEmpty: { backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, padding: 10, justifyContent: 'space-between' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  cardMemo: { fontSize: 12, color: '#888' },
  shareBtn: { backgroundColor: '#FAE100', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, alignSelf: 'flex-start', marginTop: 4 },
  shareBtnText: { fontSize: 12, fontWeight: '600', color: '#3A1D1D' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: '#aaa' },
  emptyHint: { fontSize: 13, color: '#ccc', marginTop: 6 },
});
