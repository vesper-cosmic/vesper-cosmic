// Common birthplaces → IANA time zone + longitude (degrees east, west negative),
// used to pre-fill true-solar-time correction. Matching is a loose text search on
// what the customer typed ("Taipei, Taiwan", "台北"). Not found → the owner types
// the longitude and zone by hand. Longitudes are city centres (±0.1° ≈ 0.4 min).

export const BIRTH_CITIES = [
  // Taiwan
  { names: ["taipei", "台北", "臺北", "new taipei", "新北"], tz: "Asia/Taipei", lon: 121.56 },
  { names: ["taoyuan", "桃園"], tz: "Asia/Taipei", lon: 121.3 },
  { names: ["hsinchu", "新竹"], tz: "Asia/Taipei", lon: 120.97 },
  { names: ["taichung", "台中", "臺中"], tz: "Asia/Taipei", lon: 120.68 },
  { names: ["changhua", "彰化"], tz: "Asia/Taipei", lon: 120.54 },
  { names: ["chiayi", "嘉義"], tz: "Asia/Taipei", lon: 120.45 },
  { names: ["tainan", "台南", "臺南"], tz: "Asia/Taipei", lon: 120.21 },
  { names: ["kaohsiung", "高雄"], tz: "Asia/Taipei", lon: 120.31 },
  { names: ["pingtung", "屏東"], tz: "Asia/Taipei", lon: 120.49 },
  { names: ["keelung", "基隆"], tz: "Asia/Taipei", lon: 121.74 },
  { names: ["yilan", "宜蘭"], tz: "Asia/Taipei", lon: 121.75 },
  { names: ["hualien", "花蓮"], tz: "Asia/Taipei", lon: 121.6 },
  { names: ["taitung", "台東", "臺東"], tz: "Asia/Taipei", lon: 121.15 },
  { names: ["taiwan", "台灣", "臺灣"], tz: "Asia/Taipei", lon: 121 },
  // East / Southeast Asia
  { names: ["hong kong", "香港"], tz: "Asia/Hong_Kong", lon: 114.17 },
  { names: ["macau", "macao", "澳門"], tz: "Asia/Macau", lon: 113.54 },
  { names: ["beijing", "北京"], tz: "Asia/Shanghai", lon: 116.41 },
  { names: ["shanghai", "上海"], tz: "Asia/Shanghai", lon: 121.47 },
  { names: ["guangzhou", "廣州", "广州"], tz: "Asia/Shanghai", lon: 113.26 },
  { names: ["shenzhen", "深圳"], tz: "Asia/Shanghai", lon: 114.06 },
  { names: ["chengdu", "成都"], tz: "Asia/Shanghai", lon: 104.07 },
  { names: ["tokyo", "東京", "东京"], tz: "Asia/Tokyo", lon: 139.69 },
  { names: ["osaka", "大阪"], tz: "Asia/Tokyo", lon: 135.5 },
  { names: ["seoul", "首爾", "首尔"], tz: "Asia/Seoul", lon: 126.98 },
  { names: ["singapore", "新加坡"], tz: "Asia/Singapore", lon: 103.82 },
  { names: ["kuala lumpur", "吉隆坡"], tz: "Asia/Kuala_Lumpur", lon: 101.69 },
  { names: ["bangkok", "曼谷"], tz: "Asia/Bangkok", lon: 100.5 },
  { names: ["manila", "馬尼拉"], tz: "Asia/Manila", lon: 120.98 },
  { names: ["jakarta", "雅加達"], tz: "Asia/Jakarta", lon: 106.85 },
  { names: ["ho chi minh", "saigon", "胡志明"], tz: "Asia/Ho_Chi_Minh", lon: 106.63 },
  { names: ["hanoi", "河內"], tz: "Asia/Ho_Chi_Minh", lon: 105.85 },
  { names: ["mumbai", "孟買"], tz: "Asia/Kolkata", lon: 72.88 },
  { names: ["dubai", "杜拜", "迪拜"], tz: "Asia/Dubai", lon: 55.3 },
  // Oceania
  { names: ["sydney", "雪梨", "悉尼"], tz: "Australia/Sydney", lon: 151.21 },
  { names: ["melbourne", "墨爾本"], tz: "Australia/Melbourne", lon: 144.96 },
  { names: ["brisbane", "布里斯本"], tz: "Australia/Brisbane", lon: 153.03 },
  { names: ["perth", "伯斯"], tz: "Australia/Perth", lon: 115.86 },
  { names: ["auckland", "奧克蘭"], tz: "Pacific/Auckland", lon: 174.76 },
  // Europe
  { names: ["london", "倫敦"], tz: "Europe/London", lon: -0.13 },
  { names: ["paris", "巴黎"], tz: "Europe/Paris", lon: 2.35 },
  { names: ["berlin", "柏林"], tz: "Europe/Berlin", lon: 13.4 },
  // North America
  { names: ["new york", "紐約"], tz: "America/New_York", lon: -74.01 },
  { names: ["boston", "波士頓"], tz: "America/New_York", lon: -71.06 },
  { names: ["washington", "華盛頓"], tz: "America/New_York", lon: -77.04 },
  { names: ["miami", "邁阿密"], tz: "America/New_York", lon: -80.19 },
  { names: ["atlanta", "亞特蘭大"], tz: "America/New_York", lon: -84.39 },
  { names: ["chicago", "芝加哥"], tz: "America/Chicago", lon: -87.63 },
  { names: ["houston", "休士頓", "休斯頓"], tz: "America/Chicago", lon: -95.37 },
  { names: ["dallas", "達拉斯"], tz: "America/Chicago", lon: -96.8 },
  { names: ["denver", "丹佛"], tz: "America/Denver", lon: -104.99 },
  { names: ["phoenix", "鳳凰城"], tz: "America/Phoenix", lon: -112.07 },
  { names: ["los angeles", "洛杉磯"], tz: "America/Los_Angeles", lon: -118.24 },
  { names: ["san francisco", "舊金山"], tz: "America/Los_Angeles", lon: -122.42 },
  { names: ["san jose", "聖荷西"], tz: "America/Los_Angeles", lon: -121.89 },
  { names: ["seattle", "西雅圖"], tz: "America/Los_Angeles", lon: -122.33 },
  { names: ["las vegas", "拉斯維加斯"], tz: "America/Los_Angeles", lon: -115.14 },
  { names: ["honolulu", "檀香山", "夏威夷"], tz: "Pacific/Honolulu", lon: -157.86 },
  { names: ["toronto", "多倫多"], tz: "America/Toronto", lon: -79.38 },
  { names: ["vancouver", "溫哥華"], tz: "America/Vancouver", lon: -123.12 },
];

/** Looks the typed birthplace up. @returns {{ tz: string, lon: number, match: string } | null} */
export function findBirthCity(text) {
  const t = String(text || "").toLowerCase();
  if (!t.trim()) return null;
  // Longest matching name wins ("new taipei" before "taipei", city before country).
  let best = null;
  for (const city of BIRTH_CITIES) {
    for (const name of city.names) {
      if (t.includes(name) && (!best || name.length > best.match.length)) best = { tz: city.tz, lon: city.lon, match: name };
    }
  }
  return best;
}
