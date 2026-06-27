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
