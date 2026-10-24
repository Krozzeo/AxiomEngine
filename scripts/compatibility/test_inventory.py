import json,tempfile,unittest,zipfile
from pathlib import Path
from inventory import canonical_type,ownership,parse_archive,PREFIX
from packages import xrefs
class InventoryTests(unittest.TestCase):
 def test_canonical_generic_namespace_and_nested_identity(self):
  self.assertEqual(canonical_type('Events.UnityEvent_1','UnityEngine.Events'),'UnityEngine.Events.UnityEvent`1')
  self.assertEqual(canonical_type('Unity.Collections.NativeSlice_1.Enumerator','Unity.Collections'),'Unity.Collections.NativeSlice`1.Enumerator')
 def test_family_names_do_not_steal_physics_or_texture(self):
  for name,area in [('Rigidbody','M26'),('Rigidbody2D','M27'),('MeshCollider','M25'),('PhysicsMaterial2D','M27'),('Texture2D','M30'),('GUIStyle','M33'),('Animator','M31')]:self.assertEqual(ownership('UnityEngine.'+name),area)
 def test_navigation_tombstones_overloads_and_categories(self):
  with tempfile.TemporaryDirectory()as temp:
   path=Path(temp)/'fixture.zip'
   with zipfile.ZipFile(path,'w')as z:
    z.writestr(PREFIX+'docdata/toc.js','var toc = '+json.dumps({'title':'UnityEngine','children':[{'title':'Classes','children':[{'title':'Probe','link':'Probe'}]}]})+';')
    z.writestr(PREFIX+'Probe.html','<h1>Probe</h1><p>class in UnityEngine</p><h3>Methods</h3><table class="list"><td class="lbl"><a href="Probe.Run.html">Run</a></td></table><h3>Description</h3><p>Long irrelevant prose</p>')
    z.writestr(PREFIX+'Probe.Run.html','<h1><a href="Probe.html">Probe</a>.Run</h1><div class="signature-CS sig-block">public void Run();</div><div class="signature-CS sig-block">public void Run(int count);</div>')
    z.writestr(PREFIX+'Empty.html','<h1></h1>')
   rows,meta=parse_archive(path);self.assertEqual(len(rows),3);self.assertEqual(len(meta['excludedNavigationPages']),1);self.assertEqual({r['kind']for r in rows},{'type','methods'});self.assertEqual(len({r['id']for r in rows}),3)
 def test_package_uid_parser_preserves_overload_parameters(self):
  raw=b'- uid: Example.Run(System.Int32)\n  commentId: M:Example.Run(System.Int32)\n  href: api/Example.html\n- uid: Example.Run\n  commentId: M:Example.Run\n  href: api/Example.html\n'
  self.assertEqual(len(list(xrefs(raw))),2)
if __name__=='__main__':unittest.main()
