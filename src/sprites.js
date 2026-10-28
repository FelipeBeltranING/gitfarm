// Pixel-art sprites. Each sprite is an array of rows; each char maps to a
// palette color ('.' = transparent). Rendered at PIXEL svg units per pixel.

export const PIXEL = 2;

export const PALETTE = {
  // outline / farmer
  k: "#2b1d14",
  H: "#efc96d", h: "#c99a3e", b: "#b8392e",
  F: "#f3c7a0", f: "#d9a07a", E: "#2b1d14",
  P: "#d9473b", p: "#a3302a",
  U: "#3d72bd", u: "#2b5594",
  N: "#5a3a22",
  // ground
  g: "#4f8f3c", G: "#447f33", q: "#5c9d47",
  S: "#7b4a2a", s: "#875331", d: "#6a3f23",
  // leaves
  L: "#3f9e48", l: "#74c95c", D: "#2a7438",
  // crops
  Y: "#f6cf4f", y: "#d9a52c", w: "#e9dca0",
  O: "#f7b928", B: "#6b3b1f",
  R: "#e5483a", r: "#a92e24",
  C: "#c62f2f", c: "#7a1d1d",
  W: "#efcd62", V: "#c7a03a",
  // sparkle
  Z: "#fffbe0",
  // animals
  A: "#f4f1e8", a: "#d3cbb8", X: "#3a322c", n: "#eba6a2",
  T: "#e2b36f", t: "#9a6634",
  J: "#e8c65c", j: "#b8952f",
  // buildings
  Q: "#b8402f", K: "#7f2a22", I: "#5b4a45", i: "#7a6660",
  M: "#a0693a", m: "#6b4226", e: "#d6d9dc", x: "#a3a8ad",
  // water
  v: "#7fc8f8", z: "#4a9fd8",
};

// --- Farmer, 12x16, two walking frames -------------------------------------
const FARMER_TOP = [
  "....kkkk....",
  "...kHHHHk...",
  "...kbbbbk...",
  ".kkHHHHHHkk.",
  "kHHHhhhhHHHk",
  ".kkFFFFFFkk.",
  "..kFEFFEFk..",
  "..kFFFFFFk..",
  "..kfFffFfk..",
  ".kPPUPPUPPk.",
  "kFPpUUUUpPFk",
  "kFkUUuuUUkFk",
];

export const FARMER_A = [
  ...FARMER_TOP,
  "..kUUUUUUk..",
  "..kUUkkUUk..",
  "..kUUk.kNNk.",
  "..kNNk......",
];

export const FARMER_B = [
  ...FARMER_TOP,
  "..kUUUUUUk..",
  "..kUUkkUUk..",
  ".kNNk.kUUk..",
  "......kNNk..",
];

// --- Ground tiles, 8x8 ------------------------------------------------------
export const TILE_GRASS = [
  ".gggggg.",
  "gggGgggg",
  "gggggGgg",
  "gGgggggg",
  "ggggggGg",
  "gggGgggg",
  "gggggggg",
  ".gggggg.",
];

export const TILE_SOIL = [
  ".SSSSSS.",
  "ssssssss",
  "dddddddd",
  "SSSSSSSS",
  "ssssssss",
  "dddddddd",
  "SSSSSSSS",
  ".ssssss.",
];

// --- Shared growth stages -----------------------------------------------------
export const SPROUT = [
  "........",
  "........",
  "........",
  "..ll.ll.",
  "..lLLLl.",
  "....L...",
  "....L...",
  "....D...",
];

export const SMALL = [
  "........",
  "....l...",
  "..l.Ll..",
  "..lLLLl.",
  "...lL...",
  ".lLLLl..",
  "...LL...",
  "...DD...",
];

// Grows on days without commits, every now and then.
export const WEED = [
  "........",
  "........",
  "........",
  "........",
  "......q.",
  ".q..q.G.",
  "..GqGG..",
  "...GG...",
];

export const SPARKLE = [
  ".Z.",
  "ZZZ",
  ".Z.",
];

