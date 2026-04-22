import React, { useState, useEffect, useRef, useCallback } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from "firebase/auth";
import { collection, addDoc, doc, setDoc, getDoc, getDocs, query, orderBy, onSnapshot, serverTimestamp, where, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";
import { auth, db } from "./firebase";

const THEMES={
  dark:{bg:"#0A0A0A",surface:"#1C1C1E",card:"#2C2C2E",text:"#FFFFFF",textSec:"#EBEBF5",textTer:"#8E8E93",border:"#38383A",primary:"#0A84FF",accent:"#5E5CE6",success:"#30D158",error:"#FF453A"},
  light:{bg:"#F2F2F7",surface:"#FFFFFF",card:"#FFFFFF",text:"#000000",textSec:"#3C3C43",textTer:"#8E8E93",border:"#E5E5EA",primary:"#007AFF",accent:"#5856D6",success:"#34C759",error:"#FF3B30"},
  ocean:{bg:"#001F3F",surface:"#003D5C",card:"#00507A",text:"#FFFFFF",textSec:"#B8D4E8",textTer:"#7FA8C2",border:"#006494",primary:"#00B4D8",accent:"#0096C7",success:"#06FFA5",error:"#FF006E"},
  forest:{bg:"#0D1F13",surface:"#1B4332",card:"#2D6A4F",text:"#FFFFFF",textSec:"#D8F3DC",textTer:"#95D5B2",border:"#40916C",primary:"#52B788",accent:"#74C69D",success:"#B7E4C7",error:"#FF6B6B"},
  sunset:{bg:"#1A0E2E",surface:"#2D1B4E",card:"#3E2C5F",text:"#FFFFFF",textSec:"#E8D5F2",textTer:"#C4A5D9",border:"#5A4575",primary:"#9D4EDD",accent:"#C77DFF",success:"#7AE582",error:"#FF6B9D"},
};

const FONT="'SF Pro Display',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif";

const Icon=({name,size=24,color})=>{
  const paths={
    home:"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    plus:"M12 4v16m8-8H4",
    message:"M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    user:"M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    search:"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    heart:"M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    heartFilled:"M3.172 5.172a4 4 0 015.656 0L12 8.343l3.172-3.171a4 4 0 115.656 5.656L12 19.657l-8.828-8.829a4 4 0 010-5.656z",
    bell:"M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
    send:"M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
    settings:"M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    arrowLeft:"M10 19l-7-7m0 0l7-7m-7 7h18",
    check:"M5 13l4 4L19 7",
    x:"M6 18L18 6M6 6l12 12",
    image:"M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    palette:"M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
    users:"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    userPlus:"M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
    fire:"M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z",
  };
  return(
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color||"currentColor"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]||paths.home}/>
    </svg>
  );
};

