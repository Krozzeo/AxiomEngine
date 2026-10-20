import {createHash} from 'node:crypto';
import {githubError} from '../../daemon/bootstrap/github/client.mjs';
export class FakeGitHub {
 constructor(){this.token=null;this.sha='1'.repeat(40);this.files=new Map();this.history=[];this.calls=0;this.fail=null;this.selected=[];this.branches=new Set(['main']);}
 disconnect(){this.token=null;}
 async connect(token){this.token=token;return {id:42,login:'test-player'};}
 async repositories(){return [{name:'test-player/game',private:true,branch:'main',canPush:true}];}
 async create(name,privateRepository){this.created={name,private:privateRepository};return {name:'test-player/'+name,branch:'main',url:'https://github.com/test-player/'+name};}
 async repository(name){this.selected.push(name);return {name,branch:'main'};}
 async head(repository,branch){return this.branches.has(branch)?this.sha:null;}
 async createBranch(repository,branch,sha){this.createdBranch={repository,branch,sha};this.branches.add(branch);}
 async tree(){return [...this.files].map(([path,bytes])=>({path,mode:'100644',sha:createHash('sha1').update(Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes])).digest('hex')}));}
 async manifest(repo,prefix){const data=this.files.get(prefix+'publication.json');return data?JSON.parse(data):null;}
 async commit(data){this.calls++;if(data.expectedHead!==this.sha)throw githubError('Remote changed','AX_GITHUB_0004');if(this.fail==='before'){this.fail=null;throw githubError('Response lost','AX_GITHUB_0003');}for(const f of data.additions)this.files.set(f.path,Buffer.from(f.bytes));for(const path of data.deletions)this.files.delete(path);this.sha=createHash('sha1').update(this.sha+data.publicationId).digest('hex');const receipt={sha:this.sha,url:'https://github.com/'+data.repository+'/commit/'+this.sha};this.history.push({...data,...receipt});if(this.fail==='after'){this.fail=null;throw githubError('Response lost','AX_GITHUB_0003');}return receipt;}
 async findPublication(repo,branch,id,hash){const item=this.history.find(v=>v.publicationId===id&&v.snapshotHash===hash);return item?{sha:item.sha,url:item.url}:null;}
}