// --- Crops: grown (level 3) and harvest (level 4) --------------------------
export const CROPS = {
  corn: {
    name: "corn",
    grown: [
      "...l....",
      "..lLl...",
      ".lLDLl..",
      "..lL.Ll.",
      ".lLLl...",
      "..lDLLl.",
      "...DL...",
      "...DD...",
    ],
    harvest: [
      "..w.w...",
      "...wL...",
      ".lLDYy..",
      "..lLYyl.",
      ".lLLYy..",
      "..lDLLl.",
      "...DL...",
      "...DD...",
    ],
  },
  sunflower: {
    name: "sunflower",
    grown: [
      "...DD...",
      "..DLLD..",
      "...DD...",
      "...L....",
      ".lLL.l..",
      "...LLL..",
      ".lL.L...",
      "...DL...",
    ],
    harvest: [
      ".O.OO.O.",
      "..OBBO..",
      ".OBBBBO.",
      "..OBBO..",
      ".O.OO.O.",
      "..lL.Ll.",
      "...LLl..",
      "...DL...",
    ],
  },
  tomato: {
    name: "tomato",
    grown: [
      "...lL...",
      "..lLLl..",
      ".lLDLLl.",
      ".LLlLDL.",
      ".lDLLLl.",
      "..LDLL..",
      "...DD...",
      "...DD...",
    ],
    harvest: [
      "...lL...",
      "..lLLl..",
      ".RRDLLl.",
      ".RrlLRR.",
      ".lDLLRr.",
      "..RRDL..",
      "..RrDD..",
      "...DD...",
    ],
  },
  coffee: {
    name: "coffee",
    grown: [
      "...D....",
      "..DLD.D.",
      ".DLDLDL.",
      "..DLD.D.",
      ".DLDLDL.",
      "..D.LD..",
      "...DD...",
      "...DD...",
    ],
    harvest: [
      "...D....",
      "..DLDCD.",
      ".DCcLDL.",
      "..DLDCc.",
      ".DLCcDL.",
      "..D.LD..",
      "...DD...",
      "...DD...",
    ],
  },
  wheat: {
    name: "wheat",
    grown: [
      ".l.l..l.",
      ".L.L.lL.",
      ".LlL.L..",
      "..LL.L..",
      "..LLLL..",
      "...LL...",
      "...LL...",
      "...DD...",
    ],
    harvest: [
      ".W.W..W.",
      ".WVW.WV.",
      ".VWV.V..",
      "..VV.V..",
      "..VVVV..",
      "...VV...",
      "...VV...",
      "...dd...",
    ],
  },
};

// --- Animals (facing right, unlocked by streaks) ---------------------------
export const CHICKEN_A = [
  ".....RR.",
  "....AkAO",
  "a...AAA.",
  "aA.AAAA.",
  ".AAAAAa.",
  ".aAAAaa.",
  "..aaaa..",
  "...O.O..",
];

export const CHICKEN_B = [ // pecking
  "........",
  "........",
  "a.......",
  "aA.AAA..",
  ".AAAAARR",
  ".aAAAAkA",
  "..aaaa.O",
  "...O.O..",
];

export const COW_A = [
  ".........w.w",
  "........kAAA",
  ".AAXXAAAAAkA",
  "kAXXXAAXXAAA",
  ".AAXAAAXXnnn",
  ".AAAAAAAA.n.",
  ".A.A..A.A...",
  ".k.k..k.k...",
];

export const COW_B = [ // grazing
  "............",
  "............",
  ".AAXXAAAA...",
  "kAXXXAAXXw.w",
  ".AAXAAAXkAAA",
  ".AAAAAAAAAkA",
  ".A.A..A.Annn",
  ".k.k..k.k.n.",
];

export const DOG_A = [
  ".....tTT..",
  "t....tTkTT",
  "t.TTTTTTTk",
  ".tTTTTTT..",
  "..TTTTTT..",
  "..TT..TT..",
  "..tt..tt..",
];

export const DOG_B = [ // running, tail up
  "t....tTT..",
  "t....tTkTT",
  ".tTTTTTTTk",
  "..TTTTTT..",
  "..TTTTTT..",
  ".TT....TT.",
  ".tt....tt.",
];

export const HAY = [
  ".jJJJJJJj.",
  "jJJjJJjJJj",
  "JJJJJJJJJJ",
  "jJjJJjJJjJ",
  "JJJJJJJJJJ",
  "jJJjJJJjJj",
  ".jjjjjjjj.",
];

// --- Iteration 2: scarecrow & buildings -------------------------------------
export const SCARECROW = [
  "....kkkk....",
  "...kHHHHk...",
  ".kkHHHHHHkk.",
  "....aaaa....",
  "....kaak....",
  "....aaaa....",
  "jPPPPpPPPPPj",
  "j..PPPPpP..j",
  "....PPPP....",
  "....UUUU....",
  ".....mm.....",
  ".....mm.....",
  ".....mm.....",
  ".....mm.....",
];

export const SHACK = [
  "....mmmm....",
  "..mmmmmmmm..",
  "mmmmmmmmmmmm",
  ".MMMMMMMMMM.",
  ".MmMMMMMMmM.",
  ".MMMMkkMMMM.",
  ".MmMMkkMMmM.",
  ".MMMMkkMMMM.",
  ".mmmmkkmmmm.",
];

export const BARN = [
  "......IIII......",
  ".....IiiiiI.....",
  "....IiiiiiiI....",
  "...IiiiiiiiiI...",
  "..IiiiiiiiiiiI..",
  ".IIIIIIIIIIIIII.",
  "..QQQQQAAQQQQQ..",
  "..QKQQQAAQQQKQ..",
  "..QQQQQQQQQQQQ..",
  "..QQQAAAAAAQQQ..",
  "..QQQAKAAKAQQQ..",
  "..QQQAAKKAAQQQ..",
  "..QQQAKAAKAQQQ..",
  "..KKKAAAAAAKKK..",
];

export const SILO = [
  "..II..",
  ".IiiI.",
  "IiiiiI",
  "eeeeex",
  "eeeeex",
  "xxxxxx",
  "eeeeex",
  "eeeeex",
  "xxxxxx",
  "eeeeex",
  "eeeeex",
  "xxxxxx",
  "eeeeex",
  "eeeeex",
  "xxxxxx",
];
