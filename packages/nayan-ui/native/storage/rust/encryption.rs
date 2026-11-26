use super::{Result, valid_name, valid_value};
use aes_gcm::{Aes128Gcm, Aes256Gcm, KeyInit, Nonce, Tag, aead::AeadInPlace};
use hkdf::Hkdf;
use hmac::{Hmac, Mac};
use sha2::Sha256;
use zeroize::Zeroizing;

type HmacSha256 = Hmac<Sha256>;
const NONCE_SIZE: usize = 12;
const TAG_SIZE: usize = 16;
const SALT_SIZE: usize = 16;
const METADATA_SIZE: usize = 1 + SALT_SIZE + 32;
const CORRUPT: &str = "encrypted storage record failed authentication";

#[derive(Clone, Copy, PartialEq)]
pub(super) enum Algorithm {
    Aes128 = 1,
    Aes256 = 2,
}

impl Algorithm {
    pub fn parse(name: &str) -> Result<Self> {
        match name {
            "AES-128" => Ok(Self::Aes128),
            "AES-256" => Ok(Self::Aes256),
            _ => Err("storage encryption type must be AES-128 or AES-256".into()),
        }
    }

    fn size(self) -> usize {
        match self {
            Self::Aes128 => 16,
            Self::Aes256 => 32,
        }
    }
}

pub(super) struct Metadata([u8; METADATA_SIZE]);

impl Metadata {
    pub fn parse(bytes: &[u8]) -> Option<Self> {
        let recorded: [u8; METADATA_SIZE] = bytes.try_into().ok()?;
        matches!(recorded[0], 1 | 2).then_some(Self(recorded))
    }

    pub fn bytes(&self) -> &[u8] {
        &self.0
    }

    pub fn algorithm(&self) -> Algorithm {
        if self.0[0] == 1 { Algorithm::Aes128 } else { Algorithm::Aes256 }
    }

    pub fn unlock(&self, id: &str, key: &str) -> Result<Protection> {
        let protection = Protection::derive(id, key, self.algorithm(), &self.0[1..1 + SALT_SIZE])?;
        protection
            .mac(b"verify")
            .verify_slice(&self.0[1 + SALT_SIZE..])
            .map_err(|_| "incorrect storage encryption key")?;
        Ok(protection)
    }
}

enum Cipher {
    Aes128(Box<Aes128Gcm>),
    Aes256(Box<Aes256Gcm>),
}

pub(super) struct Protection {
    cipher: Cipher,
    index_key: Zeroizing<[u8; 32]>,
}

impl Protection {
    fn derive(id: &str, key: &str, algorithm: Algorithm, salt: &[u8]) -> Result<Self> {
        if !(algorithm.size()..=1024).contains(&key.len()) {
            return Err(format!("storage encryption key must be {} to 1024 UTF-8 bytes", algorithm.size()));
        }
        let hkdf = Hkdf::<Sha256>::new(Some(salt), key.as_bytes());
        let mut key_material = Zeroizing::new([0; 64]);
        hkdf.expand_multi_info(&[b"nayan-ui storage v1\0", &[algorithm as u8], id.as_bytes()], &mut key_material[..])
            .expect("fixed HKDF output length");
        let key_bytes = &key_material[..algorithm.size()];
        let cipher = match algorithm {
            Algorithm::Aes128 => Cipher::Aes128(Box::new(Aes128Gcm::new_from_slice(key_bytes).expect("AES-128 key size"))),
            Algorithm::Aes256 => Cipher::Aes256(Box::new(Aes256Gcm::new_from_slice(key_bytes).expect("AES-256 key size"))),
        };
        let index_key = Zeroizing::new(key_material[32..].try_into().expect("fixed HMAC key size"));
        Ok(Self { cipher, index_key })
    }

    pub fn create(id: &str, key: &str, algorithm: Algorithm) -> Result<(Metadata, Self)> {
        let mut metadata = [0; METADATA_SIZE];
        metadata[0] = algorithm as u8;
        let salt = &mut metadata[1..1 + SALT_SIZE];
        getrandom::fill(salt).map_err(|_| "could not generate a storage encryption salt")?;
        let protection = Self::derive(id, key, algorithm, salt)?;
        metadata[1 + SALT_SIZE..].copy_from_slice(&protection.mac(b"verify").finalize().into_bytes());
        Ok((Metadata(metadata), protection))
    }

