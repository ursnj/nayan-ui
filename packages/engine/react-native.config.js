// Autolinking. iOS uses NayanEngine.podspec; Android builds android/CMakeLists.txt into the app as a
// pure C++ TurboModule (the generated autolinking code instantiates NayanEngineModule).
module.exports = {
  dependency: {
    platforms: {
      android: {
        // The EngineSurface view (android/src/main/java).
        packageImportPath: "import com.nayanui.engine.NayanEnginePackage;",
        packageInstance: "new NayanEnginePackage()",
        cmakeListsPath: "codegen/CMakeLists.txt",
        cxxModuleCMakeListsModuleName: "NayanEngine",
        cxxModuleCMakeListsPath: "CMakeLists.txt",
        cxxModuleHeaderName: "NayanEngineModule",
      },
    },
  },
};
