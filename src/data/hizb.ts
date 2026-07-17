// Exact surah:ayah start of each hizb (1-indexed, index 0 = Hizb 1)
export const HIZB_STARTS: [number, number][] = [
  [1, 1],   [2, 75],   [2, 142],  [2, 204],
  [2, 253], [3, 14],   [3, 93],   [3, 171],
  [4, 24],  [4, 88],   [4, 148],  [5, 41],
  [5, 82],  [6, 36],   [6, 111],  [7, 1],
  [7, 88],  [7, 171],  [8, 41],   [9, 1],
  [9, 93],  [10, 71],  [11, 6],   [11, 97],
  [12, 53], [13, 19],  [15, 1],   [16, 51],
  [17, 1],  [18, 1],   [18, 75],  [19, 58],
  [21, 1],  [22, 1],   [23, 1],   [24, 21],
  [25, 21], [26, 111], [27, 56],  [28, 51],
  [29, 46], [31, 22],  [33, 31],  [34, 24],
  [36, 28], [38, 3],   [39, 32],  [40, 41],
  [41, 47], [44, 1],   [46, 1],   [48, 17],
  [51, 31], [54, 1],   [58, 1],   [63, 1],
  [67, 1],  [71, 1],   [78, 1],   [91, 1],
];

export function getHizbForAyah(surahNum: number, ayahNum: number): number {
  for (let i = HIZB_STARTS.length - 1; i >= 0; i--) {
    const [s, a] = HIZB_STARTS[i];
    if (surahNum > s || (surahNum === s && ayahNum >= a)) return i + 1;
  }
  return 1;
}

export const HIZB_NAMES: Record<number, string> = {
  1: "Alif Lam Mim", 2: "Sayaqool", 3: "Tilka Ar-Rusul", 4: "Lan Tanalu",
  5: "Wal Muhsanat", 6: "Wal Mu'minun", 7: "Law Anzalna", 8: "Qalal Mala'",
  9: "Qul Ara'aytum", 10: "Wa A'lamu", 11: "Ya'tathiroon", 12: "Wama Min Dabbah",
  13: "Wama Ubarri'", 14: "Rabbis Sijn", 15: "Subhana", 16: "Qala Alam",
  17: "Iqtaraba", 18: "Qad Aflaha", 19: "Waqalal Ladhina", 20: "Amman Khalaqa",
  21: "Utlu Ma Uwhiya", 22: "Waman Yaqnut", 23: "Faman Azlamu I", 24: "Faman Azlamu II",
  25: "Ilayhi Yuraddu", 26: "Ha Mim", 27: "Qala Fama Khatbukum", 28: "Qad Sami'a",
  29: "Tabaraka", 30: "Amma",
  31: "Alif Lam Mim II", 32: "Sayaqool II", 33: "Tilka Ar-Rusul II", 34: "Lan Tanalu II",
  35: "Wal Muhsanat II", 36: "Wal Mu'minun II", 37: "Law Anzalna II", 38: "Qalal Mala' II",
  39: "Qul Ara'aytum II", 40: "Wa A'lamu II", 41: "Ya'tathiroon II", 42: "Wama Min Dabbah II",
  43: "Wama Ubarri' II", 44: "Rabbis Sijn II", 45: "Subhana II", 46: "Qala Alam II",
  47: "Iqtaraba II", 48: "Qad Aflaha II", 49: "Waqalal Ladhina II", 50: "Amman Khalaqa II",
  51: "Utlu Ma Uwhiya II", 52: "Waman Yaqnut II", 53: "Faman Azlamu III", 54: "Faman Azlamu IV",
  55: "Ilayhi Yuraddu II", 56: "Ha Mim II", 57: "Qala Fama Khatbukum II", 58: "Qad Sami'a II",
  59: "Tabaraka II", 60: "Amma II",
};

export function getHizbNumber(hizbQuarter: number): number {
  return Math.ceil(hizbQuarter / 4);
}

export function getQuarterInHizb(hizbQuarter: number): 1 | 2 | 3 | 4 {
  return (((hizbQuarter - 1) % 4) + 1) as 1 | 2 | 3 | 4;
}

export function getHizbName(hizbNumber: number): string {
  return HIZB_NAMES[hizbNumber] ?? `Hizb ${hizbNumber}`;
}
