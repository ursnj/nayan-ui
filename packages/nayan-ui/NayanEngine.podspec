require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))
properties_path = Pod::Config.instance.installation_root.join("Podfile.properties.json")
properties = properties_path.file? ? JSON.parse(properties_path.read) : {}
features = properties["nayanEngine.features"]
if features && (!features.is_a?(String) || !features.match?(/\A(?:[a-z-]+(?:,[a-z-]+)*)?\z/))
  raise "Nayan Engine: nayanEngine.features must be a comma-separated feature list"
end
image_picker = features ? features.split(",").include?("image-picker") : ENV.fetch("NAYAN_ENGINE_IMAGE_PICKER", properties.fetch("nayanEngine.imagePicker", "false")) == "true"
location = features.nil? || features.split(",").include?("location")
contacts = features.nil? || features.split(",").include?("contacts")
permissions = location || contacts || features.split(",").include?("permissions")
video = features.nil? || features.split(",").include?("video")
review = features.nil? || features.split(",").include?("review")

Pod::Spec.new do |s|
  s.name         = "NayanEngine"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/ursnj/nayan-ui.git", :tag => "engine-v#{s.version}" }

  s.source_files = "shared/cpp/**/*.{h,cpp}", "shared/ios/**/*.{h,m,mm}",
                   "native/*/cpp/**/*.{h,cpp}", "native/*/ios/**/*.{h,m,mm}"
  excluded = []
  excluded << "native/image-picker/ios/ImagePicker.{h,mm}" unless image_picker
  excluded << "native/permissions/ios/Permissions.{h,mm}" unless permissions
  excluded << "native/location/ios/Location.{h,mm}" unless location
  excluded << "native/contacts/ios/Contacts.{h,mm}" unless contacts
  excluded << "native/video/ios/NayanEngineVideo.mm" unless video
  excluded << "native/review/ios/StoreReview.{h,mm}" unless review
  s.exclude_files = excluded
  if features
    rust_dir = "$(PODS_CONFIGURATION_BUILD_DIR)/NayanEngine/rust"
    s.libraries = "nayan_engine_profile"
    s.user_target_xcconfig = { "LIBRARY_SEARCH_PATHS" => "$(inherited) \"#{rust_dir}\"" }
    s.script_phase = {
      :name => "Build selected Nayan Engine Rust features",
      :execution_position => :before_compile,
      :script => %q{NAYAN_ENGINE_FEATURES="$NAYAN_ENGINE_PROFILE" bash "$PODS_TARGET_SRCROOT/native/core/scripts/profile-ios.sh"},
      :input_files => [properties_path.to_s] + Dir.glob([
        File.join(__dir__, "native/core/{src/**/*,scripts/*.sh,Cargo.toml,Cargo.lock}"),
        File.join(__dir__, "native/*/rust/**/*")
      ]).select { |path| File.file?(path) },
      :output_files => ["#{rust_dir}/libnayan_engine_profile.a"]
    }
  else
    s.vendored_frameworks = "native/core/build/EngineCore.xcframework"
  end
  s.resource_bundles = { "NayanEnginePrivacy" => ["shared/ios/PrivacyInfo.xcprivacy"] }
  # The Rust core's audio (cpal / CoreAudio), haptics (Core Haptics) and renderer (wgpu on Metal) need
  # these system frameworks.
  s.frameworks = %w(AVFoundation ImageIO AudioToolbox AVFAudio CoreAudio CoreHaptics CoreFoundation CoreText Foundation Metal Network QuartzCore UIKit UniformTypeIdentifiers) +
    (video ? ["AVKit"] : []) +
    (review ? ["StoreKit"] : []) +
    (permissions ? %w(AppTrackingTransparency Contacts CoreBluetooth CoreLocation CoreMotion EventKit HomeKit Intents MediaPlayer Speech UserNotifications) : []) +
    ((image_picker || permissions) ? ["Photos"] : []) + (image_picker ? %w(CoreImage PhotosUI) : [])

  target_settings = {
    "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/native/core/include\" \"$(PODS_TARGET_SRCROOT)/shared/cpp\" \"$(PODS_TARGET_SRCROOT)/native\"",
    "GCC_PREPROCESSOR_DEFINITIONS" => "$(inherited) NAYAN_ENGINE_IMAGE_PICKER=#{image_picker ? 1 : 0} NAYAN_ENGINE_PERMISSIONS=#{permissions ? 1 : 0} NAYAN_ENGINE_LOCATION=#{location ? 1 : 0} NAYAN_ENGINE_REVIEW=#{review ? 1 : 0} NAYAN_ENGINE_CONTACTS=#{contacts ? 1 : 0}",
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++20"
  }

  if features
    target_settings.merge!({
      "NAYAN_ENGINE_PROFILE" => features,
      "LIBRARY_SEARCH_PATHS" => "$(inherited) \"#{rust_dir}\"",
      "ENABLE_USER_SCRIPT_SANDBOXING" => "NO"
    })
  end

  s.pod_target_xcconfig = target_settings
  install_modules_dependencies(s)
end
