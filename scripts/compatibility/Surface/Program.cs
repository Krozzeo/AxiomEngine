using System.Text.Json;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

// Parse declarations only. Nothing from the SDK or reference documentation executes here.
var root = Path.GetFullPath(args[0]);
if(args.Length>1 && args[1]=="--reference") {
 var facts=new List<object>();
 foreach(var file in Directory.EnumerateFiles(root,"*.cs",SearchOption.AllDirectories).Order()) {
  var tree=CSharpSyntaxTree.ParseText(File.ReadAllText(file));
  foreach(var node in tree.GetRoot().DescendantNodes().OfType<MemberDeclarationSyntax>()) {
   string? name=node switch {BaseTypeDeclarationSyntax t=>t.Identifier.Text,DelegateDeclarationSyntax d=>d.Identifier.Text,_=>null};
   if(name is null || !node.Modifiers.Any(SyntaxKind.PublicKeyword))continue;
   var ns=string.Join(".",node.Ancestors().OfType<BaseNamespaceDeclarationSyntax>().Reverse().Select(n=>n.Name.ToString()));
   var owner=ns+"."+string.Join(".",node.Ancestors().OfType<BaseTypeDeclarationSyntax>().Reverse().Select(t=>t.Identifier.Text).Append(name));
   int Arity(MemberDeclarationSyntax n)=>n switch {TypeDeclarationSyntax t=>t.TypeParameterList?.Parameters.Count??0,DelegateDeclarationSyntax d=>d.TypeParameterList?.Parameters.Count??0,_=>0};
   string Canon(BaseTypeDeclarationSyntax t)=>t.Identifier.Text+(Arity(t)>0?"`"+Arity(t):"");
   var arity=Arity(node);var ownerCanonical=ns+"."+string.Join(".",node.Ancestors().OfType<BaseTypeDeclarationSyntax>().Reverse().Select(Canon).Append(name+(arity>0?"`"+arity:"")));
   facts.Add(new{owner,ownerCanonical,name,arity,ns,kind=node.Kind().ToString(),source=Path.GetRelativePath(root,file).Replace('\\','/')});
  }
 }
 Console.WriteLine(JsonSerializer.Serialize(facts));return;
}
if(args.Length>2 && args[1]=="--missing") {
 var requests=JsonDocument.Parse(File.ReadAllText(args[2])).RootElement.EnumerateArray().Select(r=>System.Text.RegularExpressions.Regex.Replace(r.GetProperty("owner").GetString()!,"<[^>]+>|`[0-9]+","")).ToHashSet();
 var facts=new List<object>();
 foreach(var file in Directory.EnumerateFiles(root,"*.cs",SearchOption.AllDirectories).Order()) {
  var tree=CSharpSyntaxTree.ParseText(File.ReadAllText(file));
  foreach(var type in tree.GetRoot().DescendantNodes().OfType<TypeDeclarationSyntax>()) {
   var ns=string.Join(".",type.Ancestors().OfType<BaseNamespaceDeclarationSyntax>().Reverse().Select(n=>n.Name.ToString()));
   var owner=ns+"."+string.Join(".",type.Ancestors().OfType<BaseTypeDeclarationSyntax>().Reverse().Select(t=>t.Identifier.Text).Append(type.Identifier.Text));
   if(!requests.Contains(owner))continue;
   bool publicContract=false;
   void Add(string name,string declaration){facts.Add(new{owner,name,declaration,publicContract,source=Path.GetRelativePath(root,file).Replace('\\','/')});}
   foreach(var m in type.Members) {
    publicContract=m.Modifiers.Any(SyntaxKind.PublicKeyword)||m.Modifiers.Any(SyntaxKind.ProtectedKeyword)||type is InterfaceDeclarationSyntax;
    switch(m) {
     case ConstructorDeclarationSyntax x:Add(".ctor",x.WithInitializer(null).WithAttributeLists(default).WithBody(null).WithExpressionBody(null).WithSemicolonToken(SyntaxFactory.Token(SyntaxKind.SemicolonToken)).WithoutTrivia().NormalizeWhitespace().ToFullString());break;
     case MethodDeclarationSyntax x:Add(x.Identifier.Text,x.WithAttributeLists(default).WithBody(null).WithExpressionBody(null).WithSemicolonToken(SyntaxFactory.Token(SyntaxKind.SemicolonToken)).WithoutTrivia().NormalizeWhitespace().ToFullString());break;
     case EventFieldDeclarationSyntax x:
      foreach(var v in x.Declaration.Variables)Add(v.Identifier.Text,string.Join(" ",x.Modifiers)+" event "+x.Declaration.Type+" "+v.Identifier+";");break;
     case EventDeclarationSyntax x:Add(x.Identifier.Text,string.Join(" ",x.Modifiers)+" event "+x.Type+" "+x.Identifier+";");break;
     case PropertyDeclarationSyntax x:Add(x.Identifier.Text,string.Join(" ",x.Modifiers)+" "+x.Type+" "+x.Identifier+" { "+string.Join(" ",x.AccessorList?.Accessors.Select(a=>a.Keyword.Text+";")??new[]{"get;"})+" }");break;
     case IndexerDeclarationSyntax x:Add("this",string.Join(" ",x.Modifiers)+" "+x.Type+" this"+x.ParameterList+" { "+string.Join(" ",x.AccessorList?.Accessors.Select(a=>a.Keyword.Text+";")??new[]{"get;"})+" }");break;
     case ConversionOperatorDeclarationSyntax x:Add(x.Type.ToString(),x.WithAttributeLists(default).WithBody(null).WithExpressionBody(null).WithSemicolonToken(SyntaxFactory.Token(SyntaxKind.SemicolonToken)).WithoutTrivia().NormalizeWhitespace().ToFullString());break;
     case FieldDeclarationSyntax x:foreach(var v in x.Declaration.Variables)Add(v.Identifier.Text,string.Join(" ",x.Modifiers)+" "+x.Declaration.Type+" "+v.Identifier+";");break;
    }
   }
  }
 }
 Console.WriteLine(JsonSerializer.Serialize(facts));return;
}
var records = new List<object>();
foreach (var file in Directory.GetFiles(Path.Combine(root,"engine/scripting/templates"),"*.cs").Order()) {
 var tree=CSharpSyntaxTree.ParseText(File.ReadAllText(file));
 foreach(var type in tree.GetRoot().DescendantNodes().OfType<BaseTypeDeclarationSyntax>()) {
  if(!type.Modifiers.Any(SyntaxKind.PublicKeyword))continue;
  if(type.Ancestors().OfType<BaseTypeDeclarationSyntax>().Any(t=>!t.Modifiers.Any(SyntaxKind.PublicKeyword)))continue;
  var ns=string.Join(".",type.Ancestors().OfType<BaseNamespaceDeclarationSyntax>().Reverse().Select(n=>n.Name.ToString()));
  var owner=ns+"."+string.Join(".",type.Ancestors().OfType<BaseTypeDeclarationSyntax>().Reverse().Select(t=>t.Identifier.Text).Append(type.Identifier.Text));
  if(!ns.StartsWith("Axiom.Gameplay"))continue;
  void Add(string name,string kind,string returns,string[] parameters,SyntaxNode node) {
   records.Add(new{owner,name,kind,returns,parameters,source=Path.GetRelativePath(root,file).Replace('\\','/'),line=node.GetLocation().GetLineSpan().StartLinePosition.Line+1});
  }
  string[] Parameters(ParameterListSyntax? p)=>p?.Parameters.Select(v=>string.Join(" ",v.Modifiers.Select(m=>m.Text).Append(v.Type?.ToString()??"?"))).ToArray()??[];
  Add(type.Identifier.Text,"type",type.Kind().ToString(),[],type);
  if(type is EnumDeclarationSyntax en){foreach(var field in en.Members)Add(field.Identifier.Text,"enum-value",owner,[],field);continue;}
  if(type is not TypeDeclarationSyntax td)continue;
  foreach(var m in td.Members) {
   if(!m.Modifiers.Any(SyntaxKind.PublicKeyword)&&!m.Modifiers.Any(SyntaxKind.ProtectedKeyword))continue;
   switch(m) {
    case MethodDeclarationSyntax method:Add(method.Identifier.Text+(method.TypeParameterList is null?"":"`"+method.TypeParameterList.Parameters.Count),"method",method.ReturnType.ToString(),Parameters(method.ParameterList),m);break;
    case ConstructorDeclarationSyntax ctor:Add(".ctor","constructor",owner,Parameters(ctor.ParameterList),m);break;
    case PropertyDeclarationSyntax prop:Add(prop.Identifier.Text,"property",prop.Type.ToString(),[],m);break;
    case IndexerDeclarationSyntax index:Add("this","indexer",index.Type.ToString(),index.ParameterList.Parameters.Select(p=>p.Type?.ToString()??"?").ToArray(),m);break;
    case FieldDeclarationSyntax fields:foreach(var field in fields.Declaration.Variables)Add(field.Identifier.Text,"field",fields.Declaration.Type.ToString(),[],field);break;
    case EventFieldDeclarationSyntax events:foreach(var field in events.Declaration.Variables)Add(field.Identifier.Text,"event",events.Declaration.Type.ToString(),[],field);break;
    case OperatorDeclarationSyntax op:Add("operator "+op.OperatorToken.Text,"operator",op.ReturnType.ToString(),Parameters(op.ParameterList),m);break;
    case ConversionOperatorDeclarationSyntax op:Add(op.ImplicitOrExplicitKeyword.Text+" operator","conversion",op.Type.ToString(),Parameters(op.ParameterList),m);break;
   }
  }
 }
}
Console.WriteLine(JsonSerializer.Serialize(new{schemaVersion=1,scope="Explicit public/protected C# syntax declarations, not behavior or synthesized record members",records}));