const GS=({theme})=>(
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
    body{background:${theme.bg};font-family:${FONT};color:${theme.text};overflow-x:hidden;-webkit-font-smoothing:antialiased;}
    input,textarea,button{font-family:${FONT};}
    ::-webkit-scrollbar{width:0;}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slideDown{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes scaleIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}
    @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
    .fadeIn{animation:fadeIn 0.3s ease;}
    .slideUp{animation:slideUp 0.4s cubic-bezier(0.16,1,0.3,1);}
    .slideDown{animation:slideDown 0.3s cubic-bezier(0.16,1,0.3,1);}
    .scaleIn{animation:scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1);}
  `}</style>
);

const Btn=({children,onClick,variant="primary",full,icon,loading,disabled,theme,style})=>{
  const styles={
    primary:{bg:theme.primary,color:"#FFF"},
    secondary:{bg:theme.card,color:theme.text},
    ghost:{bg:"transparent",color:theme.textSec},
    danger:{bg:theme.error,color:"#FFF"},
  };
  const s=styles[variant];
  return(
    <button onClick={onClick} disabled={disabled||loading} style={{background:s.bg,color:s.color,border:"none",borderRadius:14,padding:"14px 20px",fontSize:16,fontWeight:700,cursor:disabled||loading?"not-allowed":"pointer",opacity:disabled||loading?0.6:1,width:full?"100%":"auto",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"opacity 0.2s,transform 0.1s",transform:"scale(1)",...style}}
      onMouseDown={e=>!disabled&&!loading&&(e.currentTarget.style.transform="scale(0.96)")}
      onMouseUp={e=>!disabled&&!loading&&(e.currentTarget.style.transform="scale(1)")}
      onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
    >
      {loading?<div style={{width:20,height:20,border:"3px solid rgba(255,255,255,0.3)",borderTopColor:"#FFF",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>:icon?<Icon name={icon} size={20} color={s.color}/>:null}
      {children}
    </button>
  );
};

const Inp=({label,type="text",value,onChange,placeholder,icon,multiline,rows=4,theme})=>(
  <div style={{marginBottom:16}}>
    {label&&<label style={{display:"block",fontSize:14,fontWeight:600,color:theme.textSec,marginBottom:8}}>{label}</label>}
    <div style={{position:"relative"}}>
      {icon&&<div style={{position:"absolute",left:16,top:multiline?"16px":"50%",transform:multiline?"none":"translateY(-50%)",pointerEvents:"none"}}><Icon name={icon} size={20} color={theme.textTer}/></div>}
      {multiline
        ?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{width:"100%",padding:icon?"14px 16px 14px 48px":"14px 16px",borderRadius:12,border:`2px solid ${theme.border}`,fontSize:16,color:theme.text,background:theme.surface,outline:"none",resize:"vertical"}}/>
        :<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",padding:icon?"14px 16px 14px 48px":"14px 16px",borderRadius:12,border:`2px solid ${theme.border}`,fontSize:16,color:theme.text,background:theme.surface,outline:"none"}}/>
      }
    </div>
  </div>
);

const Alert=({type,msg,theme})=>{
  if(!msg)return null;
  const colors={success:theme.success,error:theme.error,info:theme.primary};
  const c=colors[type]||colors.info;
  return(
    <div className="slideDown" style={{background:`${c}15`,border:`2px solid ${c}`,borderRadius:12,padding:"14px 16px",fontSize:15,color:c,marginBottom:16,fontWeight:600}}>
      {msg}
    </div>
  );
};

const Loader=()=>(
  <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh"}}>
    <div style={{width:48,height:48,border:"4px solid rgba(255,255,255,0.1)",borderTopColor:"rgba(255,255,255,0.8)",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
  </div>
);

const Splash=({onDone})=>{
  useEffect(()=>{const t=setTimeout(onDone,2500);return()=>clearTimeout(t);},[onDone]);
  return(
    <div style={{position:"fixed",inset:0,background:"linear-gradient(135deg,#667eea 0%,#764ba2 100%)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:24}}>
      <div style={{fontSize:80,animation:"pulse 2s ease-in-out infinite"}}>🤝</div>
      <h1 style={{color:"#FFF",fontSize:48,fontWeight:900,letterSpacing:-2}}>Exvora</h1>
      <p style={{color:"rgba(255,255,255,0.8)",fontSize:18,fontWeight:500}}>Exchange · Support · Survive</p>
    </div>
  );
};

const Auth=({onLogin,theme})=>{
  const [isLogin,setIsLogin]=useState(true);
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState("");
  
  const submit=async()=>{
    setErr("");
    if(!isLogin&&!name.trim()){setErr("Please enter your name");return;}
    if(!email.includes("@")){setErr("Invalid email");return;}
    if(pass.length<6){setErr("Password must be 6+ characters");return;}
    setLoading(true);
    try{
      if(isLogin){
        const cred=await signInWithEmailAndPassword(auth,email,pass);
        onLogin(cred.user);
      }else{
        const cred=await createUserWithEmailAndPassword(auth,email,pass);
        await updateProfile(cred.user,{displayName:name.trim()});
        await setDoc(doc(db,"users",cred.user.uid),{name:name.trim(),email,bio:"",location:"",followers:[],following:[],verified:false,theme:"dark",wallpaper:null,settings:{notifications:true,location:true,privacy:"public"},createdAt:serverTimestamp()});
        onLogin(cred.user);
      }
    }catch(e){
      setErr(e.code==="auth/email-already-in-use"?"Email already registered":e.code==="auth/user-not-found"?"No account found":e.code==="auth/wrong-password"||e.code==="auth/invalid-credential"?"Incorrect credentials":"Error occurred");
    }
    setLoading(false);
  };
  
  return(
    <div style={{minHeight:"100vh",background:theme.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{width:"100%",maxWidth:420}}>
        <div className="slideDown" style={{textAlign:"center",marginBottom:40}}>
          <div style={{fontSize:64,marginBottom:16}}>🤝</div>
          <h1 style={{fontSize:36,fontWeight:900,color:theme.text,marginBottom:8}}>Exvora</h1>
          <p style={{fontSize:16,color:theme.textTer}}>Join the community</p>
        </div>
        <div className="slideUp" style={{background:theme.surface,borderRadius:20,padding:28,border:`1px solid ${theme.border}`}}>
          <div style={{display:"flex",background:theme.card,borderRadius:12,padding:4,marginBottom:24}}>
            <button onClick={()=>setIsLogin(true)} style={{flex:1,padding:12,borderRadius:10,border:"none",background:isLogin?theme.primary:"transparent",color:isLogin?"#FFF":theme.textSec,fontWeight:700,cursor:"pointer",transition:"all 0.2s"}}>Sign In</button>
            <button onClick={()=>setIsLogin(false)} style={{flex:1,padding:12,borderRadius:10,border:"none",background:!isLogin?theme.primary:"transparent",color:!isLogin?"#FFF":theme.textSec,fontWeight:700,cursor:"pointer",transition:"all 0.2s"}}>Sign Up</button>
          </div>
          {!isLogin&&<Inp label="Full Name" value={name} onChange={setName} placeholder="Your name" icon="user" theme={theme}/>}
          <Inp label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" icon="message" theme={theme}/>
          <Inp label="Password" type="password" value={pass} onChange={setPass} placeholder="••••••••" icon="fire" theme={theme}/>
          <Alert type="error" msg={err} theme={theme}/>
          <Btn onClick={submit} full loading={loading} theme={theme}>{isLogin?"Sign In":"Create Account"}</Btn>
        </div>
      </div>
    </div>
  );
};

const UserCard=({user,currentUser,onFollow,theme})=>{
  const [following,setFollowing]=useState(user.followers?.includes(currentUser.uid)||false);
  
  const toggleFollow=async()=>{
    const newFollowing=!following;
    setFollowing(newFollowing);
    onFollow(user.id,newFollowing);
  };
  
  return(
    <div style={{background:theme.card,borderRadius:16,border:`1px solid ${theme.border}`,padding:16,display:"flex",alignItems:"center",gap:12}}>
      <div style={{width:48,height:48,borderRadius:"50%",background:`linear-gradient(135deg,${theme.primary},${theme.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,color:"#FFF"}}>
        {(user.name||"U")[0].toUpperCase()}
      </div>
      <div style={{flex:1}}>
        <div style={{fontSize:16,fontWeight:700,color:theme.text}}>{user.name}</div>
        <div style={{fontSize:13,color:theme.textTer}}>{user.followers?.length||0} followers</div>
      </div>
      {user.id!==currentUser.uid&&(
        <button onClick={toggleFollow} style={{background:following?"transparent":theme.primary,color:following?theme.primary:"#FFF",border:following?`2px solid ${theme.primary}`:"none",borderRadius:20,padding:"8px 16px",fontSize:14,fontWeight:700,cursor:"pointer"}}>
          {following?"Following":"Follow"}
        </button>
      )}
    </div>
  );
};

