// Autolinking. iOS uses NayanEngine.podspec; Android builds android/CMakeLists.txt into the app as a
// pure C++ TurboModule (the generated autolinking code instantiates NayanEngineModule).
module.exports = {
  dependency: {
    platforms: {
      android: {
        cxxModuleCMakeListsModuleName: "NayanEngine",
        cxxModuleCMakeListsPath: "CMakeLists.txt",
        cxxModuleHeaderName: "NayanEngineModule",
      },
    },
  },
};
