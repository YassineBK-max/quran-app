export interface Hadith {
  id: number;
  title: string;
  narrator: string;
  arabicText: string;
  englishText: string;
  source: string;
}

export const FORTY_HADITH: Hadith[] = [
  {
    id: 1,
    title: "Actions are by Intentions",
    narrator: "Umar ibn al-Khattab",
    arabicText: `إنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى اللهِ وَرَسُولِهِ فَهِجْرَتُهُ إِلَى اللهِ وَرَسُولِهِ، وَمَنْ كَانَتْ هِجْرَتُهُ لِدُنْيَا يُصِيبُهَا أَوِ امْرَأَةٍ يَنْكِحُهَا فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ`,
    englishText: `Actions are judged by intentions, and every person will get what they intended. So whoever emigrated for the sake of Allah and His Messenger, their emigration will be for Allah and His Messenger. And whoever emigrated to gain some worldly benefit or to marry a woman, their emigration will be for what they emigrated for.`,
    source: "Bukhari & Muslim"
  },
  {
    id: 2,
    title: "Islam, Iman, and Ihsan (The Hadith of Jibreel)",
    narrator: "Umar ibn al-Khattab",
    arabicText: `الإِسْلَامُ أَنْ تَشْهَدَ أَنْ لَا إِلَهَ إِلَّا اللهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللهِ، وَتُقِيمَ الصَّلَاةَ، وَتُؤْتِيَ الزَّكَاةَ، وَتَصُومَ رَمَضَانَ، وَتَحُجَّ الْبَيْتَ إِنِ اسْتَطَعْتَ إِلَيْهِ سَبِيلًا. وَالإِيمَانُ أَنْ تُؤْمِنَ بِاللهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ وَالْيَوْمِ الآخِرِ وَتُؤْمِنَ بِالْقَدَرِ خَيْرِهِ وَشَرِّهِ. وَالإِحْسَانُ أَنْ تَعْبُدَ اللهَ كَأَنَّكَ تَرَاهُ، فَإِنْ لَمْ تَكُنْ تَرَاهُ فَإِنَّهُ يَرَاكَ`,
    englishText: `Islam is to testify that there is no deity worthy of worship except Allah and that Muhammad is the Messenger of Allah, to establish the prayer, to give Zakat, to fast Ramadan, and to make the pilgrimage to the House if you are able. Faith (Iman) is to believe in Allah, His angels, His books, His messengers, the Last Day, and to believe in divine destiny — both good and evil. Excellence (Ihsan) is to worship Allah as though you see Him, and though you cannot see Him, He indeed sees you.`,
    source: "Muslim"
  },
  {
    id: 3,
    title: "The Five Pillars of Islam",
    narrator: "Ibn Umar",
    arabicText: `بُنِيَ الإِسْلَامُ عَلَى خَمْسٍ: شَهَادَةِ أَنْ لَا إِلَهَ إِلَّا اللهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللهِ، وَإِقَامِ الصَّلَاةِ، وَإِيتَاءِ الزَّكَاةِ، وَحَجِّ الْبَيْتِ، وَصَوْمِ رَمَضَانَ`,
    englishText: `Islam is built upon five pillars: testifying that there is no deity worthy of worship except Allah and that Muhammad is the Messenger of Allah, establishing the prayer, giving Zakat, performing Hajj to the House, and fasting in Ramadan.`,
    source: "Bukhari & Muslim"
  },
  {
    id: 4,
    title: "The Creation of Man",
    narrator: "Abdullah ibn Masud",
    arabicText: `إِنَّ أَحَدَكُمْ يُجْمَعُ خَلْقُهُ فِي بَطْنِ أُمِّهِ أَرْبَعِينَ يَوْمًا نُطْفَةً، ثُمَّ يَكُونُ عَلَقَةً مِثْلَ ذَلِكَ، ثُمَّ يَكُونُ مُضْغَةً مِثْلَ ذَلِكَ، ثُمَّ يُرْسَلُ إِلَيْهِ الْمَلَكُ فَيَنْفُخُ فِيهِ الرُّوحَ، وَيُؤْمَرُ بِأَرْبَعِ كَلِمَاتٍ: بِكَتْبِ رِزْقِهِ وَأَجَلِهِ وَعَمَلِهِ وَشَقِيٌّ أَوْ سَعِيدٌ`,
    englishText: `Each of you is collected in the womb of his mother for forty days as a sperm-drop, then as a clot of blood for a similar period, then as a morsel of flesh for a similar period. Then an angel is sent to breathe the spirit into it and to write four things: his sustenance, his lifespan, his deeds, and whether he will be wretched or blessed. By Allah — besides Whom there is no other god — one of you may perform the deeds of the people of Paradise until he is only an arm's length away, then the decree overtakes him and he acts with the deeds of the people of the Fire, and enters it.`,
    source: "Bukhari & Muslim"
  },
  {
    id: 5,
    title: "Rejecting Innovations in Religion",
    narrator: "Aisha",
    arabicText: `مَنْ أَحْدَثَ فِي أَمْرِنَا هَذَا مَا لَيْسَ مِنْهُ فَهُوَ رَدٌّ`,
    englishText: `Whoever introduces something new into this matter of ours (Islam) that is not part of it will have it rejected.`,
    source: "Bukhari & Muslim"
  },
  {
    id: 6,
    title: "The Halal, the Haram, and the Doubtful",
    narrator: "Nu'man ibn Basheer",
    arabicText: `إِنَّ الْحَلَالَ بَيِّنٌ وَإِنَّ الْحَرَامَ بَيِّنٌ، وَبَيْنَهُمَا أُمُورٌ مُشْتَبِهَاتٌ لَا يَعْلَمُهُنَّ كَثِيرٌ مِنَ النَّاسِ، فَمَنِ اتَّقَى الشُّبُهَاتِ فَقَدِ اسْتَبْرَأَ لِدِينِهِ وَعِرْضِهِ، وَمَنْ وَقَعَ فِي الشُّبُهَاتِ وَقَعَ فِي الْحَرَامِ`,
    englishText: `That which is lawful is clear and that which is unlawful is clear, and between them are doubtful matters that many people do not know about. Whoever guards himself against doubtful matters has preserved his religion and his honor. But whoever falls into doubtful matters will fall into the unlawful, just as a shepherd who grazes his flock around a private pasture is liable to let them stray into it. Every king has a private preserve, and the private preserve of Allah is what He has made forbidden. In the body there is a piece of flesh — if it is sound, the whole body is sound; if it is corrupt, the whole body is corrupt. That piece is the heart.`,
    source: "Bukhari & Muslim"
  },
  {
    id: 7,
    title: "Religion is Sincere Advice",
    narrator: "Tamim al-Dari",
    arabicText: `الدِّينُ النَّصِيحَةُ. قُلْنَا: لِمَنْ؟ قَالَ: لِلَّهِ وَلِكِتَابِهِ وَلِرَسُولِهِ وَلِأَئِمَّةِ الْمُسْلِمِينَ وَعَامَّتِهِمْ`,
    englishText: `"The religion is sincere advice." We asked: "To whom?" He said: "To Allah, to His Book, to His Messenger, to the leaders of the Muslims, and to their common people."`,
    source: "Muslim"
  },
  {
    id: 8,
    title: "The Command to Fight Until the Testimony of Faith",
    narrator: "Ibn Umar",
    arabicText: `أُمِرْتُ أَنْ أُقَاتِلَ النَّاسَ حَتَّى يَشْهَدُوا أَنْ لَا إِلَهَ إِلَّا اللهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللهِ، وَيُقِيمُوا الصَّلَاةَ، وَيُؤْتُوا الزَّكَاةَ، فَإِذَا فَعَلُوا ذَلِكَ عَصَمُوا مِنِّي دِمَاءَهُمْ وَأَمْوَالَهُمْ إِلَّا بِحَقِّ الإِسْلَامِ، وَحِسَابُهُمْ عَلَى اللهِ`,
    englishText: `I have been ordered to fight the people until they testify that there is no deity worthy of worship except Allah and that Muhammad is the Messenger of Allah, and they establish the prayer, and they pay Zakat. If they do that, their blood and wealth are protected from me — except by the right of Islam — and their reckoning will be with Allah.`,
    source: "Bukhari & Muslim"
  },
  {
    id: 9,
    title: "Leave What Does Not Concern You",
    narrator: "Abu Hurairah",
    arabicText: `مِنْ حُسْنِ إِسْلَامِ الْمَرْءِ تَرْكُهُ مَا لَا يَعْنِيهِ`,
    englishText: `Part of the perfection of one's Islam is his leaving that which does not concern him.`,
    source: "Tirmidhi (Hasan)"
  },
  {
    id: 10,
    title: "Allah is Pure and Accepts Only What is Pure",
    narrator: "Abu Hurairah",
    arabicText: `إِنَّ اللهَ طَيِّبٌ لَا يَقْبَلُ إِلَّا طَيِّبًا، وَإِنَّ اللهَ أَمَرَ الْمُؤْمِنِينَ بِمَا أَمَرَ بِهِ الْمُرْسَلِينَ فَقَالَ تَعَالَى: ﴿يَا أَيُّهَا الرُّسُلُ كُلُوا مِنَ الطَّيِّبَاتِ وَاعْمَلُوا صَالِحًا﴾ وَقَالَ تَعَالَى: ﴿يَا أَيُّهَا الَّذِينَ آمَنُوا كُلُوا مِنْ طَيِّبَاتِ مَا رَزَقْنَاكُمْ﴾`,
    englishText: `Allah the Almighty is Pure and He only accepts that which is pure. Allah has commanded the faithful to do what He commanded the Messengers, saying: "O Messengers, eat of the good things and act righteously." And He said: "O you who believe, eat of the good things We have provided for you." Then the Prophet mentioned a man who had journeyed far, his hair disheveled, covered in dust, and he stretches his hands to the sky saying "O Lord! O Lord!" — while his food is haram, his drink is haram, his clothing is haram, and he was nourished by haram — so how can his supplication be accepted?`,
    source: "Muslim"
  },
  {
    id: 11,
    title: "Leave What Causes You Doubt",
    narrator: "Hasan ibn Ali",
    arabicText: `دَعْ مَا يَرِيبُكَ إِلَى مَا لَا يَرِيبُكَ`,
    englishText: `Leave that which causes you doubt and take that which does not cause you doubt. Truthfulness brings peace of mind, and lying brings doubt.`,
    source: "Tirmidhi & Nasa'i"
  },
  {
    id: 12,
    title: "Leave What is Forbidden",
    narrator: "Abu Hurairah",
    arabicText: `مَا نَهَيْتُكُمْ عَنْهُ فَاجْتَنِبُوهُ، وَمَا أَمَرْتُكُمْ بِهِ فَأْتُوا مِنْهُ مَا اسْتَطَعْتُمْ، فَإِنَّمَا أَهْلَكَ الَّذِينَ مِنْ قَبْلِكُمْ كَثْرَةُ مَسَائِلِهِمْ وَاخْتِلَافُهُمْ عَلَى أَنْبِيَائِهِمْ`,
    englishText: `Whatever I have forbidden you — avoid it. And whatever I have commanded you — do it as much as you are able. Verily, those before you were destroyed only because of their excessive questioning and their disagreement with their prophets.`,
    source: "Bukhari & Muslim"
  },
  {
    id: 13,
    title: "Love for Your Brother What You Love for Yourself",
    narrator: "Anas ibn Malik",
    arabicText: `لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ`,
    englishText: `None of you truly believes until he loves for his brother what he loves for himself.`,
    source: "Bukhari & Muslim"
  },
  {
    id: 14,
    title: "The Sanctity of Muslim Blood",
    narrator: "Abdullah ibn Masud",
    arabicText: `لَا يَحِلُّ دَمُ امْرِئٍ مُسْلِمٍ يَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللهُ وَأَنِّي رَسُولُ اللهِ إِلَّا بِإِحْدَى ثَلَاثٍ: الثَّيِّبُ الزَّانِي، وَالنَّفْسُ بِالنَّفْسِ، وَالتَّارِكُ لِدِينِهِ الْمُفَارِقُ لِلْجَمَاعَةِ`,
    englishText: `The blood of a Muslim may not be spilled lawfully except in one of three cases: the married person who commits adultery, a life for a life (in retaliation), and the one who forsakes his religion and abandons the community.`,
    source: "Bukhari & Muslim"
  },
  {
    id: 15,
    title: "Good Speech or Silence — Honor the Guest",
    narrator: "Abu Hurairah",
    arabicText: `مَنْ كَانَ يُؤْمِنُ بِاللهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ، وَمَنْ كَانَ يُؤْمِنُ بِاللهِ وَالْيَوْمِ الآخِرِ فَلْيُكْرِمْ جَارَهُ، وَمَنْ كَانَ يُؤْمِنُ بِاللهِ وَالْيَوْمِ الآخِرِ فَلْيُكْرِمْ ضَيْفَهُ`,
    englishText: `Whoever believes in Allah and the Last Day, let him speak good or remain silent. Whoever believes in Allah and the Last Day, let him honor his neighbor. Whoever believes in Allah and the Last Day, let him honor his guest.`,
    source: "Bukhari & Muslim"
  },
  {
    id: 16,
    title: "Do Not Get Angry",
    narrator: "Abu Hurairah",
    arabicText: `أَنَّ رَجُلًا قَالَ لِلنَّبِيِّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ: أَوْصِنِي. قَالَ: "لَا تَغْضَبْ". فَرَدَّدَ مِرَارًا. قَالَ: "لَا تَغْضَبْ"`,
    englishText: `A man said to the Prophet (peace be upon him): "Advise me." He said: "Do not get angry." The man repeated his request several times, and he kept saying: "Do not get angry."`,
    source: "Bukhari"
  },
  {
    id: 17,
    title: "Excellence in All Things",
    narrator: "Shaddad ibn Aws",
    arabicText: `إِنَّ اللهَ كَتَبَ الإِحْسَانَ عَلَى كُلِّ شَيْءٍ، فَإِذَا قَتَلْتُمْ فَأَحْسِنُوا الْقِتْلَةَ، وَإِذَا ذَبَحْتُمْ فَأَحْسِنُوا الذَّبْحَ، وَلْيُحِدَّ أَحَدُكُمْ شَفْرَتَهُ، وَلْيُرِحْ ذَبِيحَتَهُ`,
    englishText: `Verily Allah has prescribed excellence in all things. So when you kill, do so in the best manner; and when you slaughter, do so in the best manner. Let each of you sharpen his blade and spare the animal from suffering.`,
    source: "Muslim"
  },
  {
    id: 18,
    title: "Fear Allah Wherever You Are",
    narrator: "Abu Dharr & Mu'adh ibn Jabal",
    arabicText: `اتَّقِ اللهَ حَيْثُمَا كُنْتَ، وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا، وَخَالِقِ النَّاسَ بِخُلُقٍ حَسَنٍ`,
    englishText: `Be mindful of Allah wherever you are. Follow a bad deed with a good one and it will erase it. And deal with people in a good manner.`,
    source: "Tirmidhi (Hasan)"
  },
  {
    id: 19,
    title: "Be Mindful of Allah and He Will Protect You",
    narrator: "Ibn Abbas",
    arabicText: `يَا غُلَامُ إِنِّي أُعَلِّمُكَ كَلِمَاتٍ: احْفَظِ اللهَ يَحْفَظْكَ، احْفَظِ اللهَ تَجِدْهُ تُجَاهَكَ، إِذَا سَأَلْتَ فَاسْأَلِ اللهَ، وَإِذَا اسْتَعَنْتَ فَاسْتَعِنْ بِاللهِ`,
    englishText: `O young man, I shall teach you some words of advice: Be mindful of Allah and Allah will protect you. Be mindful of Allah and you will find Him in front of you. If you ask, then ask Allah alone; and if you seek help, then seek help from Allah alone. And know that if the entire nation were to gather together to benefit you, they would not benefit you except by what Allah had already prescribed for you. And if they gathered to harm you, they would not harm you except by what Allah had already prescribed against you.`,
    source: "Tirmidhi (Hasan)"
  },
  {
    id: 20,
    title: "Modesty",
    narrator: "Abu Masud al-Ansari",
    arabicText: `إِنَّ مِمَّا أَدْرَكَ النَّاسُ مِنْ كَلَامِ النُّبُوَّةِ الأُولَى: إِذَا لَمْ تَسْتَحِ فَاصْنَعْ مَا شِئْتَ`,
    englishText: `Among the things the people have learned from the words of the early prophethood: "If you feel no shame, then do as you wish."`,
    source: "Bukhari"
  },
  {
    id: 21,
    title: "Steadfastness in Faith",
    narrator: "Sufyan ibn Abdullah al-Thaqafi",
    arabicText: `قُلْ آمَنْتُ بِاللهِ ثُمَّ اسْتَقِمْ`,
    englishText: `Say: "I believe in Allah," and then be steadfast. I said: "O Messenger of Allah, tell me something about Islam such that I would not need to ask anyone other than you." He said: "Say: 'I believe in Allah,' and then be steadfast."`,
    source: "Muslim"
  },
  {
    id: 22,
    title: "Do Not Ask of People",
    narrator: "Jabir ibn Sulaym al-Hujaymi",
    arabicText: `لَا تَسْأَلَنَّ أَحَدًا شَيْئًا، فَمَا سَأَلْتُ أَحَدًا شَيْئًا بَعْدَهُ. وَاتَّقِ اللهَ حَيْثُمَا كُنْتَ، وَإِذَا عَمِلْتَ سَيِّئَةً فَأَتْبِعْهَا حَسَنَةً`,
    englishText: `"Do not ask anything of anyone." He said: After that I never asked anyone for anything. And: "Fear Allah wherever you are. If you do an evil deed, follow it with a good deed to erase it. And deal with people with good character."`,
    source: "Abu Dawud, Tirmidhi"
  },
  {
    id: 23,
    title: "Purity is Half of Faith",
    narrator: "Abu Malik al-Harith al-Ash'ari",
    arabicText: `الطُّهُورُ شَطْرُ الإِيمَانِ، وَالْحَمْدُ لِلَّهِ تَمْلَأُ الْمِيزَانَ، وَسُبْحَانَ اللهِ وَالْحَمْدُ لِلَّهِ تَمْلَآنِ أَوْ تَمْلَأُ مَا بَيْنَ السَّمَوَاتِ وَالأَرْضِ`,
    englishText: `Purity is half of faith. "Alhamdulillah" fills the scale. "Subhanallah" and "Alhamdulillah" fill what is between the heavens and the earth. The prayer is a light, charity is proof of faith, patience is illumination, and the Quran is either a proof for you or against you. Every person starts his day and is a vendor of his soul, either freeing it or bringing about its ruin.`,
    source: "Muslim"
  },
  {
    id: 24,
    title: "The Prohibition of Oppression",
    narrator: "Abu Dharr al-Ghifari",
    arabicText: `يَا عِبَادِي إِنِّي حَرَّمْتُ الظُّلْمَ عَلَى نَفْسِي وَجَعَلْتُهُ بَيْنَكُمْ مُحَرَّمًا فَلَا تَظَالَمُوا`,
    englishText: `(Hadith Qudsi) Allah said: "O My servants, I have forbidden oppression for Myself and I have made it forbidden among you, so do not oppress one another. O My servants, all of you are astray except for those I have guided, so seek guidance of Me and I shall guide you. O My servants, all of you are hungry except for those I have fed, so seek food of Me and I shall feed you. O My servants, all of you are naked except for those I have clothed, so seek clothing of Me and I shall clothe you."`,
    source: "Muslim"
  },
  {
    id: 25,
    title: "Charity for Every Joint",
    narrator: "Abu Hurairah",
    arabicText: `كُلُّ سُلَامَى مِنَ النَّاسِ عَلَيْهِ صَدَقَةٌ كُلَّ يَوْمٍ تَطْلُعُ فِيهِ الشَّمْسُ: تَعْدِلُ بَيْنَ اثْنَيْنِ صَدَقَةٌ، وَتُعِينُ الرَّجُلَ فِي دَابَّتِهِ صَدَقَةٌ، وَالْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ، وَبِكُلِّ خَطْوَةٍ تَمْشِيهَا إِلَى الصَّلَاةِ صَدَقَةٌ، وَتُمِيطُ الأَذَى عَنِ الطَّرِيقِ صَدَقَةٌ`,
    englishText: `Every joint in a person must perform an act of charity every day the sun rises: being just between two people is a charity; helping a man with his mount, lifting him onto it or loading his belongings onto it, is a charity; a good word is a charity; every step taken toward the prayer is a charity; and removing something harmful from the road is a charity.`,
    source: "Bukhari & Muslim"
  },
  {
    id: 26,
    title: "Every Act of Kindness is Charity",
    narrator: "Jabir ibn Abdullah",
    arabicText: `كُلُّ مَعْرُوفٍ صَدَقَةٌ`,
    englishText: `Every act of kindness is a charity.`,
    source: "Bukhari & Muslim"
  },
  {
    id: 27,
    title: "Righteousness and Sin",
    narrator: "Nawwas ibn Sam'an",
    arabicText: `الْبِرُّ حُسْنُ الْخُلُقِ، وَالإِثْمُ مَا حَاكَ فِي صَدْرِكَ وَكَرِهْتَ أَنْ يَطَّلِعَ عَلَيْهِ النَّاسُ`,
    englishText: `Righteousness is good character, and sin is what bothers your heart and you dislike people finding out about it.`,
    source: "Muslim"
  },
  {
    id: 28,
    title: "Clinging to the Sunnah",
    narrator: "Al-Irbad ibn Sariyah",
    arabicText: `عَلَيْكُمْ بِسُنَّتِي وَسُنَّةِ الْخُلَفَاءِ الرَّاشِدِينَ الْمَهْدِيِّينَ، تَمَسَّكُوا بِهَا وَعَضُّوا عَلَيْهَا بِالنَّوَاجِذِ، وَإِيَّاكُمْ وَمُحْدَثَاتِ الأُمُورِ، فَإِنَّ كُلَّ مُحْدَثَةٍ بِدْعَةٌ وَكُلَّ بِدْعَةٍ ضَلَالَةٌ`,
    englishText: `I urge you to hold fast to my Sunnah and the examples of the Rightly-Guided Caliphs — cling to them firmly. Beware of newly invented matters, for every newly invented matter is a bid'ah (innovation), and every bid'ah is going astray. The Prophet delivered an admonition that made hearts tremble and eyes shed tears. They said: "It is as if this is a farewell sermon, so advise us." He said: "I advise you to fear Allah and to give full obedience even if an Abyssinian slave is made your ruler."`,
    source: "Abu Dawud & Tirmidhi"
  },
  {
    id: 29,
    title: "Guard Your Tongue",
    narrator: "Mu'adh ibn Jabal",
    arabicText: `رَأْسُ الأَمْرِ الإِسْلَامُ، وَعَمُودُهُ الصَّلَاةُ، وَذِرْوَةُ سَنَامِهِ الْجِهَادُ. أَلَا أُخْبِرُكَ بِمِلَاكِ ذَلِكَ كُلِّهِ؟ قُلْتُ: بَلَى. فَأَخَذَ بِلِسَانِهِ وَقَالَ: كُفَّ عَلَيْكَ هَذَا`,
    englishText: `"The head of the matter is Islam, its pillar is the prayer, and the pinnacle of its hump is Jihad." Then he said: "Shall I not tell you of the foundation of all of that?" I said: "Yes." So he took hold of his tongue and said: "Restrain this." I said: "O Prophet of Allah, will we be held accountable for what we say?" He said: "May your mother be bereaved of you, O Mu'adh! Is there anything that topples people into the Fire on their faces — or on their noses — other than the harvests of their tongues?"`,
    source: "Tirmidhi (Hasan Sahih)"
  },
  {
    id: 30,
    title: "Allah's Limits and Silence",
    narrator: "Abu Tha'labah al-Khushani",
    arabicText: `إِنَّ اللهَ فَرَضَ فَرَائِضَ فَلَا تُضَيِّعُوهَا، وَحَدَّ حُدُودًا فَلَا تَعْتَدُوهَا، وَحَرَّمَ أَشْيَاءَ فَلَا تَنْتَهِكُوهَا، وَسَكَتَ عَنْ أَشْيَاءَ رَحْمَةً لَكُمْ غَيْرَ نِسْيَانٍ فَلَا تَبْحَثُوا عَنْهَا`,
    englishText: `Allah has laid down obligations — do not neglect them. He has set limits — do not transgress them. He has forbidden certain things — do not violate them. And He has remained silent about certain things — as a mercy to you, not out of forgetfulness — so do not inquire into them.`,
    source: "Al-Daraqutni (Hasan)"
  },
  {
    id: 31,
    title: "Renounce the World",
    narrator: "Sahl ibn Sa'd al-Sa'idi",
    arabicText: `ازْهَدْ فِي الدُّنْيَا يُحِبَّكَ اللهُ، وَازْهَدْ فِيمَا عِنْدَ النَّاسِ يُحِبَّكَ النَّاسُ`,
    englishText: `Renounce the world and Allah will love you. Renounce what people have and people will love you.`,
    source: "Ibn Majah (Hasan)"
  },
  {
    id: 32,
    title: "No Harm and No Reciprocating Harm",
    narrator: "Ibn Abbas & Ubadah ibn al-Samit",
    arabicText: `لَا ضَرَرَ وَلَا ضِرَارَ`,
    englishText: `There should be no harm inflicted upon oneself nor should harm be reciprocated against others. Whoever harms others, Allah will harm him. Whoever causes hardship to others, Allah will cause hardship to him.`,
    source: "Ibn Majah & Al-Daraqutni (Hasan)"
  },
  {
    id: 33,
    title: "The Burden of Proof",
    narrator: "Ibn Abbas",
    arabicText: `لَوْ يُعْطَى النَّاسُ بِدَعْوَاهُمْ لَادَّعَى نَاسٌ دِمَاءَ رِجَالٍ وَأَمْوَالَهُمْ، وَلَكِنَّ الْيَمِينَ عَلَى الْمُدَّعَى عَلَيْهِ`,
    englishText: `If people were given what they claimed merely on the basis of their assertions, people would claim the blood and wealth of others. But the oath falls upon the one against whom a claim is made. This establishes the fundamental principle that claims require evidence, and the burden of proof lies with the claimant.`,
    source: "Bukhari & Muslim"
  },
  {
    id: 34,
    title: "Changing Evil with Your Hand, Tongue, or Heart",
    narrator: "Abu Sa'id al-Khudri",
    arabicText: `مَنْ رَأَى مِنْكُمْ مُنْكَرًا فَلْيُغَيِّرْهُ بِيَدِهِ، فَإِنْ لَمْ يَسْتَطِعْ فَبِلِسَانِهِ، فَإِنْ لَمْ يَسْتَطِعْ فَبِقَلْبِهِ، وَذَلِكَ أَضْعَفُ الإِيمَانِ`,
    englishText: `Whoever among you sees an evil, let him change it with his hand. If he is unable to do so, then with his tongue. And if he is unable, then with his heart — and that is the weakest level of faith.`,
    source: "Muslim"
  },
  {
    id: 35,
    title: "Brotherhood Among Believers",
    narrator: "Abu Hurairah",
    arabicText: `لَا تَحَاسَدُوا، وَلَا تَنَاجَشُوا، وَلَا تَبَاغَضُوا، وَلَا تَدَابَرُوا، وَلَا يَبِعْ بَعْضُكُمْ عَلَى بَيْعِ بَعْضٍ، وَكُونُوا عِبَادَ اللهِ إِخْوَانًا. الْمُسْلِمُ أَخُو الْمُسْلِمِ`,
    englishText: `Do not envy one another. Do not outbid one another in auctions. Do not hate one another. Do not turn your backs on one another. Do not undercut one another's sales. Be, O servants of Allah, brothers to one another. A Muslim is the brother of a Muslim: he does not wrong him, nor forsake him, nor lie to him, nor hold him in contempt. Piety is right here — and he pointed to his chest three times. It is sufficient evil for a man to hold his brother Muslim in contempt.`,
    source: "Muslim"
  },
  {
    id: 36,
    title: "Relieving a Believer's Hardship",
    narrator: "Abu Hurairah",
    arabicText: `مَنْ نَفَّسَ عَنْ مُؤْمِنٍ كُرْبَةً مِنْ كُرَبِ الدُّنْيَا نَفَّسَ اللهُ عَنْهُ كُرْبَةً مِنْ كُرَبِ يَوْمِ الْقِيَامَةِ، وَمَنْ يَسَّرَ عَلَى مُعْسِرٍ يَسَّرَ اللهُ عَلَيْهِ فِي الدُّنْيَا وَالآخِرَةِ`,
    englishText: `Whoever relieves a believer of one of the hardships of this world, Allah will relieve him of one of the hardships of the Day of Resurrection. Whoever makes things easier for one who is in difficulty, Allah will make things easier for him in this world and in the Hereafter. Whoever conceals a Muslim's faults, Allah will conceal his faults in this world and the Hereafter. Allah helps His servant as long as the servant is helping his brother.`,
    source: "Muslim"
  },
  {
    id: 37,
    title: "The Multiplication of Good Deeds",
    narrator: "Ibn Abbas",
    arabicText: `إِنَّ اللهَ كَتَبَ الْحَسَنَاتِ وَالسَّيِّئَاتِ، فَمَنْ هَمَّ بِحَسَنَةٍ فَلَمْ يَعْمَلْهَا كَتَبَهَا اللهُ عِنْدَهُ حَسَنَةً كَامِلَةً، وَإِنْ هَمَّ بِهَا فَعَمِلَهَا كَتَبَهَا اللهُ عَشْرَ حَسَنَاتٍ إِلَى سَبْعِمِائَةِ ضِعْفٍ إِلَى أَضْعَافٍ كَثِيرَةٍ`,
    englishText: `(Hadith Qudsi) Verily Allah has recorded the good deeds and the evil deeds. Whoever intends to do a good deed but does not do it, Allah records it as one complete good deed. If he intends to do it and does it, Allah records it as ten to seven hundred times and more. Whoever intends to do an evil deed but does not do it, Allah records it as one complete good deed. If he intends to do it and does it, Allah records it as just one evil deed.`,
    source: "Bukhari & Muslim"
  },
  {
    id: 38,
    title: "Allah's Closeness to His Servants",
    narrator: "Abu Hurairah",
    arabicText: `مَنْ عَادَى لِي وَلِيًّا فَقَدْ آذَنْتُهُ بِالْحَرْبِ، وَمَا تَقَرَّبَ إِلَيَّ عَبْدِي بِشَيْءٍ أَحَبَّ إِلَيَّ مِمَّا افْتَرَضْتُهُ عَلَيْهِ، وَمَا يَزَالُ عَبْدِي يَتَقَرَّبُ إِلَيَّ بِالنَّوَافِلِ حَتَّى أُحِبَّهُ`,
    englishText: `(Hadith Qudsi) Whoever shows enmity to a friend of Mine, I declare war upon him. My servant does not draw near to Me with anything more loved by Me than the obligations I have placed upon him. My servant continues to draw near to Me through voluntary acts of worship until I love him. When I love him, I become his hearing with which he hears, his sight with which he sees, his hand with which he strikes, and his foot with which he walks. Were he to ask of Me, I would surely give him, and were he to seek My refuge, I would surely grant it.`,
    source: "Bukhari"
  },
  {
    id: 39,
    title: "Allah Forgives Mistakes and Forgetfulness",
    narrator: "Ibn Abbas",
    arabicText: `إِنَّ اللهَ تَجَاوَزَ لِي عَنْ أُمَّتِي: الْخَطَأَ وَالنِّسْيَانَ وَمَا اسْتُكْرِهُوا عَلَيْهِ`,
    englishText: `Verily, Allah has pardoned my Ummah for mistakes, forgetfulness, and that which they are compelled to do.`,
    source: "Ibn Majah & Al-Bayhaqi (Hasan)"
  },
  {
    id: 40,
    title: "Be in This World as a Stranger",
    narrator: "Ibn Umar",
    arabicText: `كُنْ فِي الدُّنْيَا كَأَنَّكَ غَرِيبٌ أَوْ عَابِرُ سَبِيلٍ. وَكَانَ ابْنُ عُمَرَ يَقُولُ: إِذَا أَمْسَيْتَ فَلَا تَنْتَظِرِ الصَّبَاحَ، وَإِذَا أَصْبَحْتَ فَلَا تَنْتَظِرِ الْمَسَاءَ، وَخُذْ مِنْ صِحَّتِكَ لِمَرَضِكَ، وَمِنْ حَيَاتِكَ لِمَوْتِكَ`,
    englishText: `The Messenger of Allah (peace be upon him) took me by the shoulder and said: "Be in this world as if you were a stranger or a traveler along a path." Ibn 'Umar used to say: "When evening comes, do not wait for the morning. When morning comes, do not wait for the evening. Take advantage of your health before sickness, and of your life before death."`,
    source: "Bukhari"
  }
];
