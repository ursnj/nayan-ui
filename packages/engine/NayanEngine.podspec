require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "NayanEngine"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/ursnj/nayan-ui.git", :tag => "engine-v#{s.version}" }

  s.source_files = "cpp/**/*.{h,cpp}", "ios/**/*.{h,m,mm}"
  s.vendored_frameworks = "core/build/EngineCore.xcframework"

  s.pod_target_xcconfig = {
    "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/core/include\" \"$(PODS_TARGET_SRCROOT)/cpp\"",
    "CLANG_CXX_LANGUAGE_STANDARD" => "c++20"
  }

  install_modules_dependencies(s)
end
