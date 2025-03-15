import BN from "bn.js";

export class PKCCryptoHelper {
 /**
   * Generates a new public/private key pair for digital signatures using ECDSA (P-256 curve)
   * @returns Promise<KeyPair> containing public and private keys in JWK format
   */
 static async generateKeyPair() {
  try {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      true, // extractable
      ["sign", "verify"]
    );

    // Export the keys in JWK format
    const publicKey = await window.crypto.subtle.exportKey(
      "jwk",
      keyPair.publicKey
    );
    const privateKey = await window.crypto.subtle.exportKey(
      "jwk",
      keyPair.privateKey
    );

    return {
      publicKey: JSON.stringify(publicKey),
      privateKey: JSON.stringify(privateKey)
    };
  } catch (error) {

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Error generating keys: ${errorMessage}`);
  }
}

/**
 * Signs a message using a private key (ECDSA)
 * @param message - The message to sign
 * @param privateKeyStr - The private key in JWK format (as string)
 * @returns Promise<SignatureResult> containing the signature and associated public key details
 */
static async signMessage(message: string, privateKeyStr: string) {
  try {
    const privateKeyData = JSON.parse(privateKeyStr);

    // Import the private key
    const privateKey = await window.crypto.subtle.importKey(
      "jwk",
      privateKeyData,
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      false,
      ["sign"]
    );

    // Convert message to ArrayBuffer
    const encoder = new TextEncoder();
    const messageBuffer = encoder.encode(message);

    // Sign the message using ECDSA with SHA-256
    const signature = await window.crypto.subtle.sign(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" }
      },
      privateKey,
      messageBuffer
    );

    // Convert signature to base64
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

    return {
      signature: signatureBase64,
      publicKey: JSON.stringify({
        kty: privateKeyData.kty,
        crv: privateKeyData.crv, // curve info is included for ECDSA keys
        x: privateKeyData.x,
        y: privateKeyData.y,
      })
    };
  } catch (error) {

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Error signing message: ${errorMessage}`);
  }
}

/**
 * Verifies a signature using the public key (ECDSA)
 * @param message - The original message
 * @param signature - The signature to verify (base64 encoded)
 * @param publicKeyStr - The public key in JWK format (as string)
 * @returns Promise<boolean> indicating if the signature is valid
 */
static async verifySignature(
  message: string,
  signature: string,
  publicKeyStr: string
) {
  try {
    const publicKeyData = JSON.parse(publicKeyStr);

    // Import the public key
    const publicKey = await window.crypto.subtle.importKey(
      "jwk",
      publicKeyData,
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      false,
      ["verify"]
    );

    // Convert base64 signature to ArrayBuffer
    const signatureArray = Uint8Array.from(atob(signature), c => c.charCodeAt(0));

    // Convert message to ArrayBuffer
    const encoder = new TextEncoder();
    const messageBuffer = encoder.encode(message);

    // Verify the signature using ECDSA with SHA-256
    return await window.crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" }
      },
      publicKey,
      signatureArray,
      messageBuffer
    );
  } catch (error) {
    // Log detailed error information
    console.error(
      "Error verifying signature with details:",
      { message, signature, publicKeyStr, error }
    );
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Error verifying signature: ${errorMessage}`);
  }
}

/**
 * Creates a hash of a message using SHA-256
 * @param message - The message to hash
 * @returns Promise<string> - The hash in hexadecimal format
 */
static async createHash(message: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Function to convert JWK (Used in PKC) to Elliptic.js (Used in RingSignature) format
static convertJwkToElliptic = (jwk: any) => {
  if (jwk.kty !== "EC" || jwk.crv !== "P-256") {
    throw new Error("Invalid JWK format. Expected P-256 curve.");
  }
  const publicKey = {  x: base64UrlToHex(jwk.x),   // Convert x to Hex
    y: base64UrlToHex(jwk.y), curve: "p256" };
  // Convert the 'd' field from base64url string to BN if present
  const privateKey = jwk.d
    ? { d: new BN(base64UrlToHex(jwk.d), 16), publicKey }
    : { publicKey };

    if (jwk.d) {
      console.log("Is private key BN?", BN.isBN(privateKey.d));
    }
  return privateKey;
};
 }

 function base64UrlToHex(base64Url: string): string {
  // Replace URL-safe characters
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  // Pad with '='
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binaryString = atob(base64);
  let hex = '';
  for (let i = 0; i < binaryString.length; i++) {
    hex += binaryString.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return hex;
}