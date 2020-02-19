const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

// Mongo URI
const mongoURI = 'mongodb://localhost:27017/mongouploads';
let url = "mongodb://localhost:27017/mongouploads";
//Create mongo connection
const conn = mongoose.createConnection(mongoURI,{ useNewUrlParser: true, useUnifiedTopology: true },function(err, client) {
  console.log("Mongo db connected");
});

//const conn  = MongoClient;
// Init gfs
let gfs;

conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});

// Create storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
        const filename =file.originalname;
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads' 
        };
        
        resolve(fileInfo);
      
    });
  }
});
const upload = multer({ storage });

// @route POST /upload
// @desc  Uploads file to DB
app.post('/upload', upload.single('file'), (req, res) => {
  //fileurl : mongoURI+bucketName+filename;
  let fname = req.file.filename;
  let ftype = req.file.contentType;
  let type;
  if(ftype =='application/pdf'){
      type = 'files';
  }else{
    type ='image';
  }
  
  console.log(ftype);
  console.log(type);
  //mongoURI
  let fileurl = "http://localhost:"+port+"/"+type+"/"+fname;
  console.log(fileurl);
  //res.json({ file: req.file });
  res.status(201).send({status:true, message : "file uploaded successfully", fileurl :fileurl});
});

// @route GET /files
// Display all files in JSON
app.get('/files', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    // Check if files
    if (!files || files.length === 0) {
      return res.status(404).json({
        err: 'No files exist'
      });
    }

    // Files exist
    return res.json(files);
  });
});

// @route GET /files/:filename
// Display single file object
app.get('/files/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }
    // File exists
    console.log(file);
    const readstream = gfs.createReadStream(file.filename);
    readstream.pipe(res);
    //return res.send(file);
  });
});

// @route GET /image/:filename
// Display Image
app.get('/image/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }

    // Check if image
    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
      
    } else {
      res.status(404).json({
        err: 'Not an image'
      });
    }
  });
});

const port = 5000;

app.listen(port, () => console.log(`Server started on port ${port}`));