'use strict';

import { Server } from '@hapi/hapi';

const init = async () => {

    const server = Server({
        port: 3000,
        host: 'localhost'
    });

    server.route({
        method: 'POST',
        path: '/api',
        options: {
            payload: {
                allow: ["multipart/mixed", "multipart/form-data", "application/json"],
                output: 'stream',
                parse: true
            }
        },
        handler: (request, h) => {
            request.payload.on('data', (d) => {
                const data = JSON.parse(d.toString());
                const { signature } = JSON.parse(Buffer.from(data.data, 'base64').toString('utf8'));
                const signatureBuffer = Buffer.from(signature,'base64').toString('utf8');
                // console.log(signatureBuffer);
                const regexInn = /(?<=TINUA-)[0-9]{10}/;
                const regexFullName = /(?<=,).*(?=1)/;
                // const match = regex.exec(signatureBuffer);
                const [ inn ] = signatureBuffer.match(regexInn);
                const [name] = signatureBuffer.match(regexFullName);
                console.log(inn);
                console.log(name);
              return d.toString();
            })

            return 'Hello aaaaaa!';
        }
    });


    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();