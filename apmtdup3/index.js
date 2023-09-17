//jshint esversion:6
import dotenv from 'dotenv';
dotenv.config();
import  express  from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import  nodemailer  from 'nodemailer';
import  Mailgen  from 'mailgen';
import ejs from "ejs";
import session from 'express-session';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import passportLocalMongoose from 'passport-local-mongoose';
import request from "request";
import https from "https";
//import path from "path"
//const __dirname = path.resolve();


mongoose.set('strictQuery', true);

//process.env.API_KEY,


const app = express();
console.log(new Date());
//console.log(process.env.API_KEY);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));

app.use(session({
//  secret: 'Our little secret.',
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  //cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.CONNECTIONSTRING);
//mongoose.set("useCreateIndex",true);

const userSchema = new mongoose.Schema ({
  email : String,
  password : String,
  uname_ : String,
  userEmail_ :String,
  purpose_ :String, //array
  faculty_ :String, //array
  date_ : Date,
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User" , userSchema);
const Facultyd = new mongoose.model("Facultyd" , userSchema);

passport.use('userLocal', new LocalStrategy(User.authenticate()));
 passport.use('facultyLocal', new LocalStrategy(Facultyd.authenticate()));

//passport.use(User.createStrategy());
//passport.serializeUser(User.serializeUser());
//passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  if(user!=null)
    done(null,user);
});


app.get("/",function(req,res){
  res.render("home");
});

app.get("/shome",function(req,res){
  res.render("sthome");
});

app.get("/sLog",function(req,res){
  res.render("slogin");
});
app.get("/fLog",function(req,res){
  res.render("flogin");
});
app.get("/sreg",function(req,res){
  res.render("stregister");
});
app.get("/freg",function(req,res){
  res.render("facregister");
});

app.get("/fdshd", (req, res,next) => {
  console.log("into dashboard");
passport.authenticate('facultyLocal', {}, (err, user, info) => {
  if(!err){
    User.find({"userEmail_": {$ne: null}}, function(err, foundUsers){
       if(err){
         console.log(err);
       }else{
         if(foundUsers) {
           console.log("foundUsers value is:" +foundUsers);
           res.render("fdashboard", {apmtsBooked: foundUsers});
         }
       }
    });
  }     else{
    res.redirect("/sLog");
  }
})(req, res, next);
});


app.get("/dashboard", (req, res,next) => {
  console.log("into dashboard");
passport.authenticate('userLocal', {}, (err, user, info) => {
  if(!err){
    User.find({"userEmail_": {$ne: null}}, function(err, foundUsers){
       if(err){
         console.log(err);
       }else{
         if(foundUsers) {
           console.log("foundUsers value is:" +foundUsers);
           res.render("dshbd", {apmtsBooked: foundUsers});
         }
       }
    });
  }     else{
    res.redirect("/sLog");
  }
})(req, res, next);
});

app.get('/apmt', (req, res, next) => {
   passport.authenticate('userLocal', {}, (err, user, info) => {
     if(!err){
       Facultyd.find({"uname_": {$ne: null}}, function(err, foundUsers){
          if(err){
            console.log(err);
          }else{
            if(foundUsers) {
              res.render("apmt", {faculties: foundUsers});
            }
          }
       });
     }
     else{ res.redirect("/sLog"); }
    })(req, res, next);
});

app.get('/facavab', (req, res, next) => {
  passport.authenticate('userLocal', {}, (err, user, info) => {
    if(!err){
      Facultyd.find({"uname_": {$ne: null}}, function(err, foundUsers){
         if(err){
           console.log(err);
         }else{
           if(foundUsers) {
             res.render("favb", {facavailable: foundUsers});
           }
         }
      });
    }
    else{ res.redirect("/sLog"); }
   })(req, res, next);
});

app.get('/mybook', (req, res, next) => {
   passport.authenticate('userLocal', {}, (err, user, info) => {
     if(!err){
       User.findById(req.user._id, function(err, foundUser){
          if(err){
            console.log(err);
          }else{
            if(foundUser) {
              res.render("mybookings", {mybooking: foundUser});
            }
          }
       });
      }
     else{ res.redirect("/sLog"); }
    })(req, res, next);
});

app.get('/fbk', (req, res, next) => {
   passport.authenticate('facultyLocal', {}, (err, user, info) => {
      if(!err){
        console.log(req.user.username);
       console.log('into /fbk');
        Facultyd.findOne({ "username" : req.user.username} , function(err, foundFac){
          console.log(req.user.username);
          if(err){
            console.log(err);
          }else{
            if(foundFac) {
              console.log("Foundfac value is "+ foundFac)
              console.log('Found faculty doc');
              User.find({ "faculty_" : foundFac.uname_ , "userEmail_" : {$ne : null}}, function(err, foundUsers){
                 console.log('Searching in user doc');
                 if(err){
                   console.log(err);
                 }else{
                  if(foundUsers){
                    console.log('foundUsers value is:'+foundUsers);
                   console.log('found faculty bookings');
                   res.render("facbookings", {facbooking: foundUsers});
                 }
                 }
              });
            }
          }
       });
     }
     else{ res.redirect("/fLog"); }
    })(req, res, next);
});



/*app.get('/logout', function (req, res){
  req.logOut()  // <-- not req.logout();
  res.redirect('/')
});*/
/*app.get('/logout', function (req, res){
  req.session.destroy(function (err) {
    res.redirect('/'); //Inside a callback… bulletproof!
  });
}); */

app.post("/stuReg" , function(req,res){
  User.register({username:req.body.username},req.body.password, function(err, user) {
    if (err) {
       res.redirect('/sreg');
      console.log(err);
    }else{
      passport.authenticate("userLocal")(req, res, function(){
        res.redirect("/sLog");
      });
    }
  });
});

app.post("/facReg" , function(req,res){
  Facultyd.register({username:req.body.username},req.body.password, function(err, user) {
    if (err) {
       res.redirect('/freg');
      console.log(err);
    }else{
      passport.authenticate("facultyLocal")(req, res, function(){
        res.redirect("/flog");
      });
    }
  });
});

app.post("/fdet" , function(req,res){
  Facultyd.findById(req.user._id, function(err, foundUser){
     if(err){
       console.log(err);
     }else{
       if(foundUser) {
         foundUser.uname_ = req.body.name;
         foundUser.purpose_ = req.body.timings;
         foundUser.save(function() {
          console.log("faculty name saved Successfully");
          res.render("fgeneral",{foundUser : foundUser});
         });
       }
     }
  });

});

app.post("/fupd" , function(req,res){
  Facultyd.findById(req.user._id, function(err, foundUser){
     if(err){
       console.log(err);
     }else{
       if(foundUser) {
         foundUser.purpose_ = req.body.timings;
         foundUser.save(function() {
          console.log("faculty timings saved Successfully");
            res.render("fgeneral",{foundUser : foundUser});
         });
       }
     }
  });
});


app.get("/fh" , function(req,res){
  Facultyd.findById(req.user._id, function(err, foundUser){
     if(err){
       console.log(err);
     }else{
       if(foundUser) {
            res.render("fgeneral",{foundUser : foundUser});
       }
     }
  });
});

app.post("/facLog" , function(req,res){
const user = new Facultyd({
  username: req.body.username,
  password: req.body.password
});
req.logIn(user, function(err){
  if(err){
    console.log(err);
  }else{
    passport.authenticate("facultyLocal")(req, res, function(){
      console.log('Successfully logged in');
      Facultyd.findById(req.user._id, function(err, foundUser){
         if(err){
           console.log(err);
         }else{
           if(foundUser.uname_) {
             res.render("fgeneral", {foundUser : foundUser});
           }else{
             res.render("facdet",{});
           }
         }
      });
       //res.render("facdet");
      console.log('Redirected Successfully');
    });
  }
});
});


app.post("/stuLog" , function(req,res){
const user = new User({
  username: req.body.username,
  password: req.body.password
});
req.logIn(user, function(err){
  if(err){
    console.log(err);
  }else{
    passport.authenticate("userLocal")(req, res, function(){
      res.render("sthome");
    });
  }
});
});

app.post("/book", function(req,res){
  // console.log(req.user); //has current user details
  const uname=req.body.name;
  const userEmail=req.body.email;
  const purpose=req.body.purpose;
  const faculty=req.body.faculty;
  const date=req.body.date;
console.log(req.body.date);
Facultyd.findOne({ "uname_" : faculty}, function(err,doc){
  if(doc){
   let config = {
        service : 'gmail',
        auth : {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
        }
    };
  let transporter = nodemailer.createTransport(config);

  let message = {
      to : [doc.username , req.body.email] ,
      from : process.env.EMAIL,
      subject: 'Appointments Made Easy',
      text: `Appointment booking details:  \nStudent : ${uname}, \nFaculty : ${faculty}, \nDate: ${date}, \nPurpose: ${purpose} \nAppointment has been booked.`
  };

  transporter.sendMail(message, function(err, result) {
        if (err){
        console.log(err)
            res.json('Opps error occured')
        } else{
          User.findById(req.user._id, function(err, foundUser){
             if(err){
               console.log(err);
             }else{
               if(foundUser) {
                 foundUser.uname_ = uname;
                 foundUser.userEmail_ = userEmail;
                 foundUser.purpose_ = purpose;
                 foundUser.faculty_ = faculty;
                 foundUser.date_ = date;
                 foundUser.save(function() {
                   res.redirect("/dashboard");
                 });
               }
             }
          });
        }
    })
}
});
});

app.post("/cancel1" ,function(req, res){
  console.log(req.user.username);
const id = req.body.c1button;
 User.findById(id, function (err, docu) {
    if (err){
        console.log(err);
    }
    else{
        console.log(docu);
        Facultyd.findOne({ "uname_" : docu.faculty_}, function(err,doc){
          if(doc){
           let config = {
                service : 'gmail',
                auth : {
                    user: process.env.EMAIL,
                    pass: process.env.PASSWORD
                }
            };
          let transporter = nodemailer.createTransport(config);

          let message = {
              to : [docu.userEmail_ , doc.email] ,
              from : process.env.EMAIL,
              subject: 'AppointmentsMadeEasy',
              text: `Appointment booking details: \nStudent: ${docu.uname_}, \nFaculty: ${docu.faculty_},\nDate: ${docu.date_} , \nPurpose: ${docu.purpose_}, \nis cancelled by ${docu.uname_}. `
          };

          transporter.sendMail(message, function(err, result) {
                if (err){
                console.log(err)
                    res.json('Opps error occured')
                } else{
                  docu.uname_ =undefined ;
                  docu.userEmail_ =undefined;
                  docu.purpose_ =undefined;
                  docu.faculty_ =undefined;
                  docu.date_ =undefined;

                  docu.save();
                  console.log(docu);
                  res.redirect("/mybook");
                }
            })
        }
        });
    }
});

});

app.post("/cancel2" ,function(req, res){
  console.log(req.user.username);
const id = req.body.c2button;
User.findById(id, function (err, docu) {
  if (err){
      console.log(err);
  }
  else{
      console.log(docu);
      Facultyd.findOne({ "uname_" : docu.faculty_}, function(err,doc){
        if(doc){
         let config = {
              service : 'gmail',
              auth : {
                  user: process.env.EMAIL,
                  pass: process.env.PASSWORD
              }
          };
        let transporter = nodemailer.createTransport(config);
        let message = {
            to : [doc.username , docu.userEmail_] ,
            from : process.env.EMAIL,
            subject: 'Appointments Made Easy',
            text: `Appointment booking details: \nStudent: ${docu.uname_}, \nFaculty: ${docu.faculty_},\nDate: ${docu.date_} , \nPurpose: ${docu.purpose_}, \nis cancelled by ${doc.uname_}. `
        };
        transporter.sendMail(message, function(err, result) {
              if (err){
              console.log(err)
                  res.json('Opps error occured')
              } else{
                docu.uname_ =undefined ;
                docu.userEmail_ =undefined;
                docu.purpose_ =undefined;
                docu.faculty_ =undefined;
                docu.date_ =undefined;

                docu.save();
                console.log(docu);
                res.redirect("/fbk");
              }
          })
      }
      });
  }
});
});

app.post('/logout', function(req, res, next){
  req.logOut(function(err) {
    if (err) { return next(err); }
      res.redirect('/');
  });
});

app.listen(3000,function(){
  console.log("Server started Successfully");
});
