import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CreateSceneClass } from "../createScene";

// If you don't need the standard material you will still need to import it since the scene requires it.
// import "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";

import grassTextureUrl from "../../assets/grass.jpg";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";

import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import {
    Animation,
    Color3,
    Mesh,
    MeshBuilder,
    PointLight,
    Scalar,
    TrailMesh,
} from "@babylonjs/core";
import { StarfieldProceduralTexture } from "@babylonjs/procedural-textures";
import Star from "../textures/distortion.png";
import Rock from "../textures/rock.png";
import RockNormal from "../textures/rockn.png";

export class StarterScene implements CreateSceneClass {
    createScene = async (
        engine: Engine,
        canvas: HTMLCanvasElement
    ): Promise<Scene> => {
        // This creates a basic Babylon Scene object (non-mesh)
        const scene = new Scene(engine);

        let camAlpha = 0,
            camBeta = -Math.PI / 4,
            camDist = 350,
            camTarget = new Vector3(0, 0, 0);

        let camera = new ArcRotateCamera(
            "camera1",
            camAlpha,
            camBeta,
            camDist,
            camTarget,
            scene
        );
        let env = this.setupEnvironment(scene);
        let star = this.createStar(scene);
        let planets = this.populatePlanetarySystem(scene);
        camera.attachControl(true);

        let spinAnim = this.createSpinAnimation();
        star.animations.push(spinAnim);
        scene.beginAnimation(star, 0, 60, true);

        planets.forEach((p) => {
            p.animations.push(spinAnim);
            scene.beginAnimation(p, 0, 60, true, Scalar.RandomRange(0.1, 3));
        });

        return scene;
    };

    setupEnvironment(scene: Scene) {
        let starfieldPT = new StarfieldProceduralTexture(
            "starfieldPT",
            512,
            scene
        );
        starfieldPT.coordinatesMode =
            Texture.FIXED_EQUIRECTANGULAR_MIRRORED_MODE;
        starfieldPT.darkmatter = 1.5;
        starfieldPT.distfading = 0.75;
        let envOptions = {
            skyboxSize: 512,
            createGround: false,
            skyboxTexture: starfieldPT,
            environmentTexture: starfieldPT,
        };
        let light = new PointLight("starLight", Vector3.Zero(), scene);
        light.intensity = 2;
        light.diffuse = new Color3(0.98, 0.9, 1);
        light.specular = new Color3(1, 0.9, 0.5);
        let env = scene.createDefaultEnvironment(envOptions);
        return env;
    }

    populatePlanetarySystem(scene: Scene): Mesh[] {
        let hg = {
            name: "hg",
            posRadians: Scalar.RandomRange(0, 2 * Math.PI),
            posRadius: 14,
            scale: 2,
            color: new Color3(0.45, 0.33, 0.18),
            rocky: true,
        };
        let aphro = {
            name: "aphro",
            posRadians: Scalar.RandomRange(0, 2 * Math.PI),
            posRadius: 35,
            scale: 3.5,
            color: new Color3(0.91, 0.89, 0.72),
            rocky: true,
        };
        let tellus = {
            name: "tellus",
            posRadians: Scalar.RandomRange(0, 2 * Math.PI),
            posRadius: 65,
            scale: 3.75,
            color: new Color3(0.17, 0.63, 0.05),
            rocky: true,
        };
        let ares = {
            name: "ares",
            posRadians: Scalar.RandomRange(0, 2 * Math.PI),
            posRadius: 100,
            scale: 3,
            color: new Color3(0.55, 0, 0),
            rocky: true,
        };
        let zeus = {
            name: "zeus",
            posRadians: Scalar.RandomRange(0, 2 * Math.PI),
            posRadius: 140,
            scale: 6,
            color: new Color3(0, 0.3, 1),
            rocky: false,
        };
        const planetData = [hg, aphro, tellus, ares, zeus];
        const planets: Mesh[] = [];
        planetData.forEach((p) => {
            const planet = this.createPlanet(p, scene);
            this.createAndStartOrbitAnimation(planet, scene);
            planet.computeWorldMatrix(true);
            let planetTrail = new TrailMesh(
                planet.name + "-trail",
                planet,
                scene,
                0.1,
                planet.metadata.orbitOptions.orbitalCircum,
                true
            );
            let trailMat = new StandardMaterial(
                planetTrail.name + "-mat",
                scene
            );
            trailMat.emissiveColor =
                trailMat.specularColor =
                trailMat.diffuseColor =
                    planet.metadata.orbitOptions.color;
            planetTrail.material = trailMat;
            planets.push(planet);
        });

        return planets;
    }

    createStar(scene: Scene) {
        let starDiam = 16;
        let star = MeshBuilder.CreateSphere(
            "star",
            { diameter: starDiam, segments: 128 },
            scene
        );
        let mat = new StandardMaterial("starMat", scene);
        star.material = mat;
        mat.emissiveColor = new Color3(0.37, 0.333, 0.11);
        mat.diffuseTexture = new Texture(Star, scene);
        mat.diffuseTexture.level = 1.8;
        return star;
    }

    createPlanet(opts: any, scene: Scene) {
        let planet = MeshBuilder.CreateSphere(
            opts.name,
            { diameter: 1 },
            scene
        );
        let mat = new StandardMaterial(planet.name + "-mat", scene);
        mat.diffuseColor = mat.specularColor = opts.color;
        mat.specularPower = 0;
        if (opts.rocky === true) {
            mat.bumpTexture = new Texture(RockNormal, scene);
            mat.diffuseTexture = new Texture(Rock, scene);
        } else {
            mat.diffuseTexture = new Texture(Star, scene);
        }
        planet.material = mat;
        planet.scaling.setAll(opts.scale);
        planet.position.x = opts.posRadius * Math.sin(opts.posRadians);
        planet.position.z = opts.posRadius * Math.cos(opts.posRadians);

        planet.metadata = { orbitOptions: opts };
        return planet;
    }

    createSpinAnimation() {
        let orbitAnim = new Animation(
            "planetspin",
            "rotation.y",
            30,
            Animation.ANIMATIONTYPE_FLOAT,
            Animation.ANIMATIONLOOPMODE_CYCLE
        );
        const keyFrames = [];
        keyFrames.push({
            frame: 0,
            value: 0,
        });
        keyFrames.push({
            frame: 60,
            value: Scalar.TwoPi,
        });
        orbitAnim.setKeys(keyFrames);
        return orbitAnim;
    }

    createAndStartOrbitAnimation(planet: Mesh, scene: Scene) {
        if (!planet.metadata) {
            planet.metadata = {};
        }

        const Gm = 6672.59 * 0.07;
        const opts = planet.metadata.orbitOptions;
        const rCubed = Math.pow(opts.posRadius, 3);
        const period = Scalar.TwoPi * Math.sqrt(rCubed / Gm);
        const v = Math.sqrt(Gm / opts.posRadius);
        const w = v / period;

        let angPos = opts.posRadians;

        planet.metadata.orbitOptions.period = period;
        planet.metadata.orbitOptions.orbitalVel = v;
        planet.metadata.orbitOptions.angularVel = w;
        planet.metadata.orbitOptions.orbitalCircum = Math.pow(
            Math.PI * opts.posRadius,
            2
        );
        planet.metadata.preRenderObsv = scene.onBeforeRenderObservable.add(
            () => {
                planet.position.x = opts.posRadius * Math.sin(angPos);
                planet.position.z = opts.posRadius * Math.cos(angPos);
                angPos = Scalar.Repeat(angPos + w, Scalar.TwoPi);
            }
        );

        return planet;
    }
}

export default new StarterScene();
