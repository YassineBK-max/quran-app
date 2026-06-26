export interface Dhikr {
  id: number;
  arabic: string;
  english: string;
  repetitions: number;
  note?: string;
  source: string;
}

export interface AdhkarCategory {
  id: string;
  title: string;
  arabicTitle: string;
  adhkar: Dhikr[];
}

export const ADHKAR_CATEGORIES: AdhkarCategory[] = [
  {
    id: "istiqaz",
    title: "Upon Waking",
    arabicTitle: "أذكار الاستيقاظ",
    adhkar: [
      {
        id: 1,
        arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
        english: "Praise be to Allah Who has given us life after causing us to die, and unto Him is the Resurrection.",
        repetitions: 1,
        source: "Bukhari"
      },
      {
        id: 2,
        arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ",
        english: "None has the right to be worshipped except Allah, alone without partner, to Him belongs all sovereignty and praise. He is over all things omnipotent. Glory be to Allah; Praise be to Allah; None has the right to be worshipped except Allah; Allah is the Greatest; There is no power nor strength except with Allah, the Most High, the Most Great.",
        repetitions: 1,
        source: "Bukhari"
      },
      {
        id: 3,
        arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ",
        english: "O Allah, by Your grace we reach the morning, and by Your grace we reach the evening. By Your grace we live and by Your grace we die. And unto You is the resurrection.",
        repetitions: 1,
        source: "Abu Dawud, Tirmidhi"
      },
      {
        id: 4,
        arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ هَذَا الْيَوْمِ وَخَيْرَ مَا فِيهِ، وَأَعُوذُ بِكَ مِنْ شَرِّهِ وَشَرِّ مَا فِيهِ",
        english: "O Allah, I ask You for the good of this day and the good of what it contains, and I seek refuge in You from its evil and the evil of what it contains.",
        repetitions: 1,
        source: "Abu Dawud"
      }
    ]
  },
  {
    id: "sabah",
    title: "Morning",
    arabicTitle: "أذكار الصباح",
    adhkar: [
      {
        id: 1,
        arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ",
        english: "We have reached the morning and at this very time all sovereignty belongs to Allah. All praise is for Allah. None has the right to be worshipped except Allah, alone, without partner. To Him belongs all sovereignty and praise. My Lord, I ask You for the good of this day and what follows it, and I seek refuge from the evil of this day and what follows it.",
        repetitions: 1,
        source: "Muslim"
      },
      {
        id: 2,
        arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
        english: "O Allah, You are my Lord. None has the right to be worshipped except You. You created me and I am Your servant, and I abide by Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favor upon me and I acknowledge my sin, so forgive me — for verily none can forgive sin except You.",
        repetitions: 1,
        note: "Sayyid al-Istighfar (Master of Seeking Forgiveness). Whoever says this with certainty in the morning and dies before evening enters Paradise.",
        source: "Bukhari"
      },
      {
        id: 3,
        arabic: "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ",
        english: "Ayat al-Kursi (Quran 2:255): Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and on earth. Who can intercede with Him except by His permission? He knows what is before them and what will be after them. They encompass nothing of His knowledge except what He wills. His Kursi extends over the heavens and earth, and their preservation tires Him not. He is the Most High, the Most Great.",
        repetitions: 1,
        note: "Whoever recites Ayat al-Kursi in the morning is protected from jinn until evening.",
        source: "Hakim (Sahih)"
      },
      {
        id: 4,
        arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ\n\nقُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ ۝ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ\n\nقُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ",
        english: "Recite Surah Al-Ikhlas (112), Surah Al-Falaq (113), and Surah An-Nas (114) — each three times. They are sufficient protection for everything.",
        repetitions: 3,
        note: "These three surahs suffice for everything when recited three times each morning and evening.",
        source: "Abu Dawud, Tirmidhi"
      },
      {
        id: 5,
        arabic: "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ",
        english: "O Allah, grant my body health. O Allah, grant my hearing health. O Allah, grant my sight health. None has the right to be worshipped except You.",
        repetitions: 3,
        source: "Abu Dawud"
      },
      {
        id: 6,
        arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ وَالْفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ، لَا إِلَهَ إِلَّا أَنْتَ",
        english: "O Allah, I seek refuge in You from disbelief and poverty, and I seek refuge in You from the punishment of the grave. None has the right to be worshipped except You.",
        repetitions: 3,
        source: "Abu Dawud"
      },
      {
        id: 7,
        arabic: "حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",
        english: "Allah is sufficient for me. None has the right to be worshipped except Him. I have placed my trust in Him, and He is the Lord of the Magnificent Throne.",
        repetitions: 7,
        note: "Allah will suffice whoever says this seven times in the morning and evening, whether he is sincere or not.",
        source: "Abu Dawud"
      },
      {
        id: 8,
        arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعِلْمَ النَّافِعَ، وَالرِّزْقَ الطَّيِّبَ، وَالْعَمَلَ الْمُتَقَبَّلَ",
        english: "O Allah, I ask You for knowledge that is of benefit, a good provision, and deeds that will be accepted.",
        repetitions: 1,
        source: "Ibn Majah"
      },
      {
        id: 9,
        arabic: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا",
        english: "I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad (peace be upon him) as my Prophet.",
        repetitions: 3,
        note: "It is a right upon Allah to please whoever says this three times.",
        source: "Abu Dawud, Tirmidhi"
      },
      {
        id: 10,
        arabic: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ",
        english: "O Allah, send prayers and peace upon our Prophet Muhammad.",
        repetitions: 10,
        source: "Tirmidhi"
      }
    ]
  },
  {
    id: "masa",
    title: "Evening",
    arabicTitle: "أذكار المساء",
    adhkar: [
      {
        id: 1,
        arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا",
        english: "We have reached the evening and at this very time all sovereignty belongs to Allah. All praise is for Allah. None has the right to be worshipped except Allah, alone, without partner. My Lord, I ask You for the good of this night and what follows it, and I seek refuge from the evil of this night and what follows it.",
        repetitions: 1,
        source: "Muslim"
      },
      {
        id: 2,
        arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
        english: "O Allah, You are my Lord. None has the right to be worshipped except You. You created me and I am Your servant, abiding by Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favor and acknowledge my sin — forgive me, for none forgives sin except You.",
        repetitions: 1,
        note: "Sayyid al-Istighfar. Whoever says this with certainty in the evening and dies before morning enters Paradise.",
        source: "Bukhari"
      },
      {
        id: 3,
        arabic: "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...",
        english: "Ayat al-Kursi (Quran 2:255) — Whoever recites this in the evening is protected from jinn until morning.",
        repetitions: 1,
        source: "Hakim (Sahih)"
      },
      {
        id: 4,
        arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ / قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ / قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
        english: "Surah Al-Ikhlas (112), Surah Al-Falaq (113), and Surah An-Nas (114) — three times each in the evening.",
        repetitions: 3,
        source: "Abu Dawud, Tirmidhi"
      },
      {
        id: 5,
        arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
        english: "In the name of Allah with Whose name nothing is harmed on earth nor in the heavens, and He is the All-Hearing, the All-Knowing.",
        repetitions: 3,
        note: "Whoever says this three times in the morning and evening, nothing will harm him.",
        source: "Abu Dawud, Tirmidhi"
      },
      {
        id: 6,
        arabic: "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ",
        english: "O Allah, grant my body health. O Allah, grant my hearing health. O Allah, grant my sight health. None has the right to be worshipped except You.",
        repetitions: 3,
        source: "Abu Dawud"
      },
      {
        id: 7,
        arabic: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا",
        english: "I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad (peace be upon him) as my Prophet.",
        repetitions: 3,
        source: "Abu Dawud, Tirmidhi"
      },
      {
        id: 8,
        arabic: "اللَّهُمَّ إِنِّي أَمْسَيْتُ أُشْهِدُكَ وَأُشْهِدُ حَمَلَةَ عَرْشِكَ وَمَلَائِكَتَكَ وَجَمِيعَ خَلْقِكَ أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ",
        english: "O Allah, I have reached the evening and call upon You as witness, and the bearers of Your Throne, Your angels, and all of Your creation, that You are Allah — none has the right to be worshipped except You alone, without partner — and that Muhammad is Your servant and messenger.",
        repetitions: 4,
        note: "Whoever says this 4 times in the evening, Allah will free one quarter of him from the Fire.",
        source: "Abu Dawud"
      }
    ]
  },
  {
    id: "nawm",
    title: "Before Sleep",
    arabicTitle: "أذكار النوم",
    adhkar: [
      {
        id: 1,
        arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
        english: "In Your name, O Allah, I die and I live.",
        repetitions: 1,
        source: "Bukhari"
      },
      {
        id: 2,
        arabic: "اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ",
        english: "O Allah, protect me from Your punishment on the Day You resurrect Your servants.",
        repetitions: 3,
        source: "Abu Dawud, Tirmidhi"
      },
      {
        id: 3,
        arabic: "بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ",
        english: "In Your name my Lord, I lie down, and in Your name I rise. If You take my soul, have mercy upon it. If You return it, protect it as You protect Your righteous servants.",
        repetitions: 1,
        source: "Bukhari & Muslim"
      },
      {
        id: 4,
        arabic: "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...",
        english: "Ayat al-Kursi (Quran 2:255) — Whoever recites this before sleeping, Allah will appoint a guardian over him and no devil will approach him until morning.",
        repetitions: 1,
        source: "Bukhari"
      },
      {
        id: 5,
        arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ / قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ / قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
        english: "Surah Al-Ikhlas, Al-Falaq, and An-Nas — Blow on your hands and wipe over your body three times.",
        repetitions: 3,
        source: "Bukhari"
      },
      {
        id: 6,
        arabic: "سُبْحَانَ اللَّهِ",
        english: "Glory be to Allah",
        repetitions: 33,
        source: "Bukhari & Muslim"
      },
      {
        id: 7,
        arabic: "الْحَمْدُ لِلَّهِ",
        english: "Praise be to Allah",
        repetitions: 33,
        source: "Bukhari & Muslim"
      },
      {
        id: 8,
        arabic: "اللَّهُ أَكْبَرُ",
        english: "Allah is the Greatest",
        repetitions: 34,
        note: "The Prophet ﷺ said: 'This is better for you than having a servant.'",
        source: "Bukhari & Muslim"
      }
    ]
  },
  {
    id: "masjid",
    title: "Mosque",
    arabicTitle: "أذكار المسجد",
    adhkar: [
      {
        id: 1,
        arabic: "أَعُوذُ بِاللَّهِ الْعَظِيمِ، وَبِوَجْهِهِ الْكَرِيمِ، وَسُلْطَانِهِ الْقَدِيمِ، مِنَ الشَّيْطَانِ الرَّجِيمِ",
        english: "I seek refuge in Allah the Magnificent, in His noble Face, and His eternal dominion, from the accursed devil.",
        repetitions: 1,
        note: "Upon entering the mosque. The devil says: 'He has been protected from me all day.'",
        source: "Abu Dawud"
      },
      {
        id: 2,
        arabic: "بِسْمِ اللهِ، وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللهِ، اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
        english: "In the name of Allah, and peace and blessings be upon the Messenger of Allah. O Allah, open the gates of Your mercy for me.",
        repetitions: 1,
        note: "Said when entering the mosque.",
        source: "Muslim, Abu Dawud"
      },
      {
        id: 3,
        arabic: "بِسْمِ اللهِ، وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللهِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ",
        english: "In the name of Allah, and peace and blessings be upon the Messenger of Allah. O Allah, I ask You from Your bounty.",
        repetitions: 1,
        note: "Said when leaving the mosque.",
        source: "Muslim, Abu Dawud"
      },
      {
        id: 4,
        arabic: "اللَّهُمَّ اغْفِرْ لِي ذُنُوبِي وَافْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
        english: "O Allah, forgive me my sins and open the gates of Your mercy for me.",
        repetitions: 1,
        note: "Upon entering the mosque.",
        source: "Ibn Majah"
      },
      {
        id: 5,
        arabic: "اللَّهُمَّ اغْفِرْ لِي ذُنُوبِي وَافْتَحْ لِي أَبْوَابَ فَضْلِكَ",
        english: "O Allah, forgive me my sins and open the gates of Your bounty for me.",
        repetitions: 1,
        note: "Upon leaving the mosque.",
        source: "Ibn Majah"
      },
      {
        id: 6,
        arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الشَّيْطَانِ الرَّجِيمِ",
        english: "O Allah, I seek refuge in You from the accursed devil.",
        repetitions: 1,
        note: "Upon hearing the adhan, repeat after the muadhdhin, then send salawat on the Prophet.",
        source: "Muslim"
      }
    ]
  }
];
