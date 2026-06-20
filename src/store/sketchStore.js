import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@raon_sketches';

export async function getSketches() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function persist(list) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export async function saveSketch(sketch) {
  const list = await getSketches();
  const newSketch = {
    ...sketch,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  await persist([newSketch, ...list]);
  return newSketch;
}

export async function deleteSketch(id) {
  const list = await getSketches();
  await persist(list.filter(s => s.id !== id));
}

export async function updateSketch(id, updates) {
  const list = await getSketches();
  await persist(list.map(s => s.id === id ? { ...s, ...updates } : s));
}
