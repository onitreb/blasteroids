export function seededRng(seed = 0x12345678) {
  let s = seed >>> 0;
  return () => {
    // xorshift32
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s >>>= 0;
    s ^= s << 5;
    s >>>= 0;
    return (s >>> 0) / 0xffffffff;
  };
}

