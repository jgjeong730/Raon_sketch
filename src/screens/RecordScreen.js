import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Pressable, TextInput,
  ScrollView, Image, SafeAreaView, Alert, FlatList, ActivityIndicator,
  Modal, Dimensions,
} from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');
import * as ImagePicker from 'expo-image-picker';
import { saveSketch, updateSketch } from '../store/sketchStore';
import { TAGS } from '../constants/tags';

const KAKAO_REST_KEY = '35325525ca56801c7258a2266cfa97b8';

async function searchPlaces(keyword) {
  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(keyword)}&size=8`,
    { headers: { Authorization: `KakaoAK ${KAKAO_REST_KEY}` } }
  );
  if (!res.ok) throw new Error(`검색 서버 오류 (${res.status})`);
  const json = await res.json();
  return json.documents ?? [];
}
const STEPS = ['사진 선택', '장소 검색', '태그 선택', '메모 입력'];
const WEATHERS = ['☀️', '🌤️', '🌧️', '❄️'];
const MOODS = [
  { emoji: '😊', label: '행복' },
  { emoji: '😄', label: '즐거움' },
  { emoji: '😌', label: '평온' },
  { emoji: '🥹', label: '감동' },
  { emoji: '😴', label: '피곤' },
];


export default function RecordScreen({ navigation, route }) {
  const editSketch = route?.params?.sketch ?? null;
  const isEdit = !!editSketch;

  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState(editSketch?.photos ?? []);
  const [placeName, setPlaceName] = useState(editSketch?.placeName ?? '');
  const [placeAddress, setPlaceAddress] = useState(editSketch?.placeAddress ?? '');
  const [lat, setLat] = useState(editSketch?.lat ?? null);
  const [lng, setLng] = useState(editSketch?.lng ?? null);
  const [tagId, setTagId] = useState(editSketch?.tagId ?? null);
  const [memo, setMemo] = useState(editSketch?.memo ?? '');
  const [weather, setWeather] = useState(editSketch?.weather ?? null);
  const [mood, setMood] = useState(editSketch?.mood ?? null);
  const [saving, setSaving] = useState(false);
  const [previewUri, setPreviewUri] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  async function doSearch() {
    if (!searchKeyword.trim() || searching) return;
    setSearching(true);
    try {
      const results = await searchPlaces(searchKeyword);
      setSearchResults(results);
    } catch (e) {
      Alert.alert('검색 오류', e.message ?? '장소 검색에 실패했어요. 다시 시도해주세요.');
    } finally {
      setSearching(false);
    }
  }

  async function addPhoto(fromCamera) {
    const { status } = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 접근 권한을 허용해주세요'); return;
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsMultipleSelection: true, selectionLimit: 5 - photos.length });
    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri);
      setPhotos(prev => [...prev, ...uris].slice(0, 5));
    }
  }



  async function handleSave() {
    if (!tagId) { Alert.alert('태그를 선택해주세요'); return; }
    setSaving(true);
    const tag = TAGS.find(t => t.id === tagId);
    if (isEdit) {
      await updateSketch(editSketch.id, { title: placeName || tag.label, photos, placeName, placeAddress, lat, lng, tagId, memo, weather, mood });
      setSaving(false);
      Alert.alert('수정 완료! ✓', '스케치가 업데이트됐어요', [
        { text: '확인', onPress: () => navigation.goBack() },
      ]);
    } else {
      await saveSketch({ title: placeName || tag.label, photos, placeName, placeAddress, lat, lng, tagId, memo, weather, mood });
      setSaving(false);
      Alert.alert('저장 완료! 🎉', '지도에 핀이 추가됐어요', [
        { text: '지도로 이동', onPress: () => navigation.navigate('Main', { screen: 'MapHome' }) },
        { text: '계속 기록', onPress: () => { setStep(0); setPhotos([]); setPlaceName(''); setPlaceAddress(''); setLat(null); setLng(null); setTagId(null); setMemo(''); setWeather(null); setMood(null); } },
      ]);
    }
  }

  return (
  <>
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.headerIcon}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.headerSub}>{isEdit ? '스케치 편집' : '새 스케치 기록'}</Text>
          <Text style={s.headerTitle}>{step + 1}단계 · {STEPS[step]}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.headerIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={s.progressRow}>
        {STEPS.map((_, i) => (
          <React.Fragment key={i}>
            <View style={[s.dot, i < step && s.dotDone, i === step && s.dotActive]} />
            {i < STEPS.length - 1 && <View style={s.dotLine} />}
          </React.Fragment>
        ))}
        <Text style={s.stepCounter}>{step + 1} / 4</Text>
      </View>

      {step === 0 && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.body}>
          <Text style={s.desc}>오늘의 순간을 담은 사진을 추가해요.{'\n'}최대 5장까지 선택할 수 있어요.</Text>

          {/* 1번째 사진: 전체 가로 */}
          <View style={s.photoLayout}>
            {photos[0] ? (
              <Pressable style={s.photoFull} onPress={() => setPreviewUri(photos[0])}>
                <Image source={{ uri: photos[0] }} style={s.photoImg} />
                <Pressable style={s.photoRemove} onPress={() => setPhotos(p => p.filter((_, j) => j !== 0))}>
                  <Text style={{ color: '#fff', fontSize: 10 }}>✕</Text>
                </Pressable>
                <View style={s.photoBadge}><Text style={s.photoBadgeText}>대표</Text></View>
              </Pressable>
            ) : (
              <TouchableOpacity style={[s.photoFull, s.photoSlotFull]} onPress={() => addPhoto(false)}>
                <Text style={{ fontSize: 32, color: '#ccc' }}>+</Text>
                <Text style={{ fontSize: 12, color: '#bbb', marginTop: 4 }}>사진 추가</Text>
              </TouchableOpacity>
            )}

            {/* 2~3번째 사진 */}
            {(photos.length >= 1) && (
              <View style={s.photoRow2}>
                {[1, 2].map(i => (
                  photos[i] ? (
                    <Pressable key={i} style={s.photoHalf} onPress={() => setPreviewUri(photos[i])}>
                      <Image source={{ uri: photos[i] }} style={s.photoImg} />
                      <Pressable style={s.photoRemove} onPress={() => setPhotos(p => p.filter((_, j) => j !== i))}>
                        <Text style={{ color: '#fff', fontSize: 10 }}>✕</Text>
                      </Pressable>
                    </Pressable>
                  ) : photos.length < 5 && (
                    <TouchableOpacity key={i} style={[s.photoHalf, s.photoSlotHalf]} onPress={() => addPhoto(false)}>
                      <Text style={{ fontSize: 24, color: '#ccc' }}>+</Text>
                    </TouchableOpacity>
                  )
                ))}
              </View>
            )}

            {/* 4~5번째 사진 */}
            {(photos.length >= 3) && (
              <View style={s.photoRow2}>
                {[3, 4].map(i => (
                  photos[i] ? (
                    <Pressable key={i} style={s.photoHalf} onPress={() => setPreviewUri(photos[i])}>
                      <Image source={{ uri: photos[i] }} style={s.photoImg} />
                      <Pressable style={s.photoRemove} onPress={() => setPhotos(p => p.filter((_, j) => j !== i))}>
                        <Text style={{ color: '#fff', fontSize: 10 }}>✕</Text>
                      </Pressable>
                    </Pressable>
                  ) : photos.length < 5 && i === photos.length && (
                    <TouchableOpacity key={i} style={[s.photoHalf, s.photoSlotHalf]} onPress={() => addPhoto(false)}>
                      <Text style={{ fontSize: 24, color: '#ccc' }}>+</Text>
                    </TouchableOpacity>
                  )
                ))}
              </View>
            )}
          </View>

          <View style={s.photoActions}>
            <TouchableOpacity style={s.photoAction} onPress={() => addPhoto(true)}>
              <Text style={s.photoActionIcon}>📷</Text>
              <Text style={s.photoActionLabel}>카메라</Text>
            </TouchableOpacity>
            <View style={s.photoActionDivider} />
            <TouchableOpacity style={s.photoAction} onPress={() => addPhoto(false)}>
              <Text style={s.photoActionIcon}>🖼️</Text>
              <Text style={s.photoActionLabel}>갤러리</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.hint}>사진을 탭하면 크게 볼 수 있어요</Text>
        </ScrollView>
      )}

      {step === 1 && (
        <View style={{ flex: 1 }}>
          {placeName ? (
            <View style={s.selectedPlace}>
              <View style={{ flex: 1 }}>
                <Text style={s.selectedPlaceName}>✓  {placeName}</Text>
                {placeAddress ? <Text style={s.selectedPlaceAddr}>{placeAddress}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => { setPlaceName(''); setPlaceAddress(''); setLat(null); setLng(null); setSearchResults([]); }}>
                <Text style={{ color: '#e24b4a', fontSize: 13 }}>변경</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <View style={s.searchBox}>
            <TextInput
              style={s.searchInput}
              placeholder="장소 이름 검색 (예: 북한산)"
              placeholderTextColor="#aaa"
              value={searchKeyword}
              onChangeText={setSearchKeyword}
              onSubmitEditing={doSearch}
              returnKeyType="search"
            />
            <TouchableOpacity style={[s.searchBtn, searching && { opacity: 0.5 }]} onPress={doSearch} disabled={searching}>
              <Text style={s.searchBtnText}>검색</Text>
            </TouchableOpacity>
          </View>
          {searching && <ActivityIndicator style={{ marginTop: 20 }} color="#0F6E56" />}
          {!searching && searchResults.length === 0 && !placeName && (
            <View style={s.searchEmpty}>
              <Text style={s.searchEmptyText}>장소를 검색해보세요{'\n'}(예: 북한산, 올림픽공원, 스타벅스)</Text>
            </View>
          )}
          <FlatList
            data={searchResults}
            keyExtractor={(_, i) => i.toString()}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={s.placeItem} onPress={() => {
                setPlaceName(item.place_name);
                setPlaceAddress(item.road_address_name || item.address_name);
                setLat(parseFloat(item.y));
                setLng(parseFloat(item.x));
                setSearchResults([]);
              }}>
                <Text style={s.placeItemName}>{item.place_name}</Text>
                <Text style={s.placeItemAddr}>{item.road_address_name || item.address_name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {step === 2 && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.body}>
          <Text style={s.desc}>오늘 활동이 무엇인가요?{'\n'}태그를 선택하면 지도에 색깔 핀으로 표시돼요.</Text>
          <View style={s.tagsWrap}>
            {TAGS.map(tag => (
              <TouchableOpacity
                key={tag.id}
                style={[s.tagBtn, tagId === tag.id && { backgroundColor: tag.bg, borderColor: tag.color, borderWidth: 1.5 }]}
                onPress={() => setTagId(tag.id)}>
                <Text style={[s.tagBtnText, tagId === tag.id && { color: tag.color, fontWeight: '600' }]}>
                  {tag.emoji} {tag.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {tagId && (() => {
            const tag = TAGS.find(t => t.id === tagId);
            return (
              <View style={[s.tagSelected, { backgroundColor: tag.bg }]}>
                <View style={[s.tagSelectedDot, { backgroundColor: tag.color }]}>
                  <Text style={{ fontSize: 20 }}>{tag.emoji}</Text>
                </View>
                <View>
                  <Text style={[s.tagSelectedName, { color: tag.color }]}>{tag.label} 선택됨</Text>
                  <Text style={{ fontSize: 11, color: tag.color, opacity: 0.8 }}>지도에 색깔 핀으로 표시돼요</Text>
                </View>
              </View>
            );
          })()}
        </ScrollView>
      )}

      {step === 3 && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
          <Text style={s.desc}>이날의 이야기를 짧게 남겨봐요.{'\n'}나중에 다시 봤을 때 기억이 더 생생해져요.</Text>
          <View style={s.weatherBox}>
            <Text style={s.sectionLabel}>오늘의 날씨는?</Text>
            <View style={s.weatherRow}>
              {WEATHERS.map((w, i) => (
                <TouchableOpacity key={i} onPress={() => setWeather(w)}
                  style={[s.weatherBtn, weather === w && s.weatherBtnActive]}>
                  <Text style={{ fontSize: 26 }}>{w}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={s.memoBox}>
            <TextInput
              style={s.memoInput}
              placeholder="오늘 어땠나요? 짧게 남겨봐요..."
              placeholderTextColor="#aaa"
              multiline maxLength={500}
              value={memo} onChangeText={setMemo}
            />
            <View style={s.memoFooter}>
              <Text style={s.memoCount}>{memo.length}자</Text>
              <Text style={s.memoCount}>최대 500자</Text>
            </View>
          </View>
          <View style={s.moodBox}>
            <Text style={s.sectionLabel}>오늘의 기분은?</Text>
            <View style={s.moodRow}>
              {MOODS.map((m, i) => (
                <TouchableOpacity key={i} onPress={() => setMood(m.emoji)}
                  style={[s.moodBtn, mood === m.emoji && s.moodBtnActive]}>
                  <Text style={{ fontSize: 26 }}>{m.emoji}</Text>
                  <Text style={[s.moodLabel, mood === m.emoji && { color: '#0F6E56', fontWeight: '600' }]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      <View style={s.footer}>
        {step > 0 && (
          <TouchableOpacity style={s.prevBtn} onPress={() => setStep(p => p - 1)}>
            <Text style={s.prevBtnText}>이전</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[s.nextBtn, step === 3 && { backgroundColor: '#534AB7' }]}
          onPress={step < 3 ? () => setStep(p => p + 1) : handleSave}
          disabled={saving}>
          <Text style={s.nextBtnText}>
            {step === 0 ? '다음 · 장소 선택 →'
              : step === 1 ? '다음 · 태그 선택 →'
              : step === 2 ? '다음 · 메모 입력 →'
              : saving ? '저장 중...' : '저장하기 ✓'}
          </Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
    {previewUri && (
      <Modal transparent animationType="fade" onRequestClose={() => setPreviewUri(null)}>
        <Pressable style={s.previewOverlay} onPress={() => setPreviewUri(null)}>
          <Image source={{ uri: previewUri }} style={s.previewImg} resizeMode="contain" />
          <View style={s.previewClose}>
            <Text style={s.previewCloseText}>✕</Text>
          </View>
        </Pressable>
      </Modal>
    )}
  </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: '#0F6E56', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerIcon: { fontSize: 18, color: '#9FE1CB' },
  headerSub: { fontSize: 11, color: '#9FE1CB' },
  headerTitle: { fontSize: 15, fontWeight: '600', color: '#E1F5EE', marginTop: 2 },
  progressRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderColor: '#e0e0e0' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ccc' },
  dotDone: { backgroundColor: '#0F6E56' },
  dotActive: { width: 22, borderRadius: 4, backgroundColor: '#0F6E56' },
  dotLine: { flex: 1, height: 1, backgroundColor: '#e0e0e0', marginHorizontal: 2 },
  stepCounter: { fontSize: 11, color: '#888', marginLeft: 10 },
  body: { padding: 16, paddingBottom: 32 },
  desc: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 14 },
  photoRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  photoThumb: { width: 90, height: 90, borderRadius: 10, overflow: 'hidden' },
  photoLayout: { marginBottom: 16, gap: 6 },
  photoFull: { width: '100%', height: 200, borderRadius: 12, overflow: 'hidden' },
  photoSlotFull: { backgroundColor: '#f5f5f5', borderWidth: 1, borderStyle: 'dashed', borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' },
  photoRow2: { flexDirection: 'row', gap: 6 },
  photoHalf: { flex: 1, height: 130, borderRadius: 12, overflow: 'hidden' },
  photoSlotHalf: { backgroundColor: '#f5f5f5', borderWidth: 1, borderStyle: 'dashed', borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' },
  photoBadge: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(15,110,86,0.85)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  photoBadgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  photoImg: { width: '100%', height: '100%' },
  photoRemove: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 11, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  photoSlot: { width: 80, height: 80, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: '#ccc', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f8f8' },
  photoActions: { flexDirection: 'row', backgroundColor: '#f5f5f5', borderRadius: 10, padding: 14, marginBottom: 8, marginHorizontal: 16 },
  photoAction: { flex: 1, alignItems: 'center', gap: 6 },
  photoActionIcon: { fontSize: 26 },
  photoActionLabel: { fontSize: 12, color: '#666' },
  photoActionDivider: { width: 0.5, backgroundColor: '#ddd', marginHorizontal: 8 },
  hint: { fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 6 },
  selectedPlace: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#E1F5EE', borderBottomWidth: 0.5, borderColor: '#9FE1CB' },
  selectedPlaceName: { fontSize: 14, fontWeight: '600', color: '#0F6E56' },
  selectedPlaceAddr: { fontSize: 12, color: '#0F6E56', opacity: 0.7, marginTop: 2 },
  searchHint: { padding: 10, backgroundColor: '#f9f9f9', borderBottomWidth: 0.5, borderColor: '#eee', alignItems: 'center' },
  searchHintText: { fontSize: 12, color: '#aaa' },
  searchBox: { flexDirection: 'row', gap: 8, padding: 12, borderBottomWidth: 0.5, borderColor: '#eee' },
  searchInput: { flex: 1, borderWidth: 0.5, borderColor: '#ccc', borderRadius: 10, padding: 10, fontSize: 14, color: '#333', backgroundColor: '#f9f9f9' },
  searchBtn: { backgroundColor: '#0F6E56', borderRadius: 10, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  searchBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  searchEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  searchEmptyText: { fontSize: 13, color: '#aaa', textAlign: 'center', lineHeight: 20 },
  placeItem: { padding: 14, borderBottomWidth: 0.5, borderColor: '#f0f0f0' },
  placeItemName: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  placeItemAddr: { fontSize: 12, color: '#888', marginTop: 3 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  tagBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 0.5, borderColor: '#ccc', backgroundColor: '#f5f5f5' },
  tagBtnText: { fontSize: 14, color: '#555' },
  tagSelected: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12 },
  tagSelectedDot: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  tagSelectedName: { fontSize: 14, fontWeight: '600' },
  weatherBox: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 14, marginBottom: 12 },
  sectionLabel: { fontSize: 12, color: '#888', marginBottom: 10 },
  weatherRow: { flexDirection: 'row', gap: 16 },
  weatherBtn: { padding: 6, borderRadius: 10, opacity: 0.35 },
  weatherBtnActive: { opacity: 1, backgroundColor: '#E1F5EE' },
  memoBox: { borderWidth: 0.5, borderColor: '#ddd', borderRadius: 12, padding: 14, marginBottom: 12 },
  memoInput: { fontSize: 14, color: '#333', minHeight: 90, lineHeight: 22, textAlignVertical: 'top' },
  memoFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 0.5, borderColor: '#eee' },
  memoCount: { fontSize: 11, color: '#aaa' },
  moodBox: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 14 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-around' },
  moodBtn: { alignItems: 'center', gap: 4, opacity: 0.35 },
  moodBtnActive: { opacity: 1 },
  moodLabel: { fontSize: 10, color: '#888' },
  footer: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 0.5, borderColor: '#e0e0e0', backgroundColor: '#fff' },
  prevBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 0.5, borderColor: '#ccc', alignItems: 'center' },
  prevBtnText: { fontSize: 13, color: '#666' },
  nextBtn: { flex: 2, padding: 14, borderRadius: 12, backgroundColor: '#0F6E56', alignItems: 'center' },
  nextBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  previewImg: { width: SW, height: SH * 0.82 },
  previewClose: { position: 'absolute', top: 56, right: 20, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  previewCloseText: { color: '#fff', fontSize: 16 },
});
