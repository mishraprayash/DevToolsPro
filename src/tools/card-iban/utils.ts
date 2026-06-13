// ─── Credit Card ─────────────────────────────────────────────────────────────

export interface CardBrand {
  name: string;
  code: string;
  prefixes: number[];
  lengths: number[];
  format: number[];
}

export const CARD_BRANDS: CardBrand[] = [
  { name: 'Visa', code: 'visa', prefixes: [4], lengths: [13, 16, 19], format: [4, 4, 4, 4] },
  { name: 'Mastercard', code: 'mastercard', prefixes: [51, 52, 53, 54, 55, 2221, 2222, 2223, 2224, 2225, 2226, 2227, 2228, 2229, 223, 224, 225, 226, 227, 228, 229, 23, 24, 25, 26, 27, 2720], lengths: [16], format: [4, 4, 4, 4] },
  { name: 'American Express', code: 'amex', prefixes: [34, 37], lengths: [15], format: [4, 6, 5] },
  { name: 'Discover', code: 'discover', prefixes: [6011, 65, 644, 645, 646, 647, 648, 649], lengths: [16, 19], format: [4, 4, 4, 4] },
  { name: 'Diners Club', code: 'diners', prefixes: [300, 301, 302, 303, 304, 305, 36, 38, 39], lengths: [14, 16, 19], format: [4, 6, 4] },
  { name: 'JCB', code: 'jcb', prefixes: [3528, 3529, 3530, 3531, 3532, 3533, 3534, 3535, 3536, 3537, 3538, 3539, 3540, 3541, 3542, 3543, 3544, 3545, 3546, 3547, 3548, 3549, 3550, 3551, 3552, 3553, 3554, 3555, 3556, 3557, 3558, 3559, 3560, 3561, 3562, 3563, 3564, 3565, 3566, 3567, 3568, 3569, 3570, 3571, 3572, 3573, 3574, 3575, 3576, 3577, 3578, 3579, 3580, 3581, 3582, 3583, 3584, 3585, 3586, 3587, 3588, 3589], lengths: [16, 19], format: [4, 4, 4, 4] },
  { name: 'Maestro', code: 'maestro', prefixes: [5018, 5020, 5038, 56, 57, 58, 59, 6304, 6759, 6761, 6762, 6763], lengths: [12, 13, 14, 15, 16, 17, 18, 19], format: [4, 4, 4, 4] },
  { name: 'UnionPay', code: 'unionpay', prefixes: [62], lengths: [16, 17, 18, 19], format: [4, 4, 4, 4] },
];

export function identifyBrand(pan: string): CardBrand | null {
  const digits = pan.replace(/\D/g, '');
  for (const brand of CARD_BRANDS) {
    for (const prefix of brand.prefixes) {
      if (digits.startsWith(String(prefix))) {
        if (brand.lengths.includes(digits.length)) return brand;
        if (digits.length <= Math.max(...brand.lengths) && digits.length >= Math.min(...brand.lengths)) return brand;
      }
    }
  }
  return null;
}

