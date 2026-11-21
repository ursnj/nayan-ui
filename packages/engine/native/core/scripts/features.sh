# Sourced by platform builders. An explicit list selects the optional Rust features.
ENGINE_FEATURE_ARGS=()
if [[ ${NAYAN_ENGINE_FEATURES+x} ]]; then
  ENGINE_FEATURE_ARGS=(--no-default-features)
  if [[ -n "$NAYAN_ENGINE_FEATURES" ]]; then
    ENGINE_FEATURE_ARGS+=(--features "$NAYAN_ENGINE_FEATURES")
  fi
elif [[ "${NAYAN_ENGINE_COMPONENTS:-1}" == 0 ]]; then
  ENGINE_FEATURE_ARGS=(--no-default-features --features games,drawing,storage,uuid,image-picker,audio,microphone,haptics,tts,keep-awake,review,permissions,location)
fi
