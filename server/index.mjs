import http from 'http';
import fs from 'fs';
import path from 'path';
import { Buffer } from 'buffer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const FOLDER = process.env.FOLDER || __dirname;
const FAV_ICON = path.join(__dirname, 'favicon.ico');
const FILE_VERSION = path.join(FOLDER, 'version.txt');
const FILE_CONFIG = path.join(FOLDER, 'config.json')
const ENABLE_LOG = process.env.DEBUG || false;
class APP {
    ready = false;
    version = -1;
    config = {};
    constructor() {
        if (fs.existsSync(FILE_VERSION)) {
            const content = fs.readFileSync(FILE_VERSION, 'utf8');
            const version = parseInt(content);
            if (!isNaN(version)) {
                this.version = version;
            }
        }
        if (fs.existsSync(FILE_CONFIG)) {
            const content = fs.readFileSync(FILE_CONFIG, 'utf8');
            try {
                const config = JSON.parse(content);
                if (config) {
                    this.config = config;
                }
            } catch (e) {

            }
        }

        this.ready = true;
    }

    updateVersion(version) {
        this.version = version;
        fs.writeFileSync(FILE_VERSION, version.toString());
    }
    getVersion() {
        return this.version;
    }

    getConfig() {
        return this.config;
    }
    updateConfig(config) {
        this.config = config;
        fs.writeFileSync(FILE_CONFIG, JSON.stringify(config));
    }

}

const app = new APP();
const PORT = process.env.PORT || 4000;
const handleRequestBody = (req, cb) => {
    let body = [];
    req.on('data', (chunk) => {
        body.push(chunk);
    })
    req.on('end', () => {
        const data = Buffer.concat(body).toString()
        cb(data)
    })
}
const server = http.createServer((req, res) => {
    const reqUrl = new URL(req.url, `http://${req.headers.host}`);
    if (ENABLE_LOG) console.log(new Date().toLocaleString(), req.method + ' ' + req.url);
    if (reqUrl.pathname === '/favicon.ico') {
        res.setHeader('Content-Type', 'image/x-icon')
        res.setHeader('Cache-Control', 'public, max-age=31536000')
        fs.createReadStream(FAV_ICON).pipe(res)
    } else if (reqUrl.pathname === '/version' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ version: app.getVersion() }));
    } else if (reqUrl.pathname === '/config' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(app.getConfig()));
    } else if (reqUrl.pathname === '/version' && req.method === 'POST') {
        handleRequestBody(req, (data) => {
            try {
                const version = parseInt(data);
                if (!isNaN(version)) {
                    app.updateVersion(version);
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ version: app.getVersion() }));
                } else {
                    throw new Error('not a number')
                }
            } catch (e) {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ version: app.getVersion(), message: e?.message }));
            }
        })
    } else if (reqUrl.pathname === '/config' && req.method === 'POST') {
        if (reqUrl.searchParams.has('version')) {
            const version = parseInt(reqUrl.searchParams.get('version'));
            if (isNaN(version)) {
                res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ version: app.getVersion(), message: 'version is not a number' }));
                return;
            } else if (version !== app.getVersion()) {
                res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ version: app.getVersion(), message: 'version is not match' }));
                return;
            } else {
                handleRequestBody(req, (data) => {
                    try {
                        const config = JSON.parse(data);
                        if (version !== app.getVersion()) {
                            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                            res.end(JSON.stringify({ version: app.getVersion(), message: 'version is not match' }));
                            return;
                        }
                        if (typeof config === 'object') {
                            app.updateConfig(config);
                            app.updateVersion(version + 1)
                            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                            res.end(JSON.stringify({ version: app.getVersion() }));
                        } else {
                            throw new Error('not a number')
                        }
                    } catch (e) {
                        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({ version: app.getVersion(), message: e?.message }));
                    }
                })
            }
        } else {
            res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
            res.end(JSON.stringify({ version: app.getVersion(), message: 'version is not found' }))
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end()
    }

});
server.listen(PORT, () => {
    console.log('Server is running on port', PORT);
});