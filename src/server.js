const http = require('http');
const fs = require('fs');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

//Helper: sendJson
const respondJSON = (request, response, status, object) => {
    response.writeHead(status, { 'Content-Type': 'application/json' });
    response.write(JSON.stringify(object));
    response.end();
};

//Helpe: send XML
const respondXML = (request, response, status, message, id) => {
    let xml = '<response>';
    xml += `<message>${message}</message>`;
    if (id) {
        xml += `<id>${id}</id>`;
    }
    xml += '</response>';

    response.writeHead(status, { 'Content-Type': 'text/xml' });
    response.write(xml);
    response.end();
};
//Determines JSON vs XML based on Accept header
const handleResponse = (request, response, status, message, id) => {
    const accept = request.headers.accept || 'application/json';

    if (accept.includes('xml')) {
        respondXML(request, response, status, message, id);
    } else {
        const obj = { message };
        if (id) obj.id = id;
        respondJSON(request, response, status, obj);
    }
};

const onRequest = (request, response) => {
    const protocol = request.socket.encrypted ? 'https' : 'http';
    const parsedUrl = new URL(request.url, `${protocol}://${request.headers.host}`);
    const pathname = parsedUrl.pathname;
    const query = Object.fromEntries(parsedUrl.searchParams);

    switch (pathname) {
        case '/':
            fs.readFile(`${__dirname}/../client/client.html`, (err, data) => {
                if (err) {
                    handleResponse(request, response, 500, 'File not found', 'internal');
                    return;
                }
                response.writeHead(200, { 'Content-Type': 'text/html' });
                response.write(data);
                response.end();
            });
            break;

        case '/style.css':
            fs.readFile(`${__dirname}/../client/style.css`, (err, data) => {
                if (err) {
                    handleResponse(request, response, 500, 'File not found', 'internal');
                    return;
                }
                response.writeHead(200, { 'Content-Type': 'text/css' });
                response.write(data);
                response.end();
            });
            break;

        case '/success':
            handleResponse(request, response, 200, 'This request has succeeded');
            break;

        case '/badRequest':
            if (!query.valid || query.valid !== 'true') {
                handleResponse(
                    request,
                    response,
                    400,
                    'Missing valid query parameter',
                    'badRequest'
                );
            } else {
                handleResponse(
                    request,
                    response,
                    200,
                    'Valid query parameter found'
                );
            }
            break;

        case '/unauthorized':
            if (!query.loggedIn || query.loggedIn !== 'yes') {
                handleResponse(
                    request,
                    response,
                    401,
                    'Missing loggedIn query parameter',
                    'unauthorized'
                );
            } else {
                handleResponse(
                    request,
                    response,
                    200,
                    'You are logged in'
                );
            }
            break;

        case '/forbidden':
            handleResponse(
                request,
                response,
                403,
                'You do not have access',
                'forbidden'
            );
            break;

        case '/internal':
            handleResponse(
                request,
                response,
                500,
                'Internal server error',
                'internal'
            );
            break;

        case '/notImplemented':
            handleResponse(
                request,
                response,
                501,
                'Not implemented',
                'notImplemented'
            );
            break;

        default:
            handleResponse(
                request,
                response,
                404,
                'Resource not found',
                'notFound'
            );
            break;
    }
};


http.createServer(onRequest).listen(port);
