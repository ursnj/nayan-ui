# Asset attribution

The game code is a simplified version of Playtura's games-library Car Racing (`packages/games/src/games/car-racing`). The roadside tree is built procedurally in TypeScript.

`models/car_body.glb`, `models/car_glass.glb` and `models/car_trim.glb` are copied from Playtura's engine example (`packages/engine/example/assets/models`), converted there by `scripts/import-car.py` from the Khronos glTF sample [Car Concept](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept), licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) and built from a public-domain model by Unity Fan. The conversion drops the interior, replaces textures with flat colors, splits the paint (white, tinted per car), glass and trim, and simplifies the mesh.

`textures/asphalt.png`, `textures/grass.png` and the WAV effects in `sfx/` are copied from `packages/games/src/assets/textures` and `packages/games/src/assets/sfx` in the Playtura checkout.
