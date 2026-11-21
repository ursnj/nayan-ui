// Autolinking. iOS uses NayanEngine.podspec; Android builds shared/android/CMakeLists.txt into the app as a
// pure C++ TurboModule (the generated autolinking code instantiates NayanEngineModule).
module.exports = {
  dependency: {
    platforms: {
      android: {
        sourceDir: 'shared/android',
        // Registers the shared surface and feature view managers.
        packageImportPath: 'import com.nayanui.engine.NayanEnginePackage;',
        packageInstance: 'new NayanEnginePackage()',
        cmakeListsPath: 'codegen/CMakeLists.txt',
        cxxModuleCMakeListsModuleName: 'NayanEngine',
        cxxModuleCMakeListsPath: 'CMakeLists.txt',
        cxxModuleHeaderName: 'NayanEngineModule'
      }
    }
  }
};
