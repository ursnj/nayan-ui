// Compatibility entry. Prefer feature subpaths to import only the API you need.
export * from './games/index';
export * from './drawing';
export { animations } from './animations/index';
export { files } from './files/index';
export type { FileDirectory, FileInfo, TemporaryFileOptions } from './files/index';
export { device } from './device/index';
export type { DeviceEnvironment } from './device/index';
export { assets } from './assets/index';
export type { AssetSource, AssetInfo, LoadedAsset, AssetLoadOptions } from './assets/index';
export { audio, SoundBank } from './audio/index';
export { clipboard } from './clipboard/index';
export type { AudioPlayOptions, AudioShiftOptions, Sound, SoundSource, Voice } from './audio/index';
export { haptics } from './haptics/index';
export type { HapticTap } from './haptics/index';
export { permissions, permissionNames } from './permissions/index';
export type { AndroidPermission, Permission, PermissionResult, PermissionStatus } from './permissions/index';
export { location, LocationError } from './location/index';
export type { LocationErrorCode, LocationOptions, LocationPosition, LocationWatchOptions } from './location/index';
export { camera } from './camera/index';
export type { CameraPhoto, CameraPhotoOptions } from './camera/index';
export { documentPicker } from './document-picker/index';
export type {
  DocumentPickerAsset,
  DocumentPickerCanceledResult,
  DocumentPickerOptions,
  DocumentPickerResult,
  DocumentPickerSuccessResult
} from './document-picker/index';
export { VideoPlayer } from './video/index';
export type { VideoContentFit, VideoPlayerHandle, VideoPlayerProps, VideoProgress, VideoSource, VideoStatus } from './video/index';
export { sqlite } from './sqlite/index';
export type { SQLiteDatabase, SQLiteQueryResult, SQLiteRunResult, SQLiteStatement, SQLiteValue } from './sqlite/index';
export { microphone } from './microphone/index';
export type { MicrophoneOptions, MicrophonePermission, MicrophoneState, Recording, TakeOptions } from './microphone/index';
export { createStorage, createStoragePersister } from './storage/index';
export type {
  Storage,
  StoragePersister,
  StoragePersisterOptions,
  StorageConfiguration,
  StorageEncryptionType,
  StorageValue,
  StoragePrimitive,
  StorageJSON,
  StorageSetter
} from './storage/index';
export { useStorage, useStorageJSON } from './storage/index';
export { speech } from './tts/index';
export type { SpeechOptions, SpeechVoice } from './tts/index';
export { uuid, prepareUuid } from './uuid/index';
export { network, useOnline, checkReachability } from './network/index';
export type { NetworkListener, NetworkWaitOptions, OnlineState, ReachabilityOptions } from './network/index';
export { sharing } from './sharing/index';
export type { SharingOptions } from './sharing/index';
export { capture } from './capture/index';
export type { CapturedImage } from './capture/index';
export { keepAwake, useKeepAwake } from './keep-awake/index';
export { review } from './review/index';
export { auth } from './auth/index';
export { contacts } from './contacts/index';
export type { Contact, ContactEmail, ContactFields, ContactPage, ContactPatch, ContactPhone, ContactQuery, ContactsAccess } from './contacts/index';
export type { SignInCallback, SignInCallbackResult, SignInOptions, SignInProvider, SignInRequest, SignInTransaction } from './auth/index';
export { imagePicker } from './image-picker/index';
export type { ImagePickerOptions, ImagePickerResult, PickedImage, CameraPermission } from './image-picker/index';