    fn mac(&self, label: &[u8]) -> HmacSha256 {
        let mut mac = <HmacSha256 as Mac>::new_from_slice(&self.index_key[..]).expect("fixed HMAC key size");
        mac.update(label);
        mac
    }

    pub fn index(&self, key: &str) -> String {
        let mut mac = self.mac(b"index\0");
        mac.update(key.as_bytes());
        let mut encoded = String::with_capacity(64);
        const HEX: &[u8] = b"0123456789abcdef";
        for byte in mac.finalize().into_bytes() {
            encoded.push(char::from(HEX[(byte >> 4) as usize]));
            encoded.push(char::from(HEX[(byte & 15) as usize]));
        }
        encoded
    }

    pub fn seal(&self, key: &str, value: &[u8]) -> Result<(String, Vec<u8>)> {
        let index = self.index(key);
        let mut bytes = Vec::with_capacity(NONCE_SIZE + 4 + key.len() + value.len() + TAG_SIZE);
        bytes.resize(NONCE_SIZE, 0);
        getrandom::fill(&mut bytes).map_err(|_| "could not generate a storage encryption nonce")?;
        bytes.extend_from_slice(&(key.len() as u32).to_le_bytes());
        bytes.extend_from_slice(key.as_bytes());
        bytes.extend_from_slice(value);
        let (nonce, body) = bytes.split_at_mut(NONCE_SIZE);
        let nonce = Nonce::from_slice(nonce);
        let aad = index.as_bytes();
        let tag = match &self.cipher {
            Cipher::Aes128(cipher) => cipher.encrypt_in_place_detached(nonce, aad, body),
            Cipher::Aes256(cipher) => cipher.encrypt_in_place_detached(nonce, aad, body),
        }
        .map_err(|_| "could not encrypt storage record")?;
        bytes.extend_from_slice(&tag);
        Ok((index, bytes))
    }

    pub fn unseal<T>(&self, index: &str, bytes: &[u8], read: impl FnOnce(&str, &[u8]) -> T) -> Result<T> {
        if !valid_record(index, bytes) {
            return Err(CORRUPT.into());
        }
        let (nonce, rest) = bytes.split_at(NONCE_SIZE);
        let (body, tag) = rest.split_at(rest.len() - TAG_SIZE);
        let mut body = Zeroizing::new(body.to_vec());
        let nonce = Nonce::from_slice(nonce);
        let tag = Tag::from_slice(tag);
        let aad = index.as_bytes();
        match &self.cipher {
            Cipher::Aes128(cipher) => cipher.decrypt_in_place_detached(nonce, aad, &mut body, tag),
            Cipher::Aes256(cipher) => cipher.decrypt_in_place_detached(nonce, aad, &mut body, tag),
        }
        .map_err(|_| CORRUPT)?;
        let key_len = u32::from_le_bytes(body[..4].try_into().expect("validated record size")) as usize;
        if !(1..=super::MAX_NAME).contains(&key_len) {
            return Err(CORRUPT.into());
        }
        let key_end = 4 + key_len;
        let key = body
            .get(4..key_end)
            .and_then(|key| std::str::from_utf8(key).ok())
            .filter(|key| valid_name(key))
            .ok_or(CORRUPT)?;
        let value = &body[key_end..];
        if !valid_value(value) {
            return Err(CORRUPT.into());
        }
        Ok(read(key, value))
    }
}

pub(super) fn valid_index(index: &str) -> bool {
    index.len() == 64 && index.bytes().all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
}

pub(super) fn valid_record(index: &str, bytes: &[u8]) -> bool {
    let overhead = NONCE_SIZE + 4 + TAG_SIZE;
    valid_index(index) && (overhead + 2..=overhead + super::MAX_NAME + super::MAX_VALUE).contains(&bytes.len())
}