function luhnCheck(digits: string): boolean {
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

export function generateCardNumber(brand: CardBrand): string {
  const length = brand.lengths.includes(16) ? 16 : brand.lengths[0];
  const prefix = String(brand.prefixes[0]);
  let digits = prefix;
  for (let i = digits.length; i < length - 1; i++) {
    digits += Math.floor(Math.random() * 10);
  }
  for (let check = 0; check < 10; check++) {
    const candidate = digits + check;
    if (luhnCheck(candidate)) return candidate;
  }
  return digits + '0';
}

export function formatCardNumber(pan: string, brand: CardBrand): string {
  const digits = pan.replace(/\D/g, '');
  const groups: string[] = [];
  let idx = 0;
  for (const len of brand.format) {
    if (idx >= digits.length) break;
    groups.push(digits.slice(idx, idx + len));
    idx += len;
  }
  if (idx < digits.length) groups.push(digits.slice(idx));
  return groups.join(' ');
}

export interface CardValidationResult {
  brand: CardBrand | null;
  valid: boolean;
  formatted: string;
  luhnPass: boolean;
  lengthValid: boolean;
}

export function validateCardNumber(pan: string): CardValidationResult {
  const digits = pan.replace(/\D/g, '');
  const brand = identifyBrand(digits);
  const luhnPass = luhnCheck(digits);
  const lengthValid = brand ? brand.lengths.includes(digits.length) : false;
  const valid = !!brand && luhnPass && lengthValid;
  return {
    brand,
    valid,
    formatted: brand ? formatCardNumber(digits, brand) : digits,
    luhnPass,
    lengthValid,
  };
}

export function generateBulkCards(brand: CardBrand, count: number): string[] {
  const cards: string[] = [];
  for (let i = 0; i < count; i++) {
    cards.push(generateCardNumber(brand));
  }
  return cards;
}

// ─── IBAN ────────────────────────────────────────────────────────────────────

export interface IbanCountry {
  code: string;
  name: string;
  length: number;
  example: string;
  format: string;
}

export const IBAN_COUNTRIES: IbanCountry[] = [
  { code: 'AL', name: 'Albania', length: 28, example: 'AL47212110090000000235698741', format: 'ALkk bbbs sssx cccc cccc cccc cccc' },
  { code: 'AD', name: 'Andorra', length: 24, example: 'AD1200012030200359100100', format: 'ADkk bbbb ssss cccc cccc cccc' },
  { code: 'AT', name: 'Austria', length: 20, example: 'AT611904300234573201', format: 'ATkk bbbb bccc cccc cccc' },
  { code: 'AZ', name: 'Azerbaijan', length: 28, example: 'AZ21NABZ00000000137010001944', format: 'AZkk bbbb cccc cccc cccc cccc cccc' },
  { code: 'BH', name: 'Bahrain', length: 22, example: 'BH67BMAG00001299123456', format: 'BHkk bbbb cccc cccc cccc cc' },
  { code: 'BE', name: 'Belgium', length: 16, example: 'BE68539007547034', format: 'BEkk bbbc cccc cc' },
  { code: 'BA', name: 'Bosnia and Herzegovina', length: 20, example: 'BA391290079401028494', format: 'BAkk bbbs sscc cccc cc' },
  { code: 'BR', name: 'Brazil', length: 29, example: 'BR9700360305000010009795493P1', format: 'BRkk bbbb bbbb ssss sccc cccc ccct n' },
  { code: 'BG', name: 'Bulgaria', length: 22, example: 'BG80BNBG96611020345678', format: 'BGkk bbbb ssss ddcc cccc cc' },
  { code: 'CR', name: 'Costa Rica', length: 22, example: 'CR72012300000171549045', format: 'CRkk bbbb cccc cccc cccc cc' },
  { code: 'HR', name: 'Croatia', length: 21, example: 'HR1210010051863000160', format: 'HRkk bbbb bbbc cccc cccc c' },
  { code: 'CY', name: 'Cyprus', length: 28, example: 'CY17002001280000001200527600', format: 'CYkk bbbs ssss cccc cccc cccc cccc' },
  { code: 'CZ', name: 'Czech Republic', length: 24, example: 'CZ6508000000192000145399', format: 'CZkk bbbb ssss sscc cccc cccc' },
  { code: 'DK', name: 'Denmark', length: 18, example: 'DK5000400440116243', format: 'DKkk bbbb cccc cccc cc' },
  { code: 'DO', name: 'Dominican Republic', length: 28, example: 'DO28BAGR00000001212453611324', format: 'DOkk bbbb cccc cccc cccc cccc cccc' },
  { code: 'EE', name: 'Estonia', length: 20, example: 'EE382200221020145685', format: 'EEkk bbss cccc cccc ccc' },
  { code: 'FI', name: 'Finland', length: 18, example: 'FI2112345600000785', format: 'FIkk bbbb bbcc cccc c' },
  { code: 'FR', name: 'France', length: 27, example: 'FR1420041010050500013M02606', format: 'FRkk bbbb bggg ggcc cccc cccc ccc' },
  { code: 'GE', name: 'Georgia', length: 22, example: 'GE29NB0000000101904917', format: 'GEkk bbcc cccc cccc cccc cc' },
  { code: 'DE', name: 'Germany', length: 22, example: 'DE89370400440532013000', format: 'DEkk bbbb bbbb cccc cccc cc' },
  { code: 'GI', name: 'Gibraltar', length: 23, example: 'GI75NWBK000000007099453', format: 'GIkk bbbb cccc cccc cccc ccc' },
  { code: 'GR', name: 'Greece', length: 27, example: 'GR1601101250000000012300695', format: 'GRkk bbbs sssc cccc cccc cccc ccc' },
  { code: 'GT', name: 'Guatemala', length: 28, example: 'GT82TRAJ01020000001210029690', format: 'GTkk bbbb cccc cccc cccc cccc cccc' },
  { code: 'HU', name: 'Hungary', length: 28, example: 'HU42117730161111101800000000', format: 'HUkk bbbs sssc cccc cccc cccc cccc' },
  { code: 'IS', name: 'Iceland', length: 26, example: 'IS140159260076545510730339', format: 'ISkk bbbb sscc cccc cccc cccc cc' },
  { code: 'IE', name: 'Ireland', length: 22, example: 'IE29AIBK93115212345678', format: 'IEkk aaaa bbbb bbcc cccc cc' },
  { code: 'IL', name: 'Israel', length: 23, example: 'IL620108000000099999999', format: 'ILkk bbbn nncc cccc cccc ccc' },
  { code: 'IT', name: 'Italy', length: 27, example: 'IT60X0542811101000000123456', format: 'ITkk xbbb bbbs sssc cccc cccc ccc' },
  { code: 'JO', name: 'Jordan', length: 30, example: 'JO94CBJO0010000000000131000302', format: 'JOkk bbbb cccc cccc cccc cccc cccc cc' },
  { code: 'KZ', name: 'Kazakhstan', length: 20, example: 'KZ86125KZT5004100100', format: 'KZkk bbbc cccc cccc cccc' },
  { code: 'XK', name: 'Kosovo', length: 20, example: 'XK051212012345678906', format: 'XKkk bbbb cccc cccc cccc' },
  { code: 'KW', name: 'Kuwait', length: 30, example: 'KW81CBKU0000000000001234560101', format: 'KWkk bbbb cccc cccc cccc cccc cccc cc' },
  { code: 'LV', name: 'Latvia', length: 21, example: 'LV80BANK0000435195001', format: 'LVkk bbbb cccc cccc cccc c' },
  { code: 'LB', name: 'Lebanon', length: 28, example: 'LB62099900000001001901229114', format: 'LBkk bbbb cccc cccc cccc cccc cccc' },
  { code: 'LI', name: 'Liechtenstein', length: 21, example: 'LI21088100002324013AA', format: 'LIkk bbbb bccc cccc cccc c' },
  { code: 'LT', name: 'Lithuania', length: 20, example: 'LT121000011101001000', format: 'LTkk bbbb bccc cccc cccc' },
  { code: 'LU', name: 'Luxembourg', length: 20, example: 'LU280019400644750000', format: 'LUkk bbbc cccc cccc cccc' },
  { code: 'MT', name: 'Malta', length: 31, example: 'MT84MALT011000012345MTLCAST001S', format: 'MTkk bbbb ssss sccc cccc cccc cccc ccc' },
  { code: 'MR', name: 'Mauritania', length: 27, example: 'MR1300020001010000123456753', format: 'MRkk bbbb bsss sccc cccc cccc ccc' },
  { code: 'MU', name: 'Mauritius', length: 30, example: 'MU17BOMM0101101030300200000MUR', format: 'MUkk bbbb bbss cccc cccc cccc ccc' },
  { code: 'MC', name: 'Monaco', length: 27, example: 'MC5811222000010123456789030', format: 'MCkk bbbb bggg ggcc cccc cccc ccc' },
  { code: 'MD', name: 'Moldova', length: 24, example: 'MD24AG000225100013104168', format: 'MDkk bbcc cccc cccc cccc cccc' },
  { code: 'ME', name: 'Montenegro', length: 22, example: 'ME25505000012345678951', format: 'MEkk bbbc cccc cccc cccc cc' },
  { code: 'NL', name: 'Netherlands', length: 18, example: 'NL91ABNA0417164300', format: 'NLkk bbbb cccc cccc cc' },
  { code: 'MK', name: 'North Macedonia', length: 19, example: 'MK07300000000042425', format: 'MKkk bbbc cccc cccc cc' },
  { code: 'NO', name: 'Norway', length: 15, example: 'NO9386011117947', format: 'NOkk bbbb cccc cc' },
  { code: 'PK', name: 'Pakistan', length: 24, example: 'PK36SCBL0000001123456702', format: 'PKkk bbbb cccc cccc cccc cccc' },
  { code: 'PS', name: 'Palestine', length: 29, example: 'PS92PALS000000000400123456702', format: 'PSkk bbbb cccc cccc cccc cccc cccc c' },
  { code: 'PL', name: 'Poland', length: 28, example: 'PL61109010140000071219812874', format: 'PLkk bbbs sssx cccc cccc cccc cccc' },
  { code: 'PT', name: 'Portugal', length: 25, example: 'PT50000201231234567890154', format: 'PTkk bbbb ssss cccc cccc cccc c' },
  { code: 'QA', name: 'Qatar', length: 29, example: 'QA58DOHB00001234567890ABCDEFG', format: 'QAkk bbbb cccc cccc cccc cccc cccc c' },
  { code: 'RO', name: 'Romania', length: 24, example: 'RO49AAAA1B31007593840000', format: 'ROkk bbbb cccc cccc cccc cccc' },
  { code: 'LC', name: 'Saint Lucia', length: 32, example: 'LC07BANK123456789012345678901234', format: 'LCkk bbbb cccc cccc cccc cccc cccc cccc' },
  { code: 'SM', name: 'San Marino', length: 27, example: 'SM86U0322509800000000270100', format: 'SMkk xbbb bbbs sssc cccc cccc ccc' },
  { code: 'ST', name: 'Sao Tome and Principe', length: 25, example: 'ST68000100010051845310112', format: 'STkk bbbb cccc cccc cccc cccc c' },
  { code: 'SA', name: 'Saudi Arabia', length: 24, example: 'SA0380000000608010167519', format: 'SAkk bbcc cccc cccc cccc cccc' },
  { code: 'RS', name: 'Serbia', length: 22, example: 'RS35260005601001611379', format: 'RSkk bbbc cccc cccc cccc cc' },
  { code: 'SC', name: 'Seychelles', length: 31, example: 'SC18SSCB11010000000000001497USD', format: 'SCkk bbbb bbss cccc cccc cccc ccc' },
  { code: 'SK', name: 'Slovakia', length: 24, example: 'SK3112000000198742637541', format: 'SKkk bbbb ssss sscc cccc cccc' },
  { code: 'SI', name: 'Slovenia', length: 19, example: 'SI56191000000123438', format: 'SIkk bbss sccc cccc ccc' },
  { code: 'ES', name: 'Spain', length: 24, example: 'ES9121000418450200051332', format: 'ESkk bbbb gggg xxcc cccc cccc' },
  { code: 'SE', name: 'Sweden', length: 24, example: 'SE4550000000058398257466', format: 'SEkk bbbc cccc cccc cccc cccc' },
  { code: 'CH', name: 'Switzerland', length: 21, example: 'CH9300762011623852957', format: 'CHkk bbbb bccc cccc cccc c' },
  { code: 'TL', name: 'Timor-Leste', length: 23, example: 'TL380080012345678910157', format: 'TLkk bbbc cccc cccc cccc ccc' },
  { code: 'TN', name: 'Tunisia', length: 24, example: 'TN5910006035183598478831', format: 'TNkk bbss sccc cccc cccc cccc' },
  { code: 'TR', name: 'Turkey', length: 26, example: 'TR330006100519786457841326', format: 'TRkk bbbb bxcc cccc cccc cccc cc' },
  { code: 'UA', name: 'Ukraine', length: 29, example: 'UA213223130000026007233566001', format: 'UAkk bbbb bbbb cccc cccc cccc cccc c' },
  { code: 'AE', name: 'United Arab Emirates', length: 23, example: 'AE260211000000230064016', format: 'AEkk bbbc cccc cccc cccc ccc' },
  { code: 'GB', name: 'United Kingdom', length: 22, example: 'GB29NWBK60161331926819', format: 'GBkk bbbb ssss sscc cccc cc' },
  { code: 'VA', name: 'Vatican City', length: 22, example: 'VA59001123000012345678', format: 'VAkk bbbb cccc cccc cccc cc' },
  { code: 'VG', name: 'Virgin Islands (British)', length: 24, example: 'VG96VPVG0000012345678901', format: 'VGkk bbbb cccc cccc cccc cccc' },
];

export function parseIban(iban: string): string {
  return iban.replace(/\s+/g, '').toUpperCase();
}

export function getIbanCountry(iban: string): IbanCountry | null {
  const cleaned = parseIban(iban);
  const code = cleaned.slice(0, 2);
  return IBAN_COUNTRIES.find((c) => c.code === code) ?? null;
}

function ibanMod97(iban: string): number {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let digits = '';
  for (const ch of rearranged) {
    const code = ch.charCodeAt(0);
    if (code >= 65 && code <= 90) digits += code - 55;
    else digits += ch;
  }
  let remainder = 0;
  for (let i = 0; i < digits.length; i++) {
    remainder = (remainder * 10 + parseInt(digits[i], 10)) % 97;
  }
  return remainder;
}

export interface IbanValidationResult {
  country: IbanCountry | null;
  valid: boolean;
  formatted: string;
  checksumPass: boolean;
  lengthValid: boolean;
  errors: string[];
}

export function validateIban(iban: string): IbanValidationResult {
  const errors: string[] = [];
  const cleaned = parseIban(iban);

  if (cleaned.length < 4) {
    errors.push('IBAN is too short (minimum 4 characters)');
    return { country: null, valid: false, formatted: cleaned, checksumPass: false, lengthValid: false, errors };
  }

  const country = getIbanCountry(cleaned);
  const countryCode = cleaned.slice(0, 2);
  const checkDigits = cleaned.slice(2, 4);

  if (!/^[A-Z]{2}$/.test(countryCode)) {
    errors.push('First two characters must be letters (country code)');
  }

  if (!/^\d{2}$/.test(checkDigits)) {
    errors.push('Characters 3-4 must be digits (check digits)');
  }

  if (!/^[A-Z0-9]+$/.test(cleaned)) {
    errors.push('IBAN must contain only letters and digits');
  }

  const lengthValid = country ? cleaned.length === country.length : false;
  if (country && !lengthValid) {
    errors.push(`Expected ${country.length} characters for ${country.name}, got ${cleaned.length}`);
  }

  let checksumPass = false;
  if (/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(cleaned)) {
    checksumPass = ibanMod97(cleaned) === 1;
    if (!checksumPass) errors.push('Checksum validation failed (mod 97 check)');
  } else {
    errors.push('Invalid IBAN structure');
  }

  const valid = errors.length === 0;

  const formatted = country
    ? cleaned.match(/.{1,4}/g)?.join(' ') ?? cleaned
    : cleaned;

  return { country, valid, formatted, checksumPass, lengthValid, errors };
}
