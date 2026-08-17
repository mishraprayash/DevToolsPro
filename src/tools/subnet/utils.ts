export interface SubnetInfo {
  ipAddress: string;
  cidr: number;
  subnetMask: string;
  networkAddress: string;
  broadcastAddress: string;
  firstUsable: string;
  lastUsable: string;
  totalHosts: number;
  usableHosts: number;
  ipBinary: string;
  maskBinary: string;
  ipClass: string;
  isPrivate: boolean;
}

export type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

function ipToLong(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function longToIp(long: number): string {
  return [
    (long >>> 24) & 255,
    (long >>> 16) & 255,
    (long >>> 8) & 255,
    long & 255
  ].join('.');
}

function toBinaryString(long: number): string {
  const binary = (long >>> 0).toString(2).padStart(32, '0');
  return [
    binary.slice(0, 8),
    binary.slice(8, 16),
    binary.slice(16, 24),
    binary.slice(24, 32)
  ].join('.');
}

export function calculateSubnet(ipStr: string, cidrInput: number): Result<SubnetInfo> {
  try {
    const cleanIp = ipStr.trim();
    const ipPattern = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipPattern.test(cleanIp)) {
      return { success: false, error: 'Invalid IPv4 address format.' };
    }

    if (cidrInput < 0 || cidrInput > 32) {
      return { success: false, error: 'CIDR must be an integer between 0 and 32.' };
    }

    const ipLong = ipToLong(cleanIp);
    
    // Mask logic
    const maskLong = cidrInput === 0 ? 0 : (~0 << (32 - cidrInput)) >>> 0;
    const subnetMask = longToIp(maskLong);

    const networkLong = (ipLong & maskLong) >>> 0;
    const networkAddress = longToIp(networkLong);

    const wildCardLong = (~maskLong) >>> 0;
    const broadcastLong = (networkLong | wildCardLong) >>> 0;
    const broadcastAddress = longToIp(broadcastLong);

    let firstUsable = 'N/A';
    let lastUsable = 'N/A';
    let usableHosts = 0;

    if (cidrInput < 31) {
      firstUsable = longToIp(networkLong + 1);
      lastUsable = longToIp(broadcastLong - 1);
      usableHosts = (broadcastLong - networkLong) - 1;
    } else if (cidrInput === 31) {
      // RFC 3021 Point-to-Point
      firstUsable = longToIp(networkLong);
      lastUsable = longToIp(broadcastLong);
      usableHosts = 2;
    } else if (cidrInput === 32) {
      firstUsable = cleanIp;
      lastUsable = cleanIp;
      usableHosts = 1;
    }

    const totalHosts = Math.pow(2, 32 - cidrInput);

    // IP Class detection
    const firstOctet = parseInt(cleanIp.split('.')[0], 10);
    let ipClass = 'Unknown';
    if (firstOctet >= 1 && firstOctet <= 126) ipClass = 'A';
    else if (firstOctet === 127) ipClass = 'Loopback';
    else if (firstOctet >= 128 && firstOctet <= 191) ipClass = 'B';
    else if (firstOctet >= 192 && firstOctet <= 223) ipClass = 'C';
    else if (firstOctet >= 224 && firstOctet <= 239) ipClass = 'D (Multicast)';
    else if (firstOctet >= 240 && firstOctet <= 255) ipClass = 'E (Experimental)';

    // Private address space detection
    let isPrivate = false;
    if (firstOctet === 10) {
      isPrivate = true;
    } else if (firstOctet === 172) {
      const secondOctet = parseInt(cleanIp.split('.')[1], 10);
      if (secondOctet >= 16 && secondOctet <= 31) isPrivate = true;
    } else if (firstOctet === 192) {
      const secondOctet = parseInt(cleanIp.split('.')[1], 10);
      if (secondOctet === 168) isPrivate = true;
    }

    return {
      success: true,
      data: {
        ipAddress: cleanIp,
        cidr: cidrInput,
        subnetMask,
        networkAddress,
        broadcastAddress,
        firstUsable,
        lastUsable,
        totalHosts,
        usableHosts,
        ipBinary: toBinaryString(ipLong),
        maskBinary: toBinaryString(maskLong),
        ipClass,
        isPrivate
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown subnet calculation error'
    };
  }
}

export interface ChildSubnet {
  cidr: number;
  networkAddress: string;
  broadcastAddress: string;
  firstUsable: string;
  lastUsable: string;
  usableHosts: number;
}

export function calculateSubnetSplits(
  baseIp: string,
  baseCidr: number,
  targetCidr: number
): Result<ChildSubnet[]> {
  if (targetCidr <= baseCidr || targetCidr > 32) {
    return { success: false, error: 'Target CIDR must be greater than base CIDR and <= 32.' };
  }

  const baseResult = calculateSubnet(baseIp, baseCidr);
  if (!baseResult.success) return { success: false, error: baseResult.error };

  const startLong = ipToLong(baseResult.data.networkAddress);
  const endLong = ipToLong(baseResult.data.broadcastAddress);

  const stepSize = Math.pow(2, 32 - targetCidr);
  const children: ChildSubnet[] = [];

  let current = startLong;
  while (current <= endLong) {
    const netAddr = longToIp(current);
    const subRes = calculateSubnet(netAddr, targetCidr);
    if (subRes.success) {
      children.push({
        cidr: targetCidr,
        networkAddress: subRes.data.networkAddress,
        broadcastAddress: subRes.data.broadcastAddress,
        firstUsable: subRes.data.firstUsable,
        lastUsable: subRes.data.lastUsable,
        usableHosts: subRes.data.usableHosts,
      });
    }
    current += stepSize;
  }

  return { success: true, data: children };
}
