import express from "express";
import cors from "cors";
import axios from "axios";
import https from "https";
import FormData from "form-data";
import bodyParser from "body-parser";
import path from "path";
import multer from "multer";
const vuePath = path.resolve() + '/../../dist';
const DEBUG = false;
const app = express();
const port = 8083;
let connectorUrl = "https://localhost:8080"
let auth = {
    username: 'admin',
    password: 'password'
}
let httpsAgent = new https.Agent({
    maxVersion: "TLSv1.2",
    minVersion: "TLSv1.2",
    rejectUnauthorized: false
    //ca: fs.readFileSync('dsc.crt')
});

if (process.env.CONNECTOR_URL !== undefined) {
    connectorUrl = process.env.CONNECTOR_URL;
}

if (process.env.CONNECTOR_USER !== undefined) {
    auth.username = process.env.CONNECTOR_USER;
}

if (process.env.CONNECTOR_PASSWORD !== undefined) {
    auth.password = process.env.CONNECTOR_PASSWORD;
}

app.use(express.static(vuePath));
//app.use(fileUpload());

app.use(cors({ credentials: true, origin: true }));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

function post(url, data) {
    if (DEBUG) {
        console.log(">>> POST " + url);
        console.log(">>> DATA: ", data);
    }
    return axios.post(url, data, {
        headers: { 'content-type': 'application/json' },
        auth,
        httpsAgent
    });
}

function put(url, data) {
    if (DEBUG) {
        console.log(">>> PUT " + url);
        console.log(">>> DATA: ", data);
    }
    return axios.put(url, data, {
        headers: { 'content-type': 'application/json' },
        auth,
        httpsAgent
    });
}

function get(url) {
    if (DEBUG) {
        console.log(">>> GET " + url);
    }
    return axios.get(url, {
        headers: { 'content-type': 'application/json' },
        auth,
        httpsAgent
    });
}

function del(url, data) {
    if (DEBUG) {
        console.log(">>> DELETE " + url);
        console.log(">>> DATA: ", data);
    }
    return axios.delete(url, {
        data: data,
        headers: { 'content-type': 'application/json' },
        auth,
        httpsAgent
    });
}

function escape(text) {
    return encodeURIComponent(text);
}

function stringifySafe(obj, replacer, spaces, cycleReplacer) {
    return JSON.stringify(obj, serializer(replacer, cycleReplacer), spaces)
}

function serializer(replacer, cycleReplacer) {
    var stack = [], keys = []

    if (cycleReplacer == null) cycleReplacer = function (key, value) {
        if (stack[0] === value) return "[Circular ~]"
        return "[Circular ~." + keys.slice(0, stack.indexOf(value)).join(".") + "]"
    }

    return function (key, value) {
        if (stack.length > 0) {
            var thisPos = stack.indexOf(this)
            ~thisPos ? stack.splice(thisPos + 1) : stack.push(this)
            ~thisPos ? keys.splice(thisPos, Infinity, key) : keys.push(key)
            if (~stack.indexOf(value)) value = cycleReplacer.call(this, key, value)
        }
        else stack.push(value)

        return replacer == null ? value : replacer.call(this, key, value)
    }
}

app.get('/', function (req, res) {
    res.sendFile(vuePath + "index.html");
});


const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
app.post("/upload", upload.single('file'), async (req, res) => {

    const { file } = req
    const { buffer, originalname: filename } = file
    const formData = new FormData()
    formData.append('mf', buffer, {
        filename,
    })
    formData.append('str',"hello world");
    let url = connectorUrl + "/upload";

    try {
        const response = await axios.post(url, formData, {
            auth,
            httpsAgent,
            headers: {
                ...formData.getHeaders()
            }
        });

        res.send(response.data);
        console.log(response.data);
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});

app.post('/', (req, res) => {
    let call = req.body.url;
    let i = 0;
    for (let key in req.body.params) {
        if (i == 0) {
            call += "?" + key + "=" + escape(req.body.params[key]);
        } else {
            call += "&" + key + "=" + escape(req.body.params[key]);
        }
        i++;
    }
    if (req.body.type == "POST") {
        post(connectorUrl + call, req.body.body).then(response => {
            res.send(response.data);
        }).catch(error => {
            if (error.response === undefined) {
                console.log("Error on POST " + req.body.url, error);
                res.send(stringifySafe(error));
            } else {
                console.log("Error on POST " + req.body.url, stringifySafe(error.response));
                res.send(stringifySafe(error.response));
            }

        });
    } else if (req.body.type == "PUT") {
        put(connectorUrl + call, req.body.body).then(response => {
            res.send(response.data);
        }).catch(error => {
            if (error.response === undefined) {
                console.log("Error on PUT " + req.body.url, error);
                res.send(stringifySafe(error));
            } else {
                console.log("Error on PUT " + req.body.url, stringifySafe(error.response));
                res.send(stringifySafe(error.response));
            }
        });
    } else if (req.body.type == "GET") {
        get(connectorUrl + call).then(response => {
            res.send(response.data);
        }).catch(error => {
            if (error.response === undefined) {
                console.log("Error on GET " + req.body.url, error);
                res.send(stringifySafe(error));
            } else {
                console.log("Error on GET " + req.body.url, stringifySafe(error.response));
                res.send(stringifySafe(error.response));
            }
        });
    } else if (req.body.type == "DELETE") {
        del(connectorUrl + call, req.body.body).then(response => {
            res.send(response.data);
        }).catch(error => {
            if (error.response === undefined) {
                console.log("Error on DELETE " + req.body.url, error);
                res.send(stringifySafe(error));
            } else {
                console.log("Error on DELETE " + req.body.url, stringifySafe(error.response));
                res.send(stringifySafe(error.response));
            }
        });
    }
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});
