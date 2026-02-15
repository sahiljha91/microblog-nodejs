const express= require('express');
const app= express();
const userModel= require("./models/user")
const postModel= require("./models/post")
const cookieParser=require('cookie-parser')
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken');
const user = require('./models/user');

app.set('view engine','ejs');
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.get('/',(req,res)=>{
    res.render('index');
})
app.get('/login',(req,res)=>{
    res.render('login')
})

app.post('/register',async(req,res)=>{
   let{email,password,username,age,name}=req.body;//we have done this because we have to get the data from the form which is in the body of the request or wo sb apne nam kvariable m khudba khud save hogye ye krne se
        let user=await userModel.findOne({email:email})
        if(user)return res.status(500).send('user already exists')

            bcrypt.genSalt(10,(err,salt)=>{
                bcrypt.hash(password,salt,async(err,hash)=>{
                  let user=  userModel.create({
                        username,
                        email,age,name,
                        password:hash,
                    })
                 let token=   jwt.sign({email: email,userid:user._id},"shhhh");
res.cookie('token',token)
res.send('registered')

            })
           })
        })

        app.get('/profile',isLoggedIn,async(req,res)=>{
            let user=await userModel.findOne({email:req.user.email}).populate('posts');//this is done to populate the post of the user in the profile page  
            res.render("profile",{user});
        })
        app.get('/like/:id',isLoggedIn,async(req,res)=>{
            let post=await postModel.findOne({_id:req.params.id}).populate('user');//ye isliye kiya hai kyuki hume post ke user ki information chahiye thi like karne ke liye or post ke user ki information hume mil rhi hai postModel.findOne({_id:req.params.id}).populate('user') se kyuki humne post ke schema m user ka reference diya hai  

          if(post.like.indexOf(req.user.userid)===-1) {//ye isliye kiya hai kyuki hume check karna tha ki user ne like kiya hai ya nahi agar user ne like kiya hai to uska index 0 se start hoga aur agar user ne like nahi kiya hai to uska index -1 hoga isliye humne ye condition lagayi hai         
            post.like.push(req.user.userid);
          }
          else{
            post.like.splice(post.like.indexOf(req.user.userid),1);
          }
            
           await post.save();
            
            res.redirect('/profile');
        })
        app.get('/edit/:id',isLoggedIn,async(req,res)=>{
            let post=await postModel.findOne({_id:req.params.id}).populate('user');
            res.render('edit',{post});
        })
        app.get('/delete/:id',isLoggedIn,async(req,res)=>{
            let post=await postModel.deleteOne({_id:req.params.id});
            res.redirect('/profile');
        })

        app.post('/update/:id',isLoggedIn,async(req,res)=>{
            let post=await postModel.findOneAndUpdate({_id:req.params.id},{content:req.body.content});//ye isliye kiya hai kyuki hume post ke content ko update karna tha or post ke content ko update karne ke liye hume post ki id chahiye thi jo humko req.params.id se mil rhi hai kyuki humne route m id pass kiya hai or post ke content ko update karne ke liye hume req.body.content se mil rhi hai kyuki humne form m content ka name content diya hai               
            res.redirect('/profile');
        
        })

        app.post('/post',isLoggedIn,async(req,res)=>{
            let user=await userModel.findOne({email:req.user.email})
            let{content}=req.body;
            let posts= await postModel.create({
                user:user._id,// humne schema m kha tha user ki id chahiye or user ki id humko mil rhi hai user._id se kyuki humne user ko find kr liya hai email se jo upr find kri hai
                content:content
            });
            user.posts.push(posts._id); //ye isliye kiya hai kyuki humne user ke schema m posts ka array banaya hai jisme hum post ki id store krte hai or post ki id hume mil rhi hai posts._id se kyuki humne post ko create kr liya hai                              
            await user.save();
            res.redirect('/profile');
        })

        app.get('/logout',(req,res)=>{
            res.cookie('token','').redirect('/login')
        })



   app.post('/login',async(req,res)=>{
let {email,password}=req.body;
let user=await userModel.findOne({email:email})
if(!user){return res.status(500).send("something went wrong")}
bcrypt.compare(password,user.password,(err,result)=>{ ///passowrd jo already hai wo "user.passwrd" yani mongo m user ke andr passwordd mai store hai  baki "password" is for the password which user is entering in form "

    if(result){
        let token=   jwt.sign({email: email,userid:user._id},"shhhh");
        res.cookie('token',token)  
        res.status(200).redirect("/profile")
        }
        else res.send("invalid credentials")         ;
})
             
   })  
   
   function isLoggedIn(req,res,next){
    if(req.cookies.token === "")res.redirect("/login")///this is done to check if the user is logged in or not
    else{
        let data=jwt.verify(req.cookies.token,"shhhh");//this is done to verify the token for th euser who is already registered
        req.user=data 
    next();   } //this is done to store the data of the user int the req.user
        
   }
   
   
   app.listen(3000,()=>{
   
    console.log('sserver is created')
})