const PostCard=({post,currentUser,onLike,onMessage,theme})=>{
  const [liked,setLiked]=useState(post.likedBy?.includes(currentUser.uid)||false);
  const [likeCount,setLikeCount]=useState(post.likes||0);
  
  const toggleLike=async(e)=>{
    e.stopPropagation();
    const newLiked=!liked;
    setLiked(newLiked);
    setLikeCount(c=>newLiked?c+1:c-1);
    onLike(post.id,newLiked);
  };
  
  return(
    <div className="slideUp" style={{background:theme.card,borderRadius:18,border:`1px solid ${theme.border}`,padding:18,marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
        <div style={{width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,${theme.primary},${theme.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#FFF"}}>
          {(post.authorName||"U")[0].toUpperCase()}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontWeight:700,color:theme.text}}>{post.authorName}</div>
          <div style={{fontSize:13,color:theme.textTer}}>{post.location} · {post.timeAgo}</div>
        </div>
      </div>
      <h3 style={{fontSize:17,fontWeight:700,color:theme.text,marginBottom:8,lineHeight:1.4}}>{post.title}</h3>
      <p style={{fontSize:15,color:theme.textSec,lineHeight:1.6,marginBottom:14}}>{post.desc}</p>
      <div style={{display:"flex",alignItems:"center",gap:12,paddingTop:14,borderTop:`1px solid ${theme.border}`}}>
        <button onClick={toggleLike} style={{display:"flex",alignItems:"center",gap:6,background:"transparent",border:"none",borderRadius:20,padding:"8px 14px",cursor:"pointer",transition:"all 0.2s"}}>
          <Icon name={liked?"heartFilled":"heart"} size={20} color={liked?theme.error:theme.textTer}/>
          <span style={{fontSize:15,fontWeight:600,color:liked?theme.error:theme.textSec}}>{likeCount}</span>
        </button>
        <button onClick={e=>{e.stopPropagation();onMessage({uid:post.authorId,name:post.authorName});}} style={{display:"flex",alignItems:"center",gap:6,background:"transparent",border:"none",borderRadius:20,padding:"8px 14px",cursor:"pointer"}}>
          <Icon name="message" size={20} color={theme.textTer}/>
          <span style={{fontSize:15,fontWeight:600,color:theme.textSec}}>Message</span>
        </button>
      </div>
    </div>
  );
};

const Home=({currentUser,onMessage,theme})=>{
  const [posts,setPosts]=useState([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  
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
  
  const onLike=async(postId,liked)=>{
    try{
      await updateDoc(doc(db,"posts",postId),{
        likedBy:liked?arrayUnion(currentUser.uid):arrayRemove(currentUser.uid),
        likes:increment(liked?1:-1)
      });
    }catch(e){}
  };
  
  const filtered=posts.filter(p=>search?p.title?.toLowerCase().includes(search.toLowerCase())||p.desc?.toLowerCase().includes(search.toLowerCase()):true);
  
  return(
    <div style={{paddingBottom:90}}>
      <div style={{background:theme.surface,borderBottom:`1px solid ${theme.border}`,padding:16,position:"sticky",top:0,zIndex:100}}>
        <h2 style={{fontSize:24,fontWeight:900,color:theme.text,marginBottom:14}}>Feed</h2>
        <div style={{position:"relative"}}>
          <div style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)"}}><Icon name="search" size={20} color={theme.textTer}/></div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search posts..." style={{width:"100%",padding:"12px 16px 12px 48px",borderRadius:12,border:`1px solid ${theme.border}`,fontSize:15,background:theme.card,color:theme.text,outline:"none"}}/>
        </div>
      </div>
      <div style={{padding:16}}>
        {loading?<Loader/>:filtered.length===0?(
          <div style={{textAlign:"center",padding:"80px 20px",color:theme.textTer}}>
            <div style={{fontSize:56,marginBottom:16}}>📭</div>
            <p style={{fontSize:17,fontWeight:600}}>No posts yet</p>
          </div>
        ):filtered.map(p=><PostCard key={p.id} post={p} currentUser={currentUser} onLike={onLike} onMessage={onMessage} theme={theme}/>)}
      </div>
    </div>
  );
};

const Create=({currentUser,theme})=>{
  const [title,setTitle]=useState("");
  const [desc,setDesc]=useState("");
  const [loc,setLoc]=useState("");
  const [loading,setLoading]=useState(false);
  const [success,setSuccess]=useState(false);
  
  const publish=async()=>{
    if(!title.trim()||desc.length<10||!loc.trim())return;
    setLoading(true);
    try{
      await addDoc(collection(db,"posts"),{
        title:title.trim(),desc:desc.trim(),location:loc.trim(),
        authorId:currentUser.uid,authorName:currentUser.displayName||"Anonymous",
        likes:0,likedBy:[],createdAt:serverTimestamp(),
      });
      setSuccess(true);
      setTimeout(()=>{setSuccess(false);setTitle("");setDesc("");setLoc("");},2000);
    }catch(e){}
    setLoading(false);
  };
  
  return(
    <div style={{padding:"16px 16px 100px"}}>
      <h2 style={{fontSize:28,fontWeight:900,color:theme.text,marginBottom:24}}>Create Post</h2>
      <Inp label="Title" value={title} onChange={setTitle} placeholder="What's on your mind?" theme={theme}/>
      <Inp label="Description" value={desc} onChange={setDesc} placeholder="Share your thoughts..." multiline rows={6} theme={theme}/>
      <Inp label="Location" value={loc} onChange={setLoc} placeholder="Your area" icon="fire" theme={theme}/>
      <Alert type="success" msg={success?"Post published!":""} theme={theme}/>
      <Btn onClick={publish} full loading={loading} icon="plus" theme={theme}>Publish Post</Btn>
    </div>
  );
};

const Messages=({currentUser,activeChat,setActiveChat,theme})=>{
  const [msgs,setMsgs]=useState([]);
  const [input,setInput]=useState("");
  const [threads,setThreads]=useState([]);
  const [loading,setLoading]=useState(true);
  const endRef=useRef(null);
  const chatId=activeChat?[currentUser.uid,activeChat.uid].sort().join("_"):null;
  
  useEffect(()=>{
    if(!activeChat||!chatId)return;
    const q=query(collection(db,"chats",chatId,"messages"),orderBy("createdAt","asc"));
    const unsub=onSnapshot(q,snap=>{setMsgs(snap.docs.map(d=>({id:d.id,...d.data()})));});
    return()=>unsub();
  },[chatId,activeChat]);
  
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  
  useEffect(()=>{
    const load=async()=>{
      try{
        const snap=await getDocs(collection(db,"chats"));
        setThreads(snap.docs.filter(d=>d.id.includes(currentUser.uid)).map(d=>({id:d.id,...d.data()})));
      }catch(e){}
      setLoading(false);
    };
    if(!activeChat)load();
  },[activeChat,currentUser.uid]);
  
  const send=async()=>{
    if(!input.trim()||!activeChat||!chatId)return;
    const text=input.trim();setInput("");
    try{
      await addDoc(collection(db,"chats",chatId,"messages"),{
        text,from:currentUser.uid,fromName:currentUser.displayName||"You",
        to:activeChat.uid,createdAt:serverTimestamp(),
      });
      await setDoc(doc(db,"chats",chatId),{
        participants:[currentUser.uid,activeChat.uid],
        participantNames:{[currentUser.uid]:currentUser.displayName,[activeChat.uid]:activeChat.name},
        lastMessage:text,lastMessageTime:serverTimestamp(),
      },{merge:true});
    }catch(e){setInput(text);}
  };
  
  if(activeChat)return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh"}}>
      <div style={{background:theme.surface,borderBottom:`1px solid ${theme.border}`,padding:16,display:"flex",alignItems:"center",gap:12}}>
        <button onClick={()=>{setActiveChat(null);setMsgs([]);}} style={{background:"none",border:"none",cursor:"pointer"}}><Icon name="arrowLeft" size={24} color={theme.text}/></button>
        <div style={{width:40,height:40,borderRadius:"50%",background:`linear-gradient(135deg,${theme.primary},${theme.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#FFF"}}>
          {(activeChat.name||"U")[0].toUpperCase()}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:16,fontWeight:700,color:theme.text}}>{activeChat.name}</div>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:16,background:theme.bg}}>
        {msgs.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:theme.textTer}}><Icon name="message" size={48} color={theme.textTer}/><p style={{fontSize:15,fontWeight:600,marginTop:12}}>Start chatting!</p></div>}
        {msgs.map(m=>{
          const isMe=m.from===currentUser.uid;
          return(
            <div key={m.id} style={{display:"flex",justifyContent:isMe?"flex-end":"flex-start",marginBottom:12}}>
              <div style={{maxWidth:"75%",padding:"12px 16px",borderRadius:isMe?"18px 18px 4px 18px":"18px 18px 18px 4px",background:isMe?theme.primary:theme.card,color:isMe?"#FFF":theme.text,fontSize:15,lineHeight:1.5}}>
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={endRef}/>
      </div>
      <div style={{background:theme.surface,borderTop:`1px solid ${theme.border}`,padding:16,display:"flex",gap:12}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Type a message..." style={{flex:1,padding:"12px 16px",borderRadius:24,border:`1px solid ${theme.border}`,fontSize:15,background:theme.card,color:theme.text,outline:"none"}}/>
        <button onClick={send} style={{width:48,height:48,borderRadius:"50%",background:theme.primary,border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Icon name="send" size={20} color="#FFF"/></button>
      </div>
    </div>
  );
  
  return(
    <div style={{paddingBottom:90}}>
      <div style={{background:theme.surface,borderBottom:`1px solid ${theme.border}`,padding:16}}>
        <h2 style={{fontSize:24,fontWeight:900,color:theme.text}}>Messages</h2>
      </div>
      {loading?<Loader/>:threads.length===0?(
        <div style={{textAlign:"center",padding:"80px 20px",color:theme.textTer}}>
          <Icon name="message" size={56} color={theme.textTer}/>
          <p style={{fontSize:17,fontWeight:600,marginTop:16}}>No messages yet</p>
        </div>
      ):threads.map(t=>{
        const otherId=t.participants?.find(p=>p!==currentUser.uid);
        const otherName=t.participantNames?.[otherId]||"User";
        return(
          <div key={t.id} onClick={()=>setActiveChat({uid:otherId,name:otherName})} className="slideUp" style={{background:theme.card,borderBottom:`1px solid ${theme.border}`,padding:16,display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
            <div style={{width:48,height:48,borderRadius:"50%",background:`linear-gradient(135deg,${theme.primary},${theme.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,color:"#FFF"}}>
              {(otherName||"U")[0].toUpperCase()}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:16,fontWeight:700,color:theme.text}}>{otherName}</div>
              <div style={{fontSize:14,color:theme.textTer,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.lastMessage||"Start chatting"}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ThemeSelector=({onBack,currentTheme,onSelect,theme})=>(
  <div style={{paddingBottom:100}}>
    <div style={{background:theme.surface,borderBottom:`1px solid ${theme.border}`,padding:16,display:"flex",alignItems:"center",gap:12}}>
      <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer"}}><Icon name="arrowLeft" size={24} color={theme.text}/></button>
      <h2 style={{fontSize:20,fontWeight:900,color:theme.text}}>Choose Theme</h2>
    </div>
    <div style={{padding:16}}>
      {Object.entries(THEMES).map(([key,t])=>(
        <div key={key} onClick={()=>onSelect(key)} style={{background:t.surface,border:`3px solid ${currentTheme===key?theme.primary:t.border}`,borderRadius:16,padding:20,marginBottom:14,cursor:"pointer",transition:"all 0.2s"}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <div style={{width:48,height:48,borderRadius:12,background:t.primary}}/>
            <div style={{flex:1}}>
              <div style={{fontSize:18,fontWeight:700,color:t.text,textTransform:"capitalize"}}>{key}</div>
              <div style={{fontSize:14,color:t.textTer}}>Beautiful {key} theme</div>
            </div>
            {currentTheme===key&&<Icon name="check" size={24} color={theme.primary}/>}
          </div>
          <div style={{display:"flex",gap:8}}>
            {[t.primary,t.accent,t.success,t.error].map((c,i)=><div key={i} style={{width:32,height:32,borderRadius:8,background:c}}/>)}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const WallpaperSelector=({onBack,theme})=>{
  const [uploading,setUploading]=useState(false);
  
  const handleUpload=e=>{
    const file=e.target.files?.[0];
    if(!file)return;
    setUploading(true);
    const reader=new FileReader();
    reader.onload=async(ev)=>{
      // In production, upload to Firebase Storage
      // For now, just show success
      alert("Wallpaper upload feature coming soon!");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };
  
  return(
    <div style={{paddingBottom:100}}>
      <div style={{background:theme.surface,borderBottom:`1px solid ${theme.border}`,padding:16,display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer"}}><Icon name="arrowLeft" size={24} color={theme.text}/></button>
        <h2 style={{fontSize:20,fontWeight:900,color:theme.text}}>Wallpaper</h2>
      </div>
      <div style={{padding:16}}>
        <div style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:16,padding:24,textAlign:"center"}}>
          <Icon name="image" size={56} color={theme.textTer}/>
          <h3 style={{fontSize:18,fontWeight:700,color:theme.text,marginTop:16,marginBottom:8}}>Custom Wallpaper</h3>
          <p style={{fontSize:14,color:theme.textTer,marginBottom:20}}>Upload your own background image</p>
          <input type="file" accept="image/*" onChange={handleUpload} style={{display:"none"}} id="wallpaper"/>
          <label htmlFor="wallpaper">
            <Btn as="span" icon="image" loading={uploading} theme={theme}>Choose Image</Btn>
          </label>
        </div>
      </div>
    </div>
  );
};

const Profile=({currentUser,onLogout,theme,onThemeChange})=>{
  const [view,setView]=useState("main");
  const [profile,setProfile]=useState(null);
  const [users,setUsers]=useState([]);
  
  useEffect(()=>{
    const load=async()=>{
      const snap=await getDoc(doc(db,"users",currentUser.uid));
      if(snap.exists())setProfile(snap.data());
      const usersSnap=await getDocs(collection(db,"users"));
      setUsers(usersSnap.docs.map(d=>({id:d.id,...d.data()})).filter(u=>u.id!==currentUser.uid));
    };
    load();
  },[currentUser]);
  
  const onFollow=async(userId,follow)=>{
    try{
      await updateDoc(doc(db,"users",userId),{
        followers:follow?arrayUnion(currentUser.uid):arrayRemove(currentUser.uid)
      });
      await updateDoc(doc(db,"users",currentUser.uid),{
        following:follow?arrayUnion(userId):arrayRemove(userId)
      });
    }catch(e){}
  };
  
  if(view==="theme")return <ThemeSelector onBack={()=>setView("main")} currentTheme={profile?.theme||"dark"} onSelect={async(t)=>{await updateDoc(doc(db,"users",currentUser.uid),{theme:t});onThemeChange(t);setView("main");}} theme={theme}/>;
  if(view==="wallpaper")return <WallpaperSelector onBack={()=>setView("main")} theme={theme}/>;
  if(view==="users")return(
    <div style={{paddingBottom:100}}>
      <div style={{background:theme.surface,borderBottom:`1px solid ${theme.border}`,padding:16,display:"flex",alignItems:"center",gap:12}}>
        <button onClick={()=>setView("main")} style={{background:"none",border:"none",cursor:"pointer"}}><Icon name="arrowLeft" size={24} color={theme.text}/></button>
        <h2 style={{fontSize:20,fontWeight:900,color:theme.text}}>Discover People</h2>
      </div>
      <div style={{padding:16}}>
        {users.map(u=><div key={u.id} className="slideUp" style={{marginBottom:12}}><UserCard user={u} currentUser={currentUser} onFollow={onFollow} theme={theme}/></div>)}
      </div>
    </div>
  );
  
  return(
    <div style={{paddingBottom:100}}>
      <div style={{background:`linear-gradient(135deg,${theme.primary},${theme.accent})`,padding:32,borderRadius:"0 0 32px 32px"}}>
        <div style={{textAlign:"center"}}>
          <div style={{width:96,height:96,borderRadius:"50%",background:"#FFF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,fontWeight:900,color:theme.primary,margin:"0 auto 16px"}}>
            {(currentUser.displayName||"U")[0].toUpperCase()}
          </div>
          <h2 style={{fontSize:24,fontWeight:900,color:"#FFF",marginBottom:8}}>{currentUser.displayName}</h2>
          <p style={{fontSize:15,color:"rgba(255,255,255,0.8)"}}>{profile?.email||currentUser.email}</p>
          <div style={{display:"flex",justifyContent:"center",gap:24,marginTop:20}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:24,fontWeight:900,color:"#FFF"}}>{profile?.followers?.length||0}</div>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.7)"}}>Followers</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:24,fontWeight:900,color:"#FFF"}}>{profile?.following?.length||0}</div>
              <div style={{fontSize:13,color:"rgba(255,255,255,0.7)"}}>Following</div>
            </div>
          </div>
        </div>
      </div>
      <div style={{padding:16}}>
        {[
          {icon:"users",label:"Discover People",action:()=>setView("users")},
          {icon:"palette",label:"Change Theme",action:()=>setView("theme")},
          {icon:"image",label:"Wallpaper",action:()=>setView("wallpaper")},
          {icon:"settings",label:"Settings",action:()=>{}},
        ].map((item,i)=>(
          <div key={i} onClick={item.action} className="slideUp" style={{background:theme.card,border:`1px solid ${theme.border}`,borderRadius:16,padding:18,marginBottom:12,display:"flex",alignItems:"center",gap:14,cursor:"pointer",animationDelay:`${i*0.05}s`}}>
            <div style={{width:48,height:48,borderRadius:12,background:`${theme.primary}15`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Icon name={item.icon} size={24} color={theme.primary}/>
            </div>
            <div style={{flex:1,fontSize:16,fontWeight:700,color:theme.text}}>{item.label}</div>
            <Icon name="arrowLeft" size={20} color={theme.textTer} style={{transform:"rotate(180deg)"}}/>
          </div>
        ))}
        <Btn onClick={onLogout} full variant="danger" icon="arrowLeft" theme={theme} style={{marginTop:24}}>Sign Out</Btn>
      </div>
    </div>
  );
};

const Nav=({tab,setTab,theme})=>{
  const items=[
    {key:"home",icon:"home",label:"Home"},
    {key:"create",icon:"plus",label:"Create"},
    {key:"messages",icon:"message",label:"Messages"},
    {key:"profile",icon:"user",label:"Profile"},
  ];
  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:theme.surface,borderTop:`1px solid ${theme.border}`,display:"flex",padding:"8px 0",maxWidth:480,margin:"0 auto",zIndex:1000}}>
      {items.map(item=>(
        <button key={item.key} onClick={()=>setTab(item.key)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",padding:"6px 0",transition:"all 0.2s"}}>
          <Icon name={item.icon} size={24} color={tab===item.key?theme.primary:theme.textTer}/>
          <span style={{fontSize:11,fontWeight:tab===item.key?700:500,color:tab===item.key?theme.primary:theme.textTer}}>{item.label}</span>
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
  const [themeName,setThemeName]=useState("dark");
  const theme=THEMES[themeName];
  
  useEffect(()=>{
    const unsub=onAuthStateChanged(auth,async user=>{
      setCurrentUser(user);
      if(user){
        const snap=await getDoc(doc(db,"users",user.uid));
        if(snap.exists()&&snap.data().theme)setThemeName(snap.data().theme);
        setPhase("app");
      }
    });
    return()=>unsub();
  },[]);
  
  const handleMessage=useCallback(user=>{setActiveChat(user);setTab("messages");},[]);
  
  return(
    <>
      <GS theme={theme}/>
      {phase==="splash"&&<Splash onDone={()=>setPhase("auth")}/>}
      {phase==="auth"&&!currentUser&&<Auth onLogin={u=>{setCurrentUser(u);setPhase("app");}} theme={theme}/>}
      {currentUser&&(
        <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",background:theme.bg}}>
          {tab==="home"&&<Home currentUser={currentUser} onMessage={handleMessage} theme={theme}/>}
          {tab==="create"&&<Create currentUser={currentUser} theme={theme}/>}
          {tab==="messages"&&<Messages currentUser={currentUser} activeChat={activeChat} setActiveChat={setActiveChat} theme={theme}/>}
          {tab==="profile"&&<Profile currentUser={currentUser} onLogout={()=>{setCurrentUser(null);setPhase("auth");}} theme={theme} onThemeChange={setThemeName}/>}
          <Nav tab={tab} setTab={setTab} theme={theme}/>
        </div>
      )}
    </>
  );
}
