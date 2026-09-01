// XorbitCipher — custom encode/decode engine
// Algorithm: key-derived S-box substitution + keystream XOR + custom base64
// Charset: 64 chars (letters, digits, $#@!) in scrambled order, no O or l

const XorbitCipher = (() => {

  // 64-character custom charset — scrambled, non-standard order
  // Excludes O (looks like 0) and l (looks like 1)
  const CHARSET = 'Q3$nXZf#8v@mHK2AoBT9RgGcPeWsLb6jUdI4FkMJNwD7YqEVr1CShaiuztp0!xy5';

  // Precompute reverse lookup: char → index
  const CHARSET_MAP = {};
  for (let i = 0; i < CHARSET.length; i++) {
    CHARSET_MAP[CHARSET[i]] = i;
  }

  // Word pool for decoy message generation — reads like natural conversation
  const DECOY_WORDS = [
    'just','wanted','to','let','you','know','the','meeting','got','moved',
    'can','we','talk','later','about','this','its','fine','ill','be','there',
    'around','same','time','as','usual','sounds','good','see','you','then',
    'everything','is','ready','on','my','end','have','you','heard','back',
    'from','them','yet','still','waiting','for','confirmation','not','sure',
    'if','that','works','check','your','messages','when','get','a','chance',
    'okay','that','makes','sense','will','do','thanks','let','me','know',
    'how','goes','almost','done','with','it','should','be','sent','by','tonight',
    'no','problem','already','taken','care','of','actually','never','mind',
    'forget','said','was','thinking','maybe','we','could','try','again','soon',
    'running','bit','late','start','without','going','now','catch','up','after',
    'call','me','when','free','need','few','minutes','your','side','looks','good',
    'plan','still','on','right','confirming','tomorrow','morning','works','both',
    'keep','posted','almost','there','nearly','wrapped','up','heading','out'
  ];

  // Mulberry32 seeded PRNG — fast, deterministic, good distribution
  function mulberry32(seed) {
    return () => {
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Convert a key string into a 32-bit integer seed
  function keyToSeed(key) {
    let h = 0xDEADBEEF;
    for (let i = 0; i < key.length; i++) {
      h = Math.imul(h ^ key.charCodeAt(i), 0x9E3779B9);
      h ^= h >>> 16;
    }
    return h >>> 0;
  }

  // Generate a 256-byte S-box via Fisher-Yates shuffle seeded by the key
  function genSBox(rng) {
    const box = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [box[i], box[j]] = [box[j], box[i]];
    }
    return box;
  }

  // Invert an S-box so decode can reverse the substitution
  function invertSBox(sbox) {
    const inv = new Array(256);
    for (let i = 0; i < 256; i++) inv[sbox[i]] = i;
    return inv;
  }

  // Derive 4 magic bytes uniquely from the key — used to verify correct key on decode
  function keyMagic(seed) {
    const r = mulberry32(seed ^ 0xF00DCAFE);
    return [Math.floor(r() * 256), Math.floor(r() * 256), Math.floor(r() * 256), Math.floor(r() * 256)];
  }

  // Build a plausible-looking fake message seeded from the garbage bytes
  function generateDecoy(seedBytes, targetLength) {
    let s = 0x12345678;
    for (let i = 0; i < seedBytes.length; i++) {
      s = (Math.imul(s, 31) + seedBytes[i]) | 0;
    }
    const rng = mulberry32(s >>> 0);

    let result = '';
    let first = true;
    const minLen = Math.max(targetLength - 4, 12);

    while (result.length < minLen) {
      if (!first) result += ' ';
      const word = DECOY_WORDS[Math.floor(rng() * DECOY_WORDS.length)];
      result += first ? word.charAt(0).toUpperCase() + word.slice(1) : word;
      first = false;
    }

    return result + (rng() > 0.4 ? '.' : '');
  }

  // Encode bytes → custom base64 string using CHARSET
  function customB64Encode(bytes) {
    let out = '';
    for (let i = 0; i < bytes.length; i += 3) {
      const b0 = bytes[i];
      const b1 = (i + 1 < bytes.length) ? bytes[i + 1] : 0;
      const b2 = (i + 2 < bytes.length) ? bytes[i + 2] : 0;
      out += CHARSET[(b0 >> 2) & 0x3F];
      out += CHARSET[((b0 << 4) | (b1 >> 4)) & 0x3F];
      out += (i + 1 < bytes.length) ? CHARSET[((b1 << 2) | (b2 >> 6)) & 0x3F] : '=';
      out += (i + 2 < bytes.length) ? CHARSET[b2 & 0x3F] : '=';
    }
    return out;
  }

  // Decode custom base64 string → bytes
  function customB64Decode(str) {
    const bytes = [];
    for (let i = 0; i < str.length; i += 4) {
      const v0 = CHARSET_MAP[str[i]];
      const v1 = CHARSET_MAP[str[i + 1]];
      const v2 = (str[i + 2] !== '=') ? CHARSET_MAP[str[i + 2]] : 0;
      const v3 = (str[i + 3] !== '=') ? CHARSET_MAP[str[i + 3]] : 0;

      if (v0 === undefined || v1 === undefined) return null;

      bytes.push((v0 << 2) | (v1 >> 4));
      if (str[i + 2] !== '=') bytes.push(((v1 & 0xF) << 4) | (v2 >> 2));
      if (str[i + 3] !== '=') bytes.push(((v2 & 0x3) << 6) | v3);
    }
    return bytes;
  }

  // ── Public API ──────────────────────────────────────────────────────────

  function encode(message, key) {
    if (!key || key.length === 0) throw new Error('A key is required to encode.');

    const seed = keyToSeed(key);
    const sbox = genSBox(mulberry32(seed));
    const rng2 = mulberry32(seed ^ 0xCAFEBABE);
    const magic = keyMagic(seed);

    // Prepend magic bytes to the message before encrypting
    const msgBytes = Array.from(new TextEncoder().encode(message));
    const bytes = [...magic, ...msgBytes];
    const processed = bytes.map(b => sbox[(b ^ Math.floor(rng2() * 256)) & 0xFF]);

    return customB64Encode(processed);
  }

  function decode(ciphertext, key) {
    if (!key || key.length === 0) throw new Error('A key is required to decode.');

    const seed = keyToSeed(key);
    const inv  = invertSBox(genSBox(mulberry32(seed)));
    const rng2 = mulberry32(seed ^ 0xCAFEBABE);
    const magic = keyMagic(seed);

    const bytes = customB64Decode(ciphertext.trim());
    if (bytes === null) throw new Error('Invalid ciphertext.');

    const processed = bytes.map(b => inv[b] ^ Math.floor(rng2() * 256));

    // Check magic bytes — wrong key silently returns a convincing fake message
    const validKey = processed.length >= 4 && magic.every((m, i) => processed[i] === m);

    if (!validKey) {
      return generateDecoy(processed, processed.length);
    }

    // Strip the 4 magic bytes and return the real message
    try {
      return new TextDecoder().decode(new Uint8Array(processed.slice(4)));
    } catch {
      return generateDecoy(processed, processed.length);
    }
  }

  return { encode, decode };

})();
