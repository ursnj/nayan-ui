#pragma once

#include <NayanEngineSpecJSI.h>
#include "network/cpp/NetworkMonitor.h"

#include <atomic>
#include <memory>
#include <unordered_map>
#include <unordered_set>

struct World;

namespace facebook::react {

class NayanEngineModule : public NativeNayanEngineCxxSpec<NayanEngineModule> {
 public:
  explicit NayanEngineModule(std::shared_ptr<CallInvoker> jsInvoker);
  ~NayanEngineModule();

  jsi::Value appRequest(jsi::Runtime &rt, jsi::String command);
  jsi::Value sqliteRequest(jsi::Runtime &rt, jsi::String command);
  bool hasImagePicker(jsi::Runtime &rt);
  jsi::String uuid(jsi::Runtime &rt);
  jsi::String authRequest(jsi::Runtime &rt, jsi::String command);
  jsi::String deviceEnvironment(jsi::Runtime &rt);
  jsi::String safeAreaRequest(jsi::Runtime &rt, jsi::String command);
  jsi::Value fileRequest(jsi::Runtime &rt, jsi::String action, jsi::String value, jsi::String fileName);
  jsi::Value assetRead(jsi::Runtime &rt, jsi::String uri);
  jsi::Value iconRequest(jsi::Runtime &rt, jsi::Object data, jsi::String command);
  void networkStart(jsi::Runtime &rt, jsi::Function changed);
  void networkStop(jsi::Runtime &rt);
  jsi::Value clipboardRequest(jsi::Runtime &rt, jsi::String action, jsi::String text);
  jsi::Value sharingRequest(jsi::Runtime &rt, jsi::String options);
  jsi::Value captureRequest(jsi::Runtime &rt, jsi::String action, jsi::String uri);
  void systemBarsSet(jsi::Runtime &rt, jsi::String id, jsi::String configuration);
  void systemThemeSet(jsi::Runtime &rt, jsi::String id, jsi::String configuration);
  void systemBarsRemove(jsi::Runtime &rt, jsi::String id);
  jsi::String storageRequest(jsi::Runtime &rt, jsi::String command);
  jsi::Object storageRead(jsi::Runtime &rt, double handle, jsi::String key);
  void storageWrite(jsi::Runtime &rt, double handle, jsi::String key, jsi::Object value);

  jsi::Value speechRequest(jsi::Runtime &rt, jsi::String command);

