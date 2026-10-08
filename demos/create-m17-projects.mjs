import {fileURLToPath} from 'node:url';import {resolve} from 'node:path';import {readFile} from 'node:fs/promises';
import {SceneWorkspace} from '../daemon/bootstrap/scene-workspace.mjs';import {ProjectStore} from '../daemon/bootstrap/project-store.mjs';
export async function createM17Projects(root=resolve('.axiom/projects'),{milestone='M17',includeCad=true}={}){
 const w=new SceneWorkspace(new ProjectStore(root)),result=[],args=value=>({id:w.project.id,expectedSceneRevision:w.revision,...value});
 async function job(data){const {job}=await w.run('asset.job.start',args(data));while(w.activeJob)await new Promise(r=>setTimeout(r,25));const finished=(await w.run('asset.job.get',{id:w.project.id,jobId:job.id})).job;if(finished.status!=='completed')throw Error(finished.error?.message??'Import failed');return finished.assetId;}
 if(includeCad){
 await w.run('project.create',{name:`Demo · ${milestone} CAD & Mesh Workshop`,dimension:3});
 const initial=w.project.scene.entities.find(e=>e.renderable);await w.run('scene.entity.delete',args({entityId:initial.id}));
 const obj='v -0.7 -0.7 -0.7\nv 0.7 -0.7 -0.7\nv 0 0.7 0\nv 0 -0.7 0.7\nf 1 3 2\nf 2 3 4\nf 4 3 1\nf 1 2 4\n';
 const stl='solid triangle\nfacet normal 0 0 1\nouter loop\nvertex -0.7 -0.7 0\nvertex 0.7 -0.7 0\nvertex 0 0.7 0\nendloop\nendfacet\nendsolid triangle';
 for(const[i,name]of ['cube.step','cube.iges','tetrahedron.obj','triangle.stl'].entries()){const bytes=i<2?await readFile(new URL('../tests/fixtures/cad/'+name,import.meta.url)):Buffer.from(i===2?obj:stl),id=await job({operation:'import',name,base64:bytes.toString('base64'),settings:{center:true,unitScale:i===0?5:i===1?150:1}});await w.run('scene.asset.place',args({assetId:id}));const e=w.project.scene.entities.at(-1);await w.run('scene.entity.update',args({entityId:e.id,name:['STEP solid','IGES solid','OBJ tetrahedron','STL triangle'][i],transform:{position:[(i-1.5)*2,0,0]}}));if(i<2)await job({operation:'process',assetId:id,entityId:e.id,settings:{center:true,unitScale:i===0?5:150},generateLod:false,generateCollider:true});}
 await w.run('scene.primitive.create',args({dimension:3,shape:'sphere'}));const sphere=w.project.scene.entities.at(-1);await w.run('scene.entity.update',args({entityId:sphere.id,name:'Sphere · generated LODs',transform:{position:[0,2,0]}}));await job({operation:'process',assetId:sphere.renderable.assetId,entityId:sphere.id,settings:{center:true,normals:'smooth'},generateLod:true,generateCollider:true});
 const camera=w.project.scene.entities.find(e=>e.camera);await w.run('scene.entity.update',args({entityId:camera.id,transform:{position:[0,1,10]}}));await w.run('scene.save',args());result.push({id:w.project.id,name:w.project.name});await w.run('project.close',args());
 }
 await w.run('project.create',{name:`Demo · ${milestone} Script Component Lab`,dimension:3});
 const source=`using Axiom.Gameplay;
namespace Game;
public enum MovementMode { Idle, Oscillate }
public sealed class InspectorMover : MonoBehaviour {
 [Title("Movement")][Range(0,5)][Tooltip("World units per second")] public double Speed=1;
 public Vector3 Direction=new Vector3(1,0,0);
 public MovementMode Mode=MovementMode.Oscillate;
 [Space(12)][SerializeField] private bool Enabled=true;
 [ReadOnly] public int Frames=0;
 [HideInInspector] public double InternalPhase=0;
 private Vector3 origin;
 public override void OnStart(){origin=Entity.Transform.Position;}
 public override void OnUpdate(double deltaSeconds){Frames++;InternalPhase+=deltaSeconds*Speed;if(Enabled&&Mode==MovementMode.Oscillate)Entity.SetPosition(origin+Direction*Math.Sin(InternalPhase));}
}
`;
 const tint=`using Axiom.Gameplay; namespace Game;
public sealed class Notes : MonoBehaviour {
 [Title("Example values")] public string Label="Independent component";
 public Color Tint=new Color(0.2,0.7,1,1);
 public Vector2Int Cell=new Vector2Int(2,3);
 public Vector4Int Coordinates=new Vector4Int(1,2,3,4);
 [ReadOnly] public double Elapsed=0;
 public override void OnUpdate(double deltaSeconds){Elapsed+=deltaSeconds;}
}
`;
 for(const[name,text]of [['InspectorMover',source],['Notes',tint]]){const path='Scripts/'+name+'.cs';await w.run('project.files.edit',args({action:'create',kind:'script',path}));await w.run('project.files.edit',args({action:'write',path,text}));}
 const cube=w.project.scene.entities.find(e=>e.renderable);await w.run('scene.script.edit',args({entityId:cube.id,path:'Scripts/InspectorMover.cs',action:'attach'}));await w.run('scene.script.edit',args({entityId:cube.id,path:'Scripts/Notes.cs',action:'attach'}));
 await w.run('scene.primitive.create',args({dimension:3,shape:'sphere'}));const second=w.project.scene.entities.at(-1);await w.run('scene.entity.update',args({entityId:second.id,transform:{position:[0,2,0]}}));await w.run('scene.script.edit',args({entityId:second.id,path:'Scripts/InspectorMover.cs',action:'attach'}));await w.run('scene.script.edit',args({entityId:second.id,path:'Scripts/InspectorMover.cs',action:'values',values:{Speed:2,Direction:[0,0.5,0]}}));
 await w.run('scene.save',args());result.push({id:w.project.id,name:w.project.name,scriptStatus:'Compile automatically on first Play; .NET 10 + wasm-tools required'});return result;
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(await createM17Projects(),null,2));
