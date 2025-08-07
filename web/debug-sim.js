// Debug what's happening in the constructor
const state0 = 18446462598732906495;
const tagList = 'RNBQKBNRPPPPPPPPpppppppprnbqkbnr';

console.log('State0:', state0);
console.log('Tag list length:', tagList.length);

// Check if state0 is within bounds
console.log('Is state0 < 2^64?', state0 < Math.pow(2, 64));
console.log('Math.pow(2, 64):', Math.pow(2, 64));
console.log('Number.MAX_SAFE_INTEGER:', Number.MAX_SAFE_INTEGER);

// Check bit string conversion
function intToBitStr(value, length) {
  return value.toString(2).padStart(length, '0');
}

const basis0 = intToBitStr(state0, 64);
console.log('Basis0 length:', basis0.length);
console.log('Basis0:', basis0);

const onesCount = basis0.split('').filter(x => x === '1').length;
console.log('Ones count:', onesCount);
console.log('Tag list length:', tagList.length);
console.log('Match?', onesCount === tagList.length);