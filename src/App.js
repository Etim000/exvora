import React, { useState, useEffect, useRef, useCallback } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "firebase/auth";
import { collection, addDoc, doc, setDoc, getDoc, getDocs, query, orderBy, onSnapshot, serverTimestamp, where, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";
import { auth, db } from "./firebase";

const C = {
  primary:"#2D5F4C",primaryDark:"#1E4435",primaryLight:"#3F7A62",
  accent:"#E8945F",accentDark:"#D67A45",
  bg:"#FAFCFB",surface:"#FFFFFF",
  text:"#1A2E27",textLight:"#5A6E67",textMuted:"#8B9A94",
  border:"#DDE5E1",borderLight:"#EDF2EF",
  success:"#4CAF50",warning:"#FF9800",error:"#F44336",info:"#2196F3",
  shadow:"rgba(29,68,53,0.08)",shadowMd:"rgba(29,68,53,0.12)",
};

const FONT="'Inter',system-ui,-apple-system,sans-serif";
const DISPLAY="'Fraunces',Georgia,serif";

const MODE_META={
  swap:{label:"Swap",icon:"↔️",color:C.primary,bg:"#E8F3EF"},
  kindness:{label:"Kindness",icon:"♥",color:"#6B46C1",bg:"#F3EFFF"},
  emergency:{label:"Emergency",icon:"⚡",color:C.error,bg:"#FFEBEE"},
  shelter:{label:"Shelter",icon:"🏠",color:"#FF6B35",bg:"#FFF3E0"},
};

const CATS=["All","Food & Farm","Skills & Labour","Clothing","Shelter","Education","Emergency","Health","Other"];

const GS=()=>(
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    body{background:${C.bg};font-family:${FONT};color:${C.text};-webkit-font-smoothing:antialiased;}
    input,textarea,select,button{font-family:${FONT};}
    ::-webkit-scrollbar{width:0;}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes scaleIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    .fadeIn{animation:fadeIn 0.3s ease;}
    .slideUp{animation:slideUp 0.4s ease;}
    .scaleIn{animation:scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1);}
    .card{transition:all 0.2s ease;}
    .card:active{transform:scale(0.98);}
  `}</style>
);

const Icon=({name,size=20,color=C.text})=>{
  const icons={
    home:"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    plus:"M12 4v16m8-8H4",
    message:"M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    user:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    search:"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    heart:"M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    bell:"M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
    location:"M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
    lock:"M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    flag:"M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9",
    phone:"M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
    arrowLeft:"M10 19l-7-7m0 0l7-7m-7 7h18",
    check:"M5 13l4 4L19 7",
    x:"M6 18L18 6M6 6l12 12",
    chevronRight:"M9 5l7 7-7 7",
    settings:"M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  };
  return(
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={icons[name]||""}/>
    </svg>
  );
};

const Btn=({children,onClick,variant="primary",full,sm,icon,style={},disabled,loading})=>{
  const variants={
    primary:{bg:C.primary,color:"#fff",border:"none"},
    secondary:{bg:C.surface,color:C.primary,border:`2px solid ${C.primary}`},
    ghost:{bg:"transparent",color:C.textLight,border:"none"},
    danger:{bg:C.error,color:"#fff",border:"none"},
  };
  const v=variants[variant];
  return(
    <button onClick={onClick} disabled={disabled||loading} style={{background:v.bg,color:v.color,border:v.border,borderRadius:12,padding:sm?"8px 16px":"12px 24px",fontSize:sm?14:15,fontWeight:600,cursor:disabled||loading?"not-allowed":"pointer",opacity:disabled||loading?0.6:1,width:full?"100%":"auto",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all 0.2s",boxShadow:variant==="primary"?`0 2px 8px ${C.shadow}`:"none",...style}}>
      {loading?<div className="spin" style={{width:16,height:16,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%"}}/>:icon?<Icon name={icon} size={18} color={v.color}/>:null}
      {children}
    </button>
  );
};

const Inp=({label,type="text",value,onChange,placeholder,icon,multiline,rows=4,error})=>(
  <div style={{marginBottom:16}}>
    {label&&<label style={{display:"block",fontSize:14,fontWeight:600,color:C.text,marginBottom:6}}>{label}</label>}
    <div style={{position:"relative"}}>
      {icon&&<div style={{position:"absolute",left:14,top:multiline?"14px":"50%",transform:multiline?"none":"translateY(-50%)",pointerEvents:"none"}}><Icon name={icon} size={18} color={C.textMuted}/></div>}
      {multiline
        ?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{width:"100%",padding:icon?"12px 14px 12px 44px":"12px 14px",borderRadius:10,border:`2px solid ${error?C.error:C.border}`,fontSize:15,color:C.text,background:C.surface,outline:"none",resize:"vertical",fontFamily:FONT}}/>
        :<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",padding:icon?"12px 14px 12px 44px":"12px 14px",borderRadius:10,border:`2px solid ${error?C.error:C.border}`,fontSize:15,color:C.text,background:C.surface,outline:"none"}}/>
      }
    </div>
    {error&&<p style={{fontSize:13,color:C.error,marginTop:4,fontWeight:500}}>{error}</p>}
  </div>
);

const Alert=({type,msg,onClose})=>{
  if(!msg)return null;
  const map={error:{bg:"#FFEBEE",color:C.error},success:{bg:"#E8F5E9",color:C.success},info:{bg:"#E3F2FD",color:C.info}};
  const s=map[type]||map.info;
  return(
    <div style={{background:s.bg,borderLeft:`4px solid ${s.color}`,borderRadius:8,padding:"12px 16px",fontSize:14,color:C.text,marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <span style={{fontWeight:500}}>{msg}</span>
      {onClose&&<button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Icon name="x" size={16} color={s.color}/></button>}
    </div>
  );
};

const Loader=()=>(
  <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh"}}>
    <div className="spin" style={{width:40,height:40,border:`3px solid ${C.borderLight}`,borderTopColor:C.primary,borderRadius:"50%"}}/>
  </div>
);

const Splash=({onDone})=>{
  useEffect(()=>{const t=setTimeout(onDone,2000);return()=>clearTimeout(t);},[onDone]);
  return(
    <div style={{position:"fixed",inset:0,background:`linear-gradient(135deg,${C.primaryDark} 0%,${C.primary} 100%)`,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:20}}>
      <div style={{fontSize:64}}>🤝</div>
      <h1 style={{fontFamily:DISPLAY,color:"#fff",fontSize:42,fontWeight:800,letterSpacing:-1}}>Exvora</h1>
      <p style={{color:"rgba(255,255,255,0.8)",fontSize:16}}>Community Exchange Platform</p>
    </div>
  );
};

const Auth=({onLogin})=>{
  const [isLogin,setIsLogin]=useState(true);
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  
  const submit=async()=>{
    setErr("");
    if(!isLogin&&!name.trim()){setErr("Please enter your name.");return;}
    if(!email.includes("@")){setErr("Invalid email address.");return;}
    if(pass.length<6){setErr("Password must be at least 6 characters.");return;}
    setLoading(true);
    try{
      if(isLogin){
        const cred=await signInWithEmailAndPassword(auth,email,pass);
        onLogin(cred.user);
      }else{
        const cred=await createUserWithEmailAndPassword(auth,email,pass);
        await updateProfile(cred.user,{displayName:name.trim()});
        await setDoc(doc(db,"users",cred.user.uid),{name:name.trim(),email,location:"",bio:"",verified:false,rating:0,reviews:0,settings:{notifications:true,location:true,privacy:"public"},createdAt:serverTimestamp()});
        onLogin(cred.user);
      }
    }catch(e){
      setErr(e.code==="auth/email-already-in-use"?"Email already registered.":e.code==="auth/user-not-found"?"No account found.":e.code==="auth/wrong-password"||e.code==="auth/invalid-credential"?"Incorrect email or password.":"Something went wrong.");
    }
    setLoading(false);
  };
  
  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:400}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:48,marginBottom:12}}>🤝</div>
          <h1 style={{fontFamily:DISPLAY,fontSize:32,fontWeight:800,color:C.text,marginBottom:8}}>Exvora</h1>
          <p style={{fontSize:14,color:C.textLight}}>Community Exchange Platform</p>
        </div>
        <div style={{background:C.surface,borderRadius:16,padding:24,boxShadow:`0 4px 24px ${C.shadow}`}}>
          <div style={{display:"flex",background:C.bg,borderRadius:10,padding:4,marginBottom:24}}>
            <button onClick={()=>setIsLogin(true)} style={{flex:1,padding:10,borderRadius:8,border:"none",background:isLogin?C.primary:"transparent",color:isLogin?"#fff":C.textLight,fontWeight:600,fontSize:14,cursor:"pointer",transition:"all 0.2s"}}>Sign In</button>
            <button onClick={()=>setIsLogin(false)} style={{flex:1,padding:10,borderRadius:8,border:"none",background:!isLogin?C.primary:"transparent",color:!isLogin?"#fff":C.textLight,fontWeight:600,fontSize:14,cursor:"pointer",transition:"all 0.2s"}}>Sign Up</button>
          </div>
          {!isLogin&&<Inp label="Full Name" value={name} onChange={setName} placeholder="Your name" icon="user"/>}
          <Inp label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon="message"/>
          <Inp label="Password" type="password" value={pass} onChange={setPass} placeholder="••••••••" icon="lock"/>
          <Alert type="error" msg={err} onClose={()=>setErr("")}/>
          <Btn onClick={submit} full loading={loading}>{isLogin?"Sign In":"Create Account"}</Btn>
        </div>
      </div>
    </div>
  );
};

const PostCard=({post,currentUser,onMessage,onOpen})=>{
  const mode=MODE_META[post.mode]||MODE_META.swap;
  const [liked,setLiked]=useState(post.likedBy?.includes(currentUser.uid)||false);
  const [likeCount,setLikeCount]=useState(post.likes||0);
  
  const toggleLike=async(e)=>{
    e.stopPropagation();
    const newLiked=!liked;
    setLiked(newLiked);
    setLikeCount(c=>newLiked?c+1:c-1);
    try{
      await updateDoc(doc(db,"posts",post.id),{
        likedBy:newLiked?arrayUnion(currentUser.uid):arrayRemove(currentUser.uid),
        likes:increment(newLiked?1:-1)
      });
    }catch(e){
      setLiked(!newLiked);
      setLikeCount(c=>newLiked?c-1:c+1);
    }
  };
  
  return(
    <div className="card" onClick={()=>onOpen(post)} style={{background:C.surface,borderRadius:14,border:`1px solid ${C.border}`,padding:16,marginBottom:12,cursor:"pointer"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <div style={{width:40,height:40,borderRadius:"50%",background:mode.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{mode.icon}</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:600,fontSize:14,color:C.text}}>{post.authorName}</div>
          <div style={{fontSize:12,color:C.textMuted}}>{post.location} · {post.timeAgo}</div>
        </div>
        <span style={{fontSize:11,fontWeight:600,color:mode.color,background:mode.bg,padding:"4px 10px",borderRadius:20}}>{mode.label}</span>
      </div>
      <h3 style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:6}}>{post.title}</h3>
      <p style={{fontSize:14,color:C.textLight,lineHeight:1.6,marginBottom:12}}>{(post.desc||"").slice(0,100)}{(post.desc||"").length>100?"...":""}</p>
      <div style={{display:"flex",alignItems:"center",gap:8,paddingTop:12,borderTop:`1px solid ${C.borderLight}`}}>
        <button onClick={toggleLike} style={{display:"flex",alignItems:"center",gap:6,background:liked?"#FFE8E8":C.bg,border:"none",borderRadius:20,padding:"6px 12px",fontSize:13,color:liked?C.error:C.textMuted,cursor:"pointer",fontWeight:600}}>
          <Icon name="heart" size={16} color={liked?C.error:C.textMuted}/>
          {likeCount}
        </button>
        <button onClick={e=>{e.stopPropagation();onMessage({uid:post.authorId,name:post.authorName});}} style={{display:"flex",alignItems:"center",gap:6,background:C.bg,border:"none",borderRadius:20,padding:"6px 12px",fontSize:13,color:C.textMuted,cursor:"pointer",fontWeight:600}}>
          <Icon name="message" size={16} color={C.textMuted}/>
          Message
        </button>
      </div>
    </div>
  );
};

const Home=({currentUser,onMessage})=>{
  const [posts,setPosts]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [mode,setMode]=useState("all");
  const [open,setOpen]=useState(null);
  
  useEffect(()=>{
    const q=query(collection(db,"posts"),orderBy("createdAt","desc"));
    const unsub=onSnapshot(q,snap=>{
      const data=snap.docs.map(d=>{
        const x=d.data();
        const secs=x.createdAt?.seconds||Date.now()/1000;
        const diff=Math.floor((Date.now()/1000)-secs);
        const timeAgo=diff<60?"now":diff<3600?`${Math.floor(diff/60)}m`:diff<86400?`${Math.floor(diff/3600)}h`:`${Math.floor(diff/86400)}d`;
        return{id:d.id,...x,timeAgo};
      });
      setPosts(data);setLoading(false);
    });
    return()=>unsub();
  },[]);
  
  const filtered=posts.filter(p=>{
    if(mode!=="all"&&p.mode!==mode)return false;
    if(search){const q=search.toLowerCase();return p.title?.toLowerCase().includes(q)||p.desc?.toLowerCase().includes(q);}
    return true;
  });
  
  return(
    <div style={{paddingBottom:80}}>
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:16}}>
        <h2 style={{fontSize:20,fontWeight:700,color:C.text,marginBottom:12}}>Community Feed</h2>
        <div style={{position:"relative"}}>
          <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)"}}><Icon name="search" size={18} color={C.textMuted}/></div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search posts..." style={{width:"100%",padding:"10px 14px 10px 44px",borderRadius:10,border:`1px solid ${C.border}`,fontSize:14,background:C.bg,outline:"none"}}/>
        </div>
      </div>
      <div style={{padding:16}}>
        <div style={{display:"flex",gap:8,marginBottom:16,overflowX:"auto"}}>
          {[{key:"all",label:"All"},{key:"swap",label:"Swap"},{key:"kindness",label:"Kindness"},{key:"emergency",label:"Emergency"}].map(m=>(
            <button key={m.key} onClick={()=>setMode(m.key)} style={{flexShrink:0,padding:"8px 16px",borderRadius:20,border:"none",background:mode===m.key?C.primary:C.bg,color:mode===m.key?"#fff":C.textLight,fontSize:14,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>{m.label}</button>
          ))}
        </div>
        {loading?<Loader/>:filtered.length===0?(
          <div style={{textAlign:"center",padding:"60px 20px",color:C.textMuted}}>
            <div style={{fontSize:48,marginBottom:12}}>📭</div>
            <p style={{fontSize:15,fontWeight:600}}>No posts yet</p>
          </div>
        ):filtered.map(p=><PostCard key={p.id} post={p} currentUser={currentUser} onMessage={onMessage} onOpen={setOpen}/>)}
      </div>
    </div>
  );
};

const Create=({currentUser})=>{
  const [mode,setMode]=useState("swap");
  const [type,setType]=useState("HAVE");
  const [title,setTitle]=useState("");
  const [desc,setDesc]=useState("");
  const [loc,setLoc]=useState("");
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  const [success,setSuccess]=useState(false);
  
  const publish=async()=>{
    if(!title.trim()||desc.length<20||!loc.trim()){setErr("Please fill all fields.");return;}
    setErr("");setLoading(true);
    try{
      await addDoc(collection(db,"posts"),{
        type,mode,title:title.trim(),desc:desc.trim(),location:loc.trim(),
        authorId:currentUser.uid,authorName:currentUser.displayName||"Anonymous",
        emoji:MODE_META[mode].icon,likes:0,likedBy:[],createdAt:serverTimestamp(),
      });
      setSuccess(true);
      setTimeout(()=>{setSuccess(false);setTitle("");setDesc("");setLoc("");},2000);
    }catch(e){setErr("Failed to publish.");}
    setLoading(false);
  };
  
  return(
    <div style={{padding:"16px 16px 100px"}}>
      <h2 style={{fontSize:22,fontWeight:700,color:C.text,marginBottom:20}}>Create Post</h2>
      <div style={{marginBottom:16}}>
        <label style={{display:"block",fontSize:14,fontWeight:600,color:C.text,marginBottom:8}}>Post Type</label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {Object.entries(MODE_META).map(([k,m])=>(
            <button key={k} onClick={()=>setMode(k)} style={{padding:12,borderRadius:10,border:`2px solid ${mode===k?m.color:C.border}`,background:mode===k?m.bg:C.surface,cursor:"pointer",textAlign:"left"}}>
              <div style={{fontSize:24,marginBottom:4}}>{m.icon}</div>
              <div style={{fontSize:14,fontWeight:600,color:mode===k?m.color:C.text}}>{m.label}</div>
            </button>
          ))}
        </div>
      </div>
      <div style={{marginBottom:16}}>
        <label style={{display:"block",fontSize:14,fontWeight:600,color:C.text,marginBottom:8}}>I Have / I Need</label>
        <div style={{display:"flex",gap:10}}>
          {["HAVE","NEED"].map(t=>(
            <button key={t} onClick={()=>setType(t)} style={{flex:1,padding:12,borderRadius:10,border:`2px solid ${type===t?C.primary:C.border}`,background:type===t?"#E8F3EF":C.surface,color:type===t?C.primary:C.textLight,fontWeight:600,cursor:"pointer"}}>I {t}</button>
          ))}
        </div>
      </div>
      <Inp label="Title" value={title} onChange={setTitle} placeholder="What are you offering/looking for?"/>
      <Inp label="Description" value={desc} onChange={setDesc} placeholder="Provide details..." multiline rows={4}/>
      <Inp label="Location" value={loc} onChange={setLoc} placeholder="Your area" icon="location"/>
      <Alert type="error" msg={err} onClose={()=>setErr("")}/>
      <Alert type="success" msg={success?"Post published!":""} onClose={()=>setSuccess(false)}/>
      <Btn onClick={publish} full loading={loading} icon="plus">Publish Post</Btn>
    </div>
  );
};

const Messages=()=>(
  <div style={{padding:"16px 16px 100px"}}>
    <h2 style={{fontSize:22,fontWeight:700,color:C.text,marginBottom:20}}>Messages</h2>
    <div style={{textAlign:"center",padding:"60px 20px",color:C.textMuted}}>
      <Icon name="message" size={48} color={C.textMuted}/>
      <p style={{fontSize:15,fontWeight:600,marginTop:12}}>No messages yet</p>
    </div>
  </div>
);

const SettingsPage=({onBack,currentUser})=>{
  const [settings,setSettings]=useState({notifications:true,location:true,privacy:"public"});
  const [msg,setMsg]=useState("");
  
  useEffect(()=>{
    const load=async()=>{
      const snap=await getDoc(doc(db,"users",currentUser.uid));
      if(snap.exists()&&snap.data().settings)setSettings(snap.data().settings);
    };
    load();
  },[currentUser]);
  
  const save=async()=>{
    await updateDoc(doc(db,"users",currentUser.uid),{settings});
    setMsg("Settings saved!");
    setTimeout(()=>setMsg(""),2000);
  };
  
  return(
    <div style={{paddingBottom:100}}>
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:16,display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer"}}><Icon name="arrowLeft" size={20} color={C.text}/></button>
        <h2 style={{fontSize:20,fontWeight:700,color:C.text}}>Settings</h2>
      </div>
      <div style={{padding:16}}>
        <Alert type="success" msg={msg} onClose={()=>setMsg("")}/>
        <div style={{background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,padding:16,marginBottom:16}}>
          <h3 style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:12}}>Notifications</h3>
          <label style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
            <span style={{fontSize:14,color:C.textLight}}>Push Notifications</span>
            <input type="checkbox" checked={settings.notifications} onChange={e=>setSettings({...settings,notifications:e.target.checked})} style={{width:20,height:20}}/>
          </label>
        </div>
        <div style={{background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,padding:16,marginBottom:16}}>
          <h3 style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:12}}>Location</h3>
          <label style={{display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
            <span style={{fontSize:14,color:C.textLight}}>Show nearby posts</span>
            <input type="checkbox" checked={settings.location} onChange={e=>setSettings({...settings,location:e.target.checked})} style={{width:20,height:20}}/>
          </label>
        </div>
        <div style={{background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,padding:16,marginBottom:16}}>
          <h3 style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:12}}>Privacy</h3>
          <select value={settings.privacy} onChange={e=>setSettings({...settings,privacy:e.target.value})} style={{width:"100%",padding:12,borderRadius:10,border:`1px solid ${C.border}`,fontSize:14,background:C.bg}}>
            <option value="public">Public</option>
            <option value="friends">Friends Only</option>
            <option value="private">Private</option>
          </select>
        </div>
        <Btn onClick={save} full icon="check">Save Settings</Btn>
      </div>
    </div>
  );
};

const ReportPage=({onBack})=>{
  const [reason,setReason]=useState("");
  const [details,setDetails]=useState("");
  const [loading,setLoading]=useState(false);
  const [success,setSuccess]=useState(false);
  
  const submit=async()=>{
    if(!reason||!details){return;}
    setLoading(true);
    try{
      await addDoc(collection(db,"reports"),{reason,details,createdAt:serverTimestamp()});
      setSuccess(true);
      setTimeout(()=>{onBack();},1500);
    }catch(e){}
    setLoading(false);
  };
  
  return(
    <div style={{paddingBottom:100}}>
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:16,display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer"}}><Icon name="arrowLeft" size={20} color={C.text}/></button>
        <h2 style={{fontSize:20,fontWeight:700,color:C.text}}>Report User</h2>
      </div>
      <div style={{padding:16}}>
        <Alert type="success" msg={success?"Report submitted!":""} onClose={()=>setSuccess(false)}/>
        <div style={{marginBottom:16}}>
          <label style={{display:"block",fontSize:14,fontWeight:600,color:C.text,marginBottom:8}}>Reason</label>
          <select value={reason} onChange={e=>setReason(e.target.value)} style={{width:"100%",padding:12,borderRadius:10,border:`1px solid ${C.border}`,fontSize:14,background:C.surface}}>
            <option value="">Select reason</option>
            <option value="spam">Spam</option>
            <option value="harassment">Harassment</option>
            <option value="fraud">Fraud</option>
            <option value="other">Other</option>
          </select>
        </div>
        <Inp label="Details" value={details} onChange={setDetails} placeholder="Please describe the issue..." multiline rows={5}/>
        <Btn onClick={submit} full loading={loading} icon="flag">Submit Report</Btn>
      </div>
    </div>
  );
};

const HelpPage=({onBack})=>{
  const [subject,setSubject]=useState("");
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);
  const [success,setSuccess]=useState(false);
  
  const submit=async()=>{
    if(!subject||!message){return;}
    setLoading(true);
    try{
      await addDoc(collection(db,"support"),{subject,message,createdAt:serverTimestamp()});
      setSuccess(true);
      setTimeout(()=>{onBack();},1500);
    }catch(e){}
    setLoading(false);
  };
  
  return(
    <div style={{paddingBottom:100}}>
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:16,display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer"}}><Icon name="arrowLeft" size={20} color={C.text}/></button>
        <h2 style={{fontSize:20,fontWeight:700,color:C.text}}>Help & Support</h2>
      </div>
      <div style={{padding:16}}>
        <Alert type="success" msg={success?"Message sent! We'll respond within 24 hours.":""} onClose={()=>setSuccess(false)}/>
        <Inp label="Subject" value={subject} onChange={setSubject} placeholder="How can we help?"/>
        <Inp label="Message" value={message} onChange={setMessage} placeholder="Describe your issue or question..." multiline rows={6}/>
        <Btn onClick={submit} full loading={loading} icon="phone">Send Message</Btn>
      </div>
    </div>
  );
};

const Profile=({currentUser,onLogout})=>{
  const [view,setView]=useState("profile");
  const [profile,setProfile]=useState(null);
  const [posts,setPosts]=useState([]);
  
  useEffect(()=>{
    const load=async()=>{
      const snap=await getDoc(doc(db,"users",currentUser.uid));
      if(snap.exists())setProfile(snap.data());
      const q=query(collection(db,"posts"),where("authorId","==",currentUser.uid));
      const psnap=await getDocs(q);
      setPosts(psnap.docs.map(d=>({id:d.id,...d.data()})));
    };
    load();
  },[currentUser]);
  
  if(view==="settings")return <SettingsPage onBack={()=>setView("profile")} currentUser={currentUser}/>;
  if(view==="report")return <ReportPage onBack={()=>setView("profile")}/>;
  if(view==="help")return <HelpPage onBack={()=>setView("profile")}/>;
  
  return(
    <div style={{paddingBottom:100}}>
      <div style={{background:`linear-gradient(135deg,${C.primary},${C.primaryLight})`,padding:"24px 16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
          <div style={{width:64,height:64,borderRadius:"50%",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:700,color:C.primary}}>
            {(currentUser.displayName||"U")[0].toUpperCase()}
          </div>
          <div style={{flex:1}}>
            <h2 style={{fontSize:20,fontWeight:700,color:"#fff",marginBottom:4}}>{currentUser.displayName||"User"}</h2>
            <p style={{fontSize:14,color:"rgba(255,255,255,0.8)"}}>{profile?.location||"Location not set"}</p>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
          {[{label:"Posts",value:posts.length},{label:"Reviews",value:0},{label:"Rating",value:"New"}].map(s=>(
            <div key={s.label} style={{background:"rgba(255,255,255,0.2)",borderRadius:10,padding:12,textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:700,color:"#fff"}}>{s.value}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.8)"}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{padding:16}}>
        {[
          {icon:"settings",label:"Settings",desc:"Notifications, privacy & more",action:()=>setView("settings")},
          {icon:"flag",label:"Report a User",desc:"Report inappropriate behavior",action:()=>setView("report")},
          {icon:"phone",label:"Help & Support",desc:"Get help from our team",action:()=>setView("help")},
        ].map(item=>(
          <div key={item.label} onClick={item.action} className="card" style={{background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,padding:16,marginBottom:12,display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
            <div style={{width:40,height:40,borderRadius:10,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Icon name={item.icon} size={20} color={C.primary}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:600,color:C.text}}>{item.label}</div>
              <div style={{fontSize:13,color:C.textMuted}}>{item.desc}</div>
            </div>
            <Icon name="chevronRight" size={18} color={C.textMuted}/>
          </div>
        ))}
        <Btn onClick={onLogout} full variant="danger" icon="arrowLeft" style={{marginTop:20}}>Sign Out</Btn>
      </div>
    </div>
  );
};

const Nav=({tab,setTab})=>{
  const items=[
    {key:"home",icon:"home",label:"Home"},
    {key:"create",icon:"plus",label:"Create"},
    {key:"messages",icon:"message",label:"Messages"},
    {key:"profile",icon:"user",label:"Profile"},
  ];
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.surface,borderTop:`1px solid ${C.border}`,display:"flex",padding:"8px 0",maxWidth:480,margin:"0 auto"}}>
      {items.map(item=>(
        <button key={item.key} onClick={()=>setTab(item.key)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",padding:"4px 0"}}>
          <Icon name={item.icon} size={22} color={tab===item.key?C.primary:C.textMuted}/>
          <span style={{fontSize:11,fontWeight:tab===item.key?600:500,color:tab===item.key?C.primary:C.textMuted}}>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default function App(){
  const [phase,setPhase]=useState("splash");
  const [tab,setTab]=useState("home");
  const [currentUser,setCurrentUser]=useState(null);
  const [activeChat,setActiveChat]=useState(null);
  
  useEffect(()=>{
    const unsub=onAuthStateChanged(auth,user=>{
      setCurrentUser(user);
      if(user)setPhase("app");
    });
    return()=>unsub();
  },[]);
  
  const handleMessage=useCallback(user=>{setActiveChat(user);setTab("messages");},[]);
  
  return(
    <>
      <GS/>
      {phase==="splash"&&<Splash onDone={()=>setPhase("auth")}/>}
      {phase==="auth"&&!currentUser&&<Auth onLogin={u=>{setCurrentUser(u);setPhase("app");}}/>}
      {currentUser&&(
        <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",background:C.bg}}>
          {tab==="home"&&<Home currentUser={currentUser} onMessage={handleMessage}/>}
          {tab==="create"&&<Create currentUser={currentUser}/>}
          {tab==="messages"&&<Messages/>}
          {tab==="profile"&&<Profile currentUser={currentUser} onLogout={()=>{setCurrentUser(null);setPhase("auth");}}/>}
          <Nav tab={tab} setTab={setTab}/>
        </div>
      )}
    </>
  );
}