  double createWorld(jsi::Runtime &rt, double capacity);
  void destroyWorld(jsi::Runtime &rt, double world);
  double spawnDesc(jsi::Runtime &rt, double world, jsi::Object desc);
  bool setDesc(jsi::Runtime &rt, double world, double entity, jsi::Object desc);
  double setTransforms(jsi::Runtime &rt, double world, jsi::Object data, double count);
  bool despawn(jsi::Runtime &rt, double world, double entity);
  void impulse(jsi::Runtime &rt, double world, double entity, double x, double y, double z);
  void setGravity(jsi::Runtime &rt, double world, double x, double y, double z);
  void setBounds(jsi::Runtime &rt, double world, double minX, double minZ, double maxX, double maxZ);
  void setListener(jsi::Runtime &rt, double world, double entity);
  double raycast(jsi::Runtime &rt, double world, double ox, double oy, double oz, double dx, double dy, double dz, double maxDistance, double mask);
  double pick(jsi::Runtime &rt, double world, double ox, double oy, double oz, double dx, double dy, double dz);
  double pickScreen(jsi::Runtime &rt, double world, double x, double y);
  void setView(jsi::Runtime &rt, double world, jsi::Object viewProj, double width, double height);
  bool screenRay(jsi::Runtime &rt, double world, double x, double y);
  bool screenToWorld(jsi::Runtime &rt, double world, double x, double y, double ppx, double ppy, double ppz, double pnx, double pny, double pnz);
  bool toScreen(jsi::Runtime &rt, double world, double x, double y, double z);
  bool readPosition(jsi::Runtime &rt, double world, double entity, bool rendered);
  bool readVelocity(jsi::Runtime &rt, double world, double entity);
  double animate(jsi::Runtime &rt, double world, jsi::Object animation);
  bool stopAnimation(jsi::Runtime &rt, double world, double entity);
  double burst(jsi::Runtime &rt, double world, jsi::Object burst);
  void update(jsi::Runtime &rt, double world, double dt);
  double after(jsi::Runtime &rt, double world, double seconds);
  double cancelTimers(jsi::Runtime &rt, double world);
  double scoreboard(jsi::Runtime &rt, double world, double op, double a, double b);
  jsi::Object getScoreboard(jsi::Runtime &rt, double world);
  double count(jsi::Runtime &rt, double world);
  jsi::Object getMatrices(jsi::Runtime &rt, double world);
  jsi::Object getColors(jsi::Runtime &rt, double world);
  jsi::Object getRegions(jsi::Runtime &rt, double world);
  jsi::Object getRanges(jsi::Runtime &rt, double world);
  jsi::Object getDone(jsi::Runtime &rt, double world);
  double doneLength(jsi::Runtime &rt, double world);
  jsi::Object getEvents(jsi::Runtime &rt, double world);
  double eventLength(jsi::Runtime &rt, double world);
  jsi::Object getScratch(jsi::Runtime &rt, double world);
  jsi::String modelRig(jsi::Runtime &rt, double mesh);
  bool playClip(jsi::Runtime &rt, double world, double entity, jsi::String clip, bool loop, double speed, double fade, double time);
  bool stopClip(jsi::Runtime &rt, double world, double entity, bool reset);
  bool skinPoints(jsi::Runtime &rt, double world, double entity, jsi::Object vertices, jsi::Object output, double after);
  jsi::Object cacheRead(jsi::Runtime &rt, jsi::String key);
  bool cacheWrite(jsi::Runtime &rt, jsi::String key, jsi::Object data);
  bool cacheRemove(jsi::Runtime &rt, jsi::String key);
  bool cacheClear(jsi::Runtime &rt);
  double shapePrepare(jsi::Runtime &rt, jsi::Object vertices, jsi::Object indices, jsi::String options);
  double solidPrepare(jsi::Runtime &rt, jsi::String recipe, jsi::String options);
  double modelLoad(jsi::Runtime &rt, jsi::Object data, bool center, double fit);
  jsi::Value modelLoadAsync(jsi::Runtime &rt, jsi::Object data, bool center, double fit);
  jsi::Object modelVertices(jsi::Runtime &rt, double mesh);
  jsi::Object modelIndices(jsi::Runtime &rt, double mesh);
  jsi::Array modelSize(jsi::Runtime &rt, double mesh);
  jsi::Array modelBake(jsi::Runtime &rt, double mesh, jsi::String spec);
  bool bakeKept(jsi::Runtime &rt, jsi::String key);
  double modelTexture(jsi::Runtime &rt, double mesh);
  double meshAlias(jsi::Runtime &rt, double base);
  double meshCreate(jsi::Runtime &rt, jsi::Object vertices, jsi::Object indices);
  bool renderModel(jsi::Runtime &rt, double mesh, double texture, double shine);
  jsi::Object pathExtrude(jsi::Runtime &rt, jsi::Object points, jsi::Array counts, double depth, bool evenOdd);
  void geometrySmoothNormals(jsi::Runtime &rt, jsi::Object vertices, jsi::Object indices);
  jsi::Object geometrySolid(jsi::Runtime &rt, jsi::String recipe);
  jsi::Object geometryOptimize(jsi::Runtime &rt, jsi::Object vertices, jsi::Object indices, double ratio, double error, bool lockBorders);
  void geometryFaceOutward(jsi::Runtime &rt, jsi::Object vertices, jsi::Object indices);
  void geometryPlace(
      jsi::Runtime &rt,
      jsi::Object vertices,
      jsi::Object indices,
      jsi::Array placement,
      double first,
      jsi::Object outVertices,
      double vertexOffset,
      jsi::Object outIndices,
      double indexOffset);
  double textureLoad(jsi::Runtime &rt, jsi::Object data);
  jsi::Value textureLoadAsync(jsi::Runtime &rt, jsi::Object data);
  jsi::Value textureLoadSizedAsync(jsi::Runtime &rt, jsi::Object data, double width, double height, double fit);
  jsi::Object texturePixels(jsi::Runtime &rt, double texture);
  jsi::Array textureSize(jsi::Runtime &rt, double texture);
  double fontLoad(jsi::Runtime &rt, jsi::Object data, double depth, jsi::String chars, double weight);
  jsi::Value fontLoadAsync(jsi::Runtime &rt, jsi::Object data, double depth, jsi::String chars, double weight);
  jsi::Array fontGlyphs(jsi::Runtime &rt, double font);
  jsi::String loadError(jsi::Runtime &rt);
  void generateBuiltinMeshes(jsi::Runtime &rt);
  void renderWarmUp(jsi::Runtime &rt);
  jsi::Object renderMeshVertices(jsi::Runtime &rt, double mesh);
  jsi::Object renderMeshIndices(jsi::Runtime &rt, double mesh);
  void renderMesh(jsi::Runtime &rt, double mesh, jsi::Object vertices, jsi::Object indices, double texture, double shine);
  double renderFrame(
      jsi::Runtime &rt,
      double surface,
      jsi::Object frame,
      jsi::Object matrices,
      jsi::Object colors,
      jsi::Object regions,
      jsi::Object ranges,
      double count,
      jsi::Object viewProj,
      double world);
  double publishFrame(
      jsi::Runtime &rt,
      double surface,
      jsi::Object frame,
      jsi::Object matrices,
      jsi::Object colors,
      jsi::Object regions,
      jsi::Object ranges,
      double count,
      jsi::Object viewProj,
      double world);
  jsi::Array renderStats(jsi::Runtime &rt, double surface);
  bool hasFrameClock(jsi::Runtime &rt);
  void startFrames(jsi::Runtime &rt, double surface, jsi::Function onFrame);
  void stopFrames(jsi::Runtime &rt, double surface);
  /** Runs a surface's frame callback (on the JS thread); see `deliverFrame`. */
  void callFrame(jsi::Runtime &rt, int surface, double timeMs);
  void renderOverlay(
      jsi::Runtime &rt,
      double surface,
      jsi::Object matrices,
      jsi::Object colors,
      jsi::Object regions,
      jsi::Object ranges,
      double count,
      double width,
      double height);
  void renderBackdrop(jsi::Runtime &rt, double surface, jsi::Object matrices, jsi::Object colors, jsi::Object regions, jsi::Object ranges, double count);
  jsi::String renderError(jsi::Runtime &rt);
  jsi::String renderBackend(jsi::Runtime &rt);
  double componentCreate(jsi::Runtime &rt);
  double drawingCreate(jsi::Runtime &rt, double width, double height, double ratio);
  jsi::String drawingCommand(jsi::Runtime &rt, double document, jsi::String command);
  void drawingDestroy(jsi::Runtime &rt, double document);
  double audioLoad(jsi::Runtime &rt, jsi::Object data);
  jsi::Value audioLoadAsync(jsi::Runtime &rt, jsi::Object data);
  double audioPlay(jsi::Runtime &rt, double sound, double volume, double pan, double pitch, bool loop);
  void audioStop(jsi::Runtime &rt, double voice);
  bool audioControl(jsi::Runtime &rt, double voice, double action, double value, double pan);
  void audioSetVolume(jsi::Runtime &rt, double volume);
  void audioSetMuted(jsi::Runtime &rt, bool muted);
  bool audioIsRunning(jsi::Runtime &rt);
  void audioRelease(jsi::Runtime &rt, double sound);
  double audioDuration(jsi::Runtime &rt, double sound);
  jsi::Object audioLevels(jsi::Runtime &rt, double sound, double perSecond);
  double audioShift(jsi::Runtime &rt, double sound, double pitch, double tempo, double loudness, bool clean);
  double micPermission(jsi::Runtime &rt);
  jsi::Value micRequestPermission(jsi::Runtime &rt);
  bool micStart(jsi::Runtime &rt, double maxSeconds);
  void micStop(jsi::Runtime &rt);
  double micState(jsi::Runtime &rt);
  double micLevel(jsi::Runtime &rt);
  double micHeld(jsi::Runtime &rt);
  double micTake(jsi::Runtime &rt, double seconds, double skipEnd);
  bool hapticsSupported(jsi::Runtime &rt);
  void hapticsPlay(jsi::Runtime &rt, jsi::Array taps, bool throttle);
  double worldgenBuild(jsi::Runtime &rt, jsi::String recipe, jsi::String key, bool prepareTerrain);
  jsi::Value worldgenBuildAsync(jsi::Runtime &rt, jsi::String recipe, jsi::String key, bool prepareTerrain);
  jsi::String worldgenError(jsi::Runtime &rt);
  bool worldgenKept(jsi::Runtime &rt, jsi::String key);
  void worldgenFree(jsi::Runtime &rt, double world);
  jsi::String worldgenInfo(jsi::Runtime &rt, double world);
  jsi::Object worldgenLayer(jsi::Runtime &rt, double world, jsi::String name);
  jsi::Object worldgenReachable(jsi::Runtime &rt, double world);
  jsi::Object worldgenOverview(jsi::Runtime &rt, double world);
  bool worldgenPick(jsi::Runtime &rt, double world, double run);
  jsi::Object worldgenTerrain(jsi::Runtime &rt, double world, double material);
  jsi::Object worldgenMesh(jsi::Runtime &rt, jsi::String recipe);
  bool worldgenPaint(jsi::Runtime &rt, jsi::Object vertices, jsi::String recipe);
  double worldgenGround(jsi::Runtime &rt, double world, double x, double z);
  double worldgenSurface(jsi::Runtime &rt, double world, double x, double z);
  double worldgenPlatform(jsi::Runtime &rt, double world, double x, double z);
  bool worldgenWalkable(jsi::Runtime &rt, double world, double x, double z, double radius);
  double worldgenClearance(jsi::Runtime &rt, double world, double x, double z, double radius);
  double worldgenSolidClearance(jsi::Runtime &rt, double world, double x, double z, double radius, double bottom, double top);
  double worldgenFieldIndex(jsi::Runtime &rt, double world, jsi::String name);
  double worldgenField(jsi::Runtime &rt, double world, double field, double x, double z);
  jsi::Array worldgenTilt(jsi::Runtime &rt, double world, double x, double z, double yaw);
  bool worldgenSight(jsi::Runtime &rt, double world, double ax, double az, double bx, double bz, double radius, double step, double rise);
  jsi::Array worldgenMove(jsi::Runtime &rt, double world, double x, double z, double dx, double dz, double radius, jsi::Object bodies);

 private:
  std::unordered_set<std::string> systemBarOwners_;
  std::unique_ptr<nayan::NetworkMonitor> network_;
  std::shared_ptr<std::atomic<bool>> networkActive_;
  std::unique_ptr<jsi::Function> networkCallback_;
  std::shared_ptr<::World> owner(double id) const;
  ::World *find(double id) const;
  // `owner` is kept alive while JS holds the buffer (null for process-lifetime memory).
  jsi::Object external(jsi::Runtime &rt, std::shared_ptr<void> owner, const void *data, size_t bytes) const;

  std::unordered_map<int, std::shared_ptr<::World>> worlds_;
  int next_ = 1;
  std::unordered_set<int> drawings_;
  /** Frame callbacks by surface; only touched on the JS thread. */
  std::unordered_map<int, jsi::Function> frameCallbacks_;
};

/**
 * Called by the platform's display clock (any thread) once per refresh: schedules the surface's
 * frame callback on the JS thread unless one is already waiting there.
 */
void deliverFrame(int surface, double timeMs);

} // namespace facebook::react